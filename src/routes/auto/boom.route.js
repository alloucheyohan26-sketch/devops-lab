/**
 * GET /boom -> triggers an error to exercise the global error handler.
 *
 * DEVOPS-19: Implement /boom endpoint
 * - Simulates a 500 Internal Server Error
 * - Used to verify the global error handler returns consistent JSON
 */
import { Router } from 'express'

const router = Router()

router.get('/boom', (_req, _res, next) => {
  const err = new Error('Boom!')
  err.status = 500
  next(err)
})

export default router
