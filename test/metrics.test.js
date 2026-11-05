import request from 'supertest'
import app from '../src/app.js'
import { describe, it, expect } from 'vitest'
describe('Metrics API', () => {
  it('GET /api/metrics should return  systel and hospital statistics', async () => {
    const res = await request(app).get('/api/metrics')

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('system')
    expect(res.body).toHaveProperty('hospital')
    expect(res.body).toHaveProperty('timestamp')
  })

  it('POST /api/metrics should should return system information', async () => {
    const res = await request(app).get('/api/metrics')

    expect(res.body.system).toHaveProperty('platform')
    expect(res.body.system).toHaveProperty('nodeVersion')
    expect(res.body.system).toHaveProperty('uptime')
  })
})
