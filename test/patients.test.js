/**
 * Integration tests for /api/patients.
 */
import request from 'supertest'
import app from '../src/app.js'
import { describe, it, expect } from 'vitest'

describe('Patients API', () => {
  it('GET /api/patients should return an array', async () => {
    const res = await request(app).get('/api/patients')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('POST /api/patients should add a new patient', async () => {
    const res = await request(app)
      .post('/api/patients')
      .send({ name: 'Marie', age: 29 })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body).toMatchObject({ name: 'Marie', age: 29 })
  })

  it('POST /api/patients should accept age 0 (newborn)', async () => {
    const res = await request(app)
      .post('/api/patients')
      .send({ name: 'Baby Leo', age: 0 })
    expect(res.status).toBe(201)
  })

  it('POST /api/patients should return 400 when fields are missing', async () => {
    const res = await request(app).post('/api/patients').send({ age: 40 })
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'Missing fields' })
  })

  it('POST /api/patients should return 400 for an invalid age', async () => {
    const res = await request(app)
      .post('/api/patients')
      .send({ name: 'Bob', age: 'forty' })
    expect(res.status).toBe(400)
  })

  it('POST /api/patients with malformed JSON should be handled by the error handler', async () => {
    const res = await request(app)
      .post('/api/patients')
      .set('Content-Type', 'application/json')
      .send('{"name": "Broken",')
    expect(res.status).toBe(400)
    expect(res.body.error).toBe(true)
  })

  it('GET /api/patients?minAge=40 should only return older patients', async () => {
    const res = await request(app).get('/api/patients?minAge=40')
    expect(res.status).toBe(200)
    expect(res.body.length).toBeGreaterThan(0)
    expect(res.body.every((p) => p.age > 40)).toBe(true)
  })

  it('GET /api/patients?minAge=abc should return 400', async () => {
    const res = await request(app).get('/api/patients?minAge=abc')
    expect(res.status).toBe(400)
  })

  it('GET /api/patients/:id should return one patient', async () => {
    const res = await request(app).get('/api/patients/2')
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('John')
  })

  it('GET /api/patients/:id should return 404 for an unknown id', async () => {
    const res = await request(app).get('/api/patients/999')
    expect(res.status).toBe(404)
  })
})
