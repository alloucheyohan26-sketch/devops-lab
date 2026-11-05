/**
 * Integration tests for /api/reservations (full CRUD + SMAR-24 acceptance criteria).
 * Tests run in order and share the same in-memory data.
 * The 15-minute hold is tested by faking the clock (only Date is faked).
 */
import { describe, it, expect, afterAll, vi } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import { HOLD_MINUTES } from '../src/routes/auto/reservations.route.js'

const MINUTE = 60 * 1000

const newReservation = {
  locker_id: 4,
  user_id: 2,
  start_time: '2025-03-05T08:00:00Z',
  end_time: '2025-03-05T12:00:00Z'
}

describe('Reservations API (/api/reservations) - Full CRUD', () => {
  describe('GET', () => {
    it('GET /api/reservations returns the list of reservations (200)', async () => {
      const res = await request(app).get('/api/reservations')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThanOrEqual(3)
      expect(res.body[0]).toHaveProperty('locker_id')
      expect(res.body[0]).toHaveProperty('hold_remaining_seconds')
    })

    it('a confirmed reservation has no countdown', async () => {
      const res = await request(app).get('/api/reservations/101')
      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({ id: 101, status: 'CONFIRMED', hold_expires_at: null, hold_remaining_seconds: null })
    })

    it('a reservation pending payment shows its countdown', async () => {
      const res = await request(app).get('/api/reservations/103')
      expect(res.body.status).toBe('PENDING_PAYMENT')
      expect(res.body.hold_remaining_seconds).toBeGreaterThan(0)
      expect(res.body.hold_remaining_seconds).toBeLessThanOrEqual(HOLD_MINUTES * 60)
    })

    it('GET /api/reservations/:id returns 404 for an unknown id', async () => {
      const res = await request(app).get('/api/reservations/999')
      expect(res.status).toBe(404)
      expect(res.body).toEqual({ error: 'Reservation not found' })
    })
  })

  describe('POST - hold a locker', () => {
    it('creates the booking with status PENDING_PAYMENT, held for 15 minutes (201)', async () => {
      const before = Date.now()
      const res = await request(app).post('/api/reservations').send({ ...newReservation, status: 'CONFIRMED' })
      expect(res.status).toBe(201)
      expect(res.body).toMatchObject({
        id: 104,
        locker_id: 4,
        user_id: 2,
        start_time: '2025-03-05T08:00:00.000Z',
        end_time: '2025-03-05T12:00:00.000Z',
        status: 'PENDING_PAYMENT',
        hold_remaining_seconds: HOLD_MINUTES * 60
      })
      const expires = new Date(res.body.hold_expires_at).getTime()
      expect(expires - before).toBeGreaterThanOrEqual(HOLD_MINUTES * MINUTE)
      expect(expires - before).toBeLessThan(HOLD_MINUTES * MINUTE + 5000)
    })

    it('returns 400 when a required field is missing', async () => {
      const res = await request(app).post('/api/reservations').send({ locker_id: 4 })
      expect(res.status).toBe(400)
      expect(res.body.error).toMatch(/Missing required fields/)
    })

    it('returns 400 when locker_id is not a positive integer', async () => {
      const res = await request(app).post('/api/reservations').send({ ...newReservation, locker_id: 'abc' })
      expect(res.status).toBe(400)
    })

    it('returns 400 for an invalid date', async () => {
      const res = await request(app).post('/api/reservations').send({ ...newReservation, start_time: 'not-a-date' })
      expect(res.status).toBe(400)
      expect(res.body.error).toMatch(/valid ISO dates/)
    })

    it('returns 400 when end_time is before start_time', async () => {
      const res = await request(app).post('/api/reservations').send({
        ...newReservation,
        start_time: '2025-03-06T12:00:00Z',
        end_time: '2025-03-06T08:00:00Z'
      })
      expect(res.status).toBe(400)
      expect(res.body).toEqual({ error: 'end_time must be after start_time' })
    })

    it('two overlapping bookings on the same locker are impossible (409)', async () => {
      const res = await request(app).post('/api/reservations').send({
        ...newReservation,
        user_id: 3,
        start_time: '2025-03-05T10:00:00Z',
        end_time: '2025-03-05T14:00:00Z'
      })
      expect(res.status).toBe(409)
      expect(res.body).toEqual({ error: 'Locker already reserved for this period' })
    })
  })

  describe('PUT', () => {
    it('payment confirms the booking and stops the countdown (200)', async () => {
      const res = await request(app).put('/api/reservations/104').send({ status: 'CONFIRMED', id: 999 })
      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({ id: 104, locker_id: 4, status: 'CONFIRMED', hold_expires_at: null, hold_remaining_seconds: null })
    })

    it('a confirmed booking cannot go back to PENDING_PAYMENT (400)', async () => {
      const res = await request(app).put('/api/reservations/104').send({ status: 'PENDING_PAYMENT' })
      expect(res.status).toBe(400)
    })

    it('the client cannot extend the hold', async () => {
      const before = await request(app).get('/api/reservations/103')
      const res = await request(app).put('/api/reservations/103').send({ hold_expires_at: '2099-01-01T00:00:00.000Z' })
      expect(res.status).toBe(200)
      expect(res.body.hold_expires_at).toBe(before.body.hold_expires_at)
    })

    it('returns 400 for an unknown status', async () => {
      const res = await request(app).put('/api/reservations/102').send({ status: 'LOST' })
      expect(res.status).toBe(400)
      expect(res.body.error).toMatch(/status must be one of/)
    })

    it('returns 400 when the update makes the dates invalid', async () => {
      const res = await request(app).put('/api/reservations/102').send({ end_time: '2025-03-01T08:00:00Z' })
      expect(res.status).toBe(400)
    })

    it('returns 409 when moving a booking onto a reserved slot', async () => {
      const res = await request(app).put('/api/reservations/102').send({ locker_id: 1 })
      expect(res.status).toBe(409)
    })

    it('returns 404 for an unknown id', async () => {
      const res = await request(app).put('/api/reservations/999').send({ status: 'CONFIRMED' })
      expect(res.status).toBe(404)
    })
  })

  describe('15-minute hold (fake clock)', () => {
    const slot = { locker_id: 5, user_id: 1, start_time: '2025-04-01T08:00:00Z', end_time: '2025-04-01T10:00:00Z' }
    let t0
    let heldId

    afterAll(() => {
      vi.useRealTimers()
    })

    it('the locker stays held during the 15 minutes', async () => {
      vi.useFakeTimers({ toFake: ['Date'] })
      t0 = Date.now()
      const created = await request(app).post('/api/reservations').send(slot)
      expect(created.status).toBe(201)
      heldId = created.body.id

      vi.setSystemTime(t0 + 14 * MINUTE)
      const res = await request(app).get(`/api/reservations/${heldId}`)
      expect(res.body.status).toBe('PENDING_PAYMENT')
      expect(res.body.hold_remaining_seconds).toBe(60)

      const other = await request(app).post('/api/reservations').send({ ...slot, user_id: 2 })
      expect(other.status).toBe(409)
    })

    it('the hold is released automatically after 15 minutes (EXPIRED)', async () => {
      vi.setSystemTime(t0 + HOLD_MINUTES * MINUTE + 1000)
      const res = await request(app).get(`/api/reservations/${heldId}`)
      expect(res.body).toMatchObject({ status: 'EXPIRED', hold_expires_at: null, hold_remaining_seconds: null })

      const other = await request(app).post('/api/reservations').send({ ...slot, user_id: 2 })
      expect(other.status).toBe(201)
    })

    it('an expired hold can no longer be paid (409)', async () => {
      const res = await request(app).put(`/api/reservations/${heldId}`).send({ status: 'CONFIRMED' })
      expect(res.status).toBe(409)
      expect(res.body.error).toMatch(/Hold expired/)
    })

    it('a paid booking never expires', async () => {
      const res = await request(app).get('/api/reservations/104')
      expect(res.body.status).toBe('CONFIRMED')
    })
  })

  describe('DELETE', () => {
    it('deletes a reservation (204) and it is gone afterwards (404)', async () => {
      const res = await request(app).delete('/api/reservations/102')
      expect(res.status).toBe(204)

      const check = await request(app).get('/api/reservations/102')
      expect(check.status).toBe(404)
    })

    it('returns 404 when deleting an unknown id', async () => {
      const res = await request(app).delete('/api/reservations/999')
      expect(res.status).toBe(404)
    })
  })
})
