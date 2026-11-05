import express from 'express'
import os from 'node:os'
const router = express.Router()

// System metrics
const systemMetrics = {
  platform: process.platform,
  nodeVersion: process.version,
  hostname: os.hostname(),
  totalMemory: os.totalmem(),
  freeMemory: os.freemem()
}

// Hospital metrics
const hospitalMetrics = {
  name: 'Central Hospital',
  totalDoctors: 12,
  totalPatients: 45,
  totalAppointments: 30
}

router.get('/', (req, res) => {
  const metrics = {
    system: {
      ...systemMetrics,
      uptime: Math.floor(process.uptime())
    },
    hospital: hospitalMetrics,
    timestamp: new Date().toISOString()
  }

  res.status(200).json(metrics)
})

export default router
