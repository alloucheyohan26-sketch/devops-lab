/**
 * Integration tests for /api/reservations (full CRUD).
 * Tests run in order and share the same in-memory data.
 */
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'

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
      expect(res.body[0]).toHaveProperty('user_id')
      expect(res.body[0]).toHaveProperty('status')
    })

    it('GET /api/reservations/:id returns one reservation (200)', async () => {
      const res = await request(app).get('/api/reservations/101')
      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({ id: 101, locker_id: 1, user_id: 1, status: 'CONFIRMED' })
    })

    it('GET /api/reservations/:id returns 404 for an unknown id', async () => {
      const res = await request(app).get('/api/reservations/999')
      expect(res.status).toBe(404)
      expect(res.body).toEqual({ error: 'Reservation not found' })
    })
  })

  describe('POST', () => {
    it('holds the locker: new reservation has status HELD by default (201)', async () => {
      const res = await request(app).post('/api/reservations').send(newReservation)
      expect(res.status).toBe(201)
      expect(res.body).toEqual({
        id: 104,
        locker_id: 4,
        user_id: 2,
        start_time: '2025-03-05T08:00:00.000Z',
        end_time: '2025-03-05T12:00:00.000Z',
        status: 'HELD'
      })
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

    it('returns 400 for an unknown status', async () => {
      const res = await request(app).post('/api/reservations').send({ ...newReservation, status: 'LOST' })
      expect(res.status).toBe(400)
      expect(res.body.error).toMatch(/status must be one of/)
    })

    it('returns 409 when the locker is already reserved for that period', async () => {
      const res = await request(app).post('/api/reservations').send({
        ...newReservation,
        start_time: '2025-03-05T10:00:00Z',
        end_time: '2025-03-05T14:00:00Z'
      })
      expect(res.status).toBe(409)
      expect(res.body).toEqual({ error: 'Locker already reserved for this period' })
    })

    it('allows the same slot when the existing reservation is cancelled', async () => {
      await request(app).put('/api/reservations/104').send({ status: 'CANCELLED' })
      const res = await request(app).post('/api/reservations').send(newReservation)
      expect(res.status).toBe(201)
      expect(res.body.id).toBe(105)
    })
  })

  describe('PUT', () => {
    it('books a held locker: HELD -> CONFIRMED, other fields and id kept (200)', async () => {
      const res = await request(app).put('/api/reservations/103').send({ status: 'CONFIRMED', id: 999 })
      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({ id: 103, locker_id: 3, user_id: 1, status: 'CONFIRMED' })

      const check = await request(app).get('/api/reservations/103')
      expect(check.body.status).toBe('CONFIRMED')
    })

    it('returns 404 for an unknown id', async () => {
      const res = await request(app).put('/api/reservations/999').send({ status: 'CONFIRMED' })
      expect(res.status).toBe(404)
    })

    it('returns 400 when the update makes the dates invalid', async () => {
      const res = await request(app).put('/api/reservations/102').send({ end_time: '2025-03-01T08:00:00Z' })
      expect(res.status).toBe(400)
    })

    it('returns 409 when moving a reservation onto a reserved slot', async () => {
      const res = await request(app).put('/api/reservations/102').send({ locker_id: 1 })
      expect(res.status).toBe(409)
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
