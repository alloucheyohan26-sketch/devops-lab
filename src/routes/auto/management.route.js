/**
 * Management API (SmartLocker) - full CRUD
 * Jira SMAR-19 - US1.4 Role-based access
 * Management = staff who administer lockers and solve particular cases.
 * Like Student (student_number) and Teacher (specialty), it is a profile
 * linked to a User (identity: name, email, role) and adds its own field: job.
 *
 * GET    /api/management      → list all management staff
 * GET    /api/management/:id  → one member (404 if unknown)
 * POST   /api/management      → create { user_id, job }
 * PUT    /api/management/:id  → update (partial body accepted)
 * DELETE /api/management/:id  → delete (204)
 *
 * Rules:
 *  - one management profile per user (409 if the user_id is already used)
 *  - POST, PUT and DELETE are protected: header "X-User-Role: Management"
 *    is required (401 without a role, 403 for any other role)
 */
import express from 'express'
import { requireRole } from '../../utils/requireRole.js'

const router = express.Router()

// user_id 3 is "Sophie Bernard" (role Management) in /api/users
let management = [
  { id: 1, user_id: 3, job: 'Locker administrator' }
]

const isPositiveInteger = (value) => Number.isInteger(Number(value)) && Number(value) > 0
const isNonEmptyString = (value) => typeof value === 'string' && value.trim() !== ''

// Returns an error message, or null when the member is valid
function validate (member) {
  const { user_id: userId, job } = member
  if (userId === undefined || job === undefined) {
    return 'Missing required fields: user_id and job are required'
  }
  if (!isPositiveInteger(userId)) {
    return 'user_id must be a positive integer'
  }
  if (!isNonEmptyString(job)) {
    return 'job must be a non-empty string'
  }
  return null
}

const normalise = (m) => ({
  id: m.id,
  user_id: Number(m.user_id),
  job: m.job.trim()
})

const userAlreadyManagement = (member) =>
  management.some((m) => m.id !== member.id && m.user_id === member.user_id)

const findIndexById = (id) => management.findIndex((m) => m.id === Number(id))

// Only management staff can change management profiles
const onlyManagement = requireRole('Management')

// GET all management staff
router.get('/', (_req, res) => {
  res.status(200).json(management)
})

// GET one management member by ID
router.get('/:id', (req, res) => {
  const member = management[findIndexById(req.params.id)]
  if (!member) {
    return res.status(404).json({ error: 'Management member not found' })
  }
  res.status(200).json(member)
})

// POST create a management member
router.post('/', onlyManagement, (req, res) => {
  const error = validate(req.body)
  if (error) {
    return res.status(400).json({ error })
  }
  const newId = management.reduce((max, m) => Math.max(max, m.id), 0) + 1
  const member = normalise({ ...req.body, id: newId })
  if (userAlreadyManagement(member)) {
    return res.status(409).json({ error: 'This user already has a management profile' })
  }
  management.push(member)
  res.status(201).json(member)
})

// PUT update a management member (fields not sent are kept)
router.put('/:id', onlyManagement, (req, res) => {
  const index = findIndexById(req.params.id)
  if (index === -1) {
    return res.status(404).json({ error: 'Management member not found' })
  }
  const candidate = { ...management[index], ...req.body, id: management[index].id }
  const error = validate(candidate)
  if (error) {
    return res.status(400).json({ error })
  }
  const updated = normalise(candidate)
  if (userAlreadyManagement(updated)) {
    return res.status(409).json({ error: 'This user already has a management profile' })
  }
  management[index] = updated
  res.status(200).json(updated)
})

// DELETE a management member
router.delete('/:id', onlyManagement, (req, res) => {
  const before = management.length
  management = management.filter((m) => m.id !== Number(req.params.id))
  if (management.length === before) {
    return res.status(404).json({ error: 'Management member not found' })
  }
  res.status(204).end()
})

export default router
