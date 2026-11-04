/**
 * Patient Management
 * GET  /api/patients             → list all patients
 * GET  /api/patients?minAge=40   → only patients older than minAge
 * GET  /api/patients/:id         → one patient (404 if unknown)
 * POST /api/patients             → add a patient { name, age }
 */
import { Router } from 'express'
import { patients, nextId, findById } from '../../data/store.js'

const router = Router()

const isValidAge = (age) => Number.isInteger(age) && age >= 0 && age <= 130

router.get('/', (req, res) => {
  const { minAge } = req.query
  if (minAge === undefined) {
    return res.status(200).json(patients)
  }
  const min = Number(minAge)
  if (Number.isNaN(min)) {
    return res.status(400).json({ error: 'minAge must be a number' })
  }
  res.status(200).json(patients.filter((patient) => patient.age > min))
})

router.get('/:id', (req, res) => {
  const patient = findById(patients, req.params.id)
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' })
  }
  res.status(200).json(patient)
})

router.post('/', (req, res) => {
  const { name, age } = req.body ?? {}
  if (typeof name !== 'string' || name.trim() === '' || age === undefined) {
    return res.status(400).json({ error: 'Missing fields' })
  }
  if (!isValidAge(age)) {
    return res
      .status(400)
      .json({ error: 'age must be an integer between 0 and 130' })
  }
  const newPatient = { id: nextId(patients), name: name.trim(), age }
  patients.push(newPatient)
  res.status(201).json(newPatient)
})

export default router
