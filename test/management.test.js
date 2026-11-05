/**
 * Integration tests for /api/management (full CRUD + role-based access).
 * Tests run in order and share the same in-memory data.
 * Writes (POST, PUT, DELETE) require the header "X-User-Role: Management".
 */
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'

const newMember = { user_id: 4, job: 'Maintenance coordinator' }

// Requests sent as a management user
const asManagement = {
  post: (url) => request(app).post(url).set('X-User-Role', 'Management'),
  put: (url) => request(app).put(url).set('X-User-Role', 'Management'),
  delete: (url) => request(app).delete(url).set('X-User-Role', 'Management')
}

describe('Management API (/api/management) - Full CRUD', () => {
  describe('GET (open to every role)', () => {
    it('GET /api/management returns the list of management staff (200)', async () => {
      const res = await request(app).get('/api/management')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThanOrEqual(1)
      expect(res.body[0]).toHaveProperty('user_id')
      expect(res.body[0]).toHaveProperty('job')
    })

    it('GET /api/management/:id returns one member (200)', async () => {
      const res = await request(app).get('/api/management/1')
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ id: 1, user_id: 3, job: 'Locker administrator' })
    })

    it('GET /api/management/:id returns 404 for an unknown id', async () => {
      const res = await request(app).get('/api/management/999')
      expect(res.status).toBe(404)
      expect(res.body).toEqual({ error: 'Management member not found' })
    })
  })

  describe('Role-based access (SMAR-19)', () => {
    it('POST without X-User-Role returns 401', async () => {
      const res = await request(app).post('/api/management').send(newMember)
      expect(res.status).toBe(401)
      expect(res.body).toEqual({ error: 'Missing X-User-Role header' })
    })

    it('POST as a Student returns 403', async () => {
      const res = await request(app).post('/api/management').set('X-User-Role', 'Student').send(newMember)
      expect(res.status).toBe(403)
      expect(res.body).toEqual({ error: 'Forbidden: requires role Management' })
    })

    it('PUT as a Teacher returns 403 and changes nothing', async () => {
      const res = await request(app).put('/api/management/1').set('X-User-Role', 'Teacher').send({ job: 'Hacked' })
      expect(res.status).toBe(403)

      const check = await request(app).get('/api/management/1')
      expect(check.body.job).toBe('Locker administrator')
    })

    it('DELETE as a Student returns 403 and the member still exists', async () => {
      const res = await request(app).delete('/api/management/1').set('X-User-Role', 'Student')
      expect(res.status).toBe(403)

      const check = await request(app).get('/api/management/1')
      expect(check.status).toBe(200)
    })
  })

  describe('POST', () => {
    it('creates a management member and trims the job (201)', async () => {
      const res = await asManagement.post('/api/management').send({ ...newMember, job: '  Maintenance coordinator  ' })
      expect(res.status).toBe(201)
      expect(res.body).toEqual({ id: 2, ...newMember })
    })

    it('returns 400 when a required field is missing', async () => {
      const res = await asManagement.post('/api/management').send({ user_id: 6 })
      expect(res.status).toBe(400)
      expect(res.body).toEqual({ error: 'Missing required fields: user_id and job are required' })
    })

    it('returns 400 when user_id is not a positive integer', async () => {
      const res = await asManagement.post('/api/management').send({ ...newMember, user_id: -1 })
      expect(res.status).toBe(400)
      expect(res.body).toEqual({ error: 'user_id must be a positive integer' })
    })

    it('returns 400 when job is empty', async () => {
      const res = await asManagement.post('/api/management').send({ user_id: 6, job: '   ' })
      expect(res.status).toBe(400)
      expect(res.body).toEqual({ error: 'job must be a non-empty string' })
    })

    it('returns 409 when the user already has a management profile', async () => {
      const res = await asManagement.post('/api/management').send({ user_id: 3, job: 'Another job' })
      expect(res.status).toBe(409)
      expect(res.body).toEqual({ error: 'This user already has a management profile' })
    })
  })

  describe('PUT', () => {
    it('updates only the fields sent and keeps the id (200)', async () => {
      const res = await asManagement.put('/api/management/1').send({ job: 'Head of locker operations', id: 999 })
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ id: 1, user_id: 3, job: 'Head of locker operations' })

      const check = await request(app).get('/api/management/1')
      expect(check.body.job).toBe('Head of locker operations')
    })

    it('returns 404 for an unknown id', async () => {
      const res = await asManagement.put('/api/management/999').send({ job: 'Locker administrator' })
      expect(res.status).toBe(404)
    })

    it('returns 400 for an invalid update', async () => {
      const res = await asManagement.put('/api/management/1').send({ job: '' })
      expect(res.status).toBe(400)
    })

    it('returns 409 when moving the profile to a user who already has one', async () => {
      const res = await asManagement.put('/api/management/2').send({ user_id: 3 })
      expect(res.status).toBe(409)
    })
  })

  describe('DELETE', () => {
    it('deletes a member (204) and it is gone afterwards (404)', async () => {
      const res = await asManagement.delete('/api/management/2')
      expect(res.status).toBe(204)

      const check = await request(app).get('/api/management/2')
      expect(check.status).toBe(404)
    })

    it('returns 404 when deleting an unknown id', async () => {
      const res = await asManagement.delete('/api/management/999')
      expect(res.status).toBe(404)
    })
  })
})
