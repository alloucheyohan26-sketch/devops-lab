import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'

describe('Notifications API (/api/notifications) - Full CRUD', () => {
  it('GET /api/notifications should return a list of notifications (200 OK)', async () => {
    const res = await request(app).get('/api/notifications')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)
    expect(res.body[0]).toHaveProperty('reservation_id')
    expect(res.body[0]).toHaveProperty('channel')
    expect(res.body[0]).toHaveProperty('delivery_status')
  })

  it('GET /api/notifications/:id should return a single notification (200 OK) or 404 if not found', async () => {
    const resValid = await request(app).get('/api/notifications/1')
    expect(resValid.status).toBe(200)
    expect(resValid.body).toHaveProperty('id', 1)
    expect(resValid.body).toHaveProperty('channel', 'email')

    const resNotFound = await request(app).get('/api/notifications/999')
    expect(resNotFound.status).toBe(404)
    expect(resNotFound.body).toHaveProperty('error', 'Notification not found')
  })

  it('POST /api/notifications should create a new notification (201 Created) or return 400 on missing fields', async () => {
    const newNotification = {
      reservation_id: 104,
      channel: 'email',
      sent_at: '2025-03-01T11:30:00Z',
      delivery_status: 'SENT'
    }
    const resCreated = await request(app).post('/api/notifications').send(newNotification)
    expect(resCreated.status).toBe(201)
    expect(resCreated.body).toHaveProperty('id', 4)
    expect(resCreated.body).toHaveProperty('reservation_id', 104)
    expect(resCreated.body).toHaveProperty('channel', 'email')

    const resBadRequest = await request(app).post('/api/notifications').send({ reservation_id: 105 })
    expect(resBadRequest.status).toBe(400)
    expect(resBadRequest.body).toHaveProperty('error')
  })

  it('PUT /api/notifications/:id should update an existing notification (200 OK) or return 400/404', async () => {
    const updatedData = {
      reservation_id: 101,
      channel: 'SMS',
      sent_at: '2025-03-01T08:45:00Z',
      delivery_status: 'DELIVERED'
    }
    const resUpdated = await request(app).put('/api/notifications/1').send(updatedData)
    expect(resUpdated.status).toBe(200)
    expect(resUpdated.body).toHaveProperty('id', 1)
    expect(resUpdated.body).toHaveProperty('channel', 'SMS')
    expect(resUpdated.body).toHaveProperty('delivery_status', 'DELIVERED')

    const resBadRequest = await request(app).put('/api/notifications/1').send({ reservation_id: 101 })
    expect(resBadRequest.status).toBe(400)

    const resNotFound = await request(app).put('/api/notifications/999').send(updatedData)
    expect(resNotFound.status).toBe(404)
  })

  it('DELETE /api/notifications/:id should delete an existing notification (204 No Content) or return 404', async () => {
    const resDeleted = await request(app).delete('/api/notifications/3')
    expect(resDeleted.status).toBe(204)

    const resVerify = await request(app).get('/api/notifications/3')
    expect(resVerify.status).toBe(404)

    const resNotFound = await request(app).delete('/api/notifications/999')
    expect(resNotFound.status).toBe(404)
  })
})
