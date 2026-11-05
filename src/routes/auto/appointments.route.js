/**
 * Appointments
 * GET  /api/appointments → list all appointments
 * POST /api/appointments → schedule a visit { doctor, patient, date }
 */
import { Router } from 'express'
import { appointments, nextId } from '../../data/store.js'

const router = Router()

router.get('/', (_req, res) => res.status(200).json(appointments))

router.post('/', (req, res) => {
  const { doctor, patient, date } = req.body
  if (!doctor || !patient || !date) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  const newAppointment = { id: nextId(appointments), doctor, patient, date }
  appointments.push(newAppointment)
  res.status(201).json(newAppointment)
})

export default router
