/**
 * Unit tests for src/utils/requireRole.js.
 * Minimal req/res stubs capture the status, body and whether next() was called.
 */
import { describe, it, expect } from 'vitest'
import { requireRole } from '../../src/utils/requireRole.js'

function run (middleware, role) {
  const req = { get: (name) => (name === 'X-User-Role' ? role : undefined) }
  const res = {
    statusCode: 0,
    body: null,
    status (code) { this.statusCode = code; return this },
    json (obj) { this.body = obj; return this }
  }
  let nextCalled = false
  middleware(req, res, () => { nextCalled = true })
  return { res, nextCalled }
}

describe('requireRole', () => {
  it('calls next() when the role is allowed', () => {
    const { res, nextCalled } = run(requireRole('Management'), 'Management')
    expect(nextCalled).toBe(true)
    expect(res.statusCode).toBe(0)
  })

  it('compares roles case-insensitively and ignores spaces', () => {
    const { nextCalled } = run(requireRole('Management'), '  management ')
    expect(nextCalled).toBe(true)
  })

  it('accepts any of several allowed roles', () => {
    const { nextCalled } = run(requireRole('Teacher', 'Management'), 'Teacher')
    expect(nextCalled).toBe(true)
  })

  it('returns 401 when no role is sent', () => {
    const { res, nextCalled } = run(requireRole('Management'), undefined)
    expect(nextCalled).toBe(false)
    expect(res.statusCode).toBe(401)
    expect(res.body).toEqual({ error: 'Missing X-User-Role header' })
  })

  it('returns 403 for another role', () => {
    const { res, nextCalled } = run(requireRole('Management'), 'Student')
    expect(nextCalled).toBe(false)
    expect(res.statusCode).toBe(403)
    expect(res.body).toEqual({ error: 'Forbidden: requires role Management' })
  })
})
