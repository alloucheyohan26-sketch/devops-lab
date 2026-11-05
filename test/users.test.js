import request from 'supertest'
import app from '../src/app.js'
import { describe, it, expect } from 'vitest'

describe('Users API (SmartLocker CRUD)', () => {
  it('GET /api/users returns array of users', async () => {
    const res = await request(app).get('/api/users')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThanOrEqual(3)
  })

  it('GET /api/users/:id returns a single user or 404 if not found', async () => {
    const res = await request(app).get('/api/users/1')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('email', 'alice.martin@edu.devinci.fr')

    const missing = await request(app).get('/api/users/999')
    expect(missing.status).toBe(404)
    expect(missing.body).toHaveProperty('error', 'User not found')
  })

  it('POST /api/users creates a user or returns 400 if fields are missing', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({
        name: 'Lucas Moreau',
        email: 'lucas.moreau@edu.devinci.fr',
        phone: '+33655443322',
        role: 'Student'
      })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body).toHaveProperty('role', 'Student')

    const bad = await request(app)
      .post('/api/users')
      .send({ name: 'Incomplete User' })
    expect(bad.status).toBe(400)
  })

  it('PUT /api/users/:id updates a user or returns 404 if not found', async () => {
    const res = await request(app)
      .put('/api/users/2')
      .send({ phone: '+33600001111' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('phone', '+33600001111')

    const missing = await request(app)
      .put('/api/users/999')
      .send({ phone: '+33600001111' })
    expect(missing.status).toBe(404)
  })

  it('DELETE /api/users/:id deletes a user or returns 404 if not found', async () => {
    const res = await request(app).delete('/api/users/3')
    expect(res.status).toBe(204)

    const missing = await request(app).delete('/api/users/999')
    expect(missing.status).toBe(404)
  })
})
