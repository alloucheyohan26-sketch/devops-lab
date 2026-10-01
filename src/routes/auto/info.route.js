/**
 * GET /info -> merges two small helpers for easy unit testing.
 * Returns: { name, version, node, uptime }
 *
 * DEVOPS-18: Implement /info endpoint
 * - Combines package info and runtime info into a single response
 * - Uses utility helpers for testability
 */
import { Router } from 'express'
import { getPackageInfo, getRuntimeInfo } from '../../utils/appInfo.js'

const router = Router()

router.get('/info', (_req, res) => {
  const info = { ...getPackageInfo(), ...getRuntimeInfo() }
  res.status(200).json(info)
})

export default router
