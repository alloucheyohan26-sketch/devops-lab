/**
 * Reservations API (SmartLocker) - full CRUD
 * Jira SMAR-24 - US2.3 Hold and book a locker
 * A renter first holds a locker (HELD), then the booking is CONFIRMED.
 * GET    /api/reservations      → list all reservations
 * GET    /api/reservations/:id  → one reservation (404 if unknown)
 * POST   /api/reservations      → create { locker_id, user_id, start_time, end_time, status? }
 * PUT    /api/reservations/:id  → update (partial body accepted)
 * DELETE /api/reservations/:id  → delete (204)
 *
 * Rules: end_time must be after start_time, and an active reservation
 * (HELD or CONFIRMED) cannot overlap another one on the same locker (409).
 */
import express from 'express'

const router = express.Router()

const STATUSES = ['HELD', 'CONFIRMED', 'CANCELLED', 'COMPLETED']
const ACTIVE_STATUSES = ['HELD', 'CONFIRMED']

// Ids 101-103 match the reservation_id values used by /api/notifications
let reservations = [
  {
    id: 101,
    locker_id: 1,
    user_id: 1,
    start_time: '2025-03-01T08:00:00.000Z',
    end_time: '2025-03-01T18:00:00.000Z',
    status: 'CONFIRMED'
  },
  {
    id: 102,
    locker_id: 2,
    user_id: 2,
    start_time: '2025-03-01T09:00:00.000Z',
    end_time: '2025-03-01T12:00:00.000Z',
    status: 'CONFIRMED'
  },
  {
    id: 103,
    locker_id: 3,
    user_id: 1,
    start_time: '2025-03-01T10:00:00.000Z',
    end_time: '2025-03-02T10:00:00.000Z',
    status: 'HELD'
  }
]

const isPositiveInteger = (value) => Number.isInteger(Number(value)) && Number(value) > 0
const toDate = (value) => new Date(value)
const isValidDate = (value) => typeof value === 'string' && !Number.isNaN(toDate(value).getTime())

// Returns an error message, or null when the reservation is valid
function validate (reservation) {
  const { locker_id: lockerId, user_id: userId, start_time: start, end_time: end, status } = reservation
  if (lockerId === undefined || userId === undefined || !start || !end) {
    return 'Missing required fields: locker_id, user_id, start_time and end_time are required'
  }
  if (!isPositiveInteger(lockerId) || !isPositiveInteger(userId)) {
    return 'locker_id and user_id must be positive integers'
  }
  if (!isValidDate(start) || !isValidDate(end)) {
    return 'start_time and end_time must be valid ISO dates'
  }
  if (toDate(end) <= toDate(start)) {
    return 'end_time must be after start_time'
  }
  if (!STATUSES.includes(status)) {
    return `status must be one of: ${STATUSES.join(', ')}`
  }
  return null
}

// Same locker, both active, and time ranges intersect
function overlapsExisting (candidate) {
  if (!ACTIVE_STATUSES.includes(candidate.status)) return false
  const start = toDate(candidate.start_time)
  const end = toDate(candidate.end_time)
  return reservations.some((r) =>
    r.id !== candidate.id &&
    r.locker_id === candidate.locker_id &&
    ACTIVE_STATUSES.includes(r.status) &&
    start < toDate(r.end_time) &&
    toDate(r.start_time) < end
  )
}

// Normalise types and dates before saving
const normalise = (r) => ({
  id: r.id,
  locker_id: Number(r.locker_id),
  user_id: Number(r.user_id),
  start_time: toDate(r.start_time).toISOString(),
  end_time: toDate(r.end_time).toISOString(),
  status: r.status
})

const findIndexById = (id) => reservations.findIndex((r) => r.id === Number(id))

// GET all reservations
router.get('/', (_req, res) => {
  res.status(200).json(reservations)
})

// GET reservation by ID
router.get('/:id', (req, res) => {
  const reservation = reservations[findIndexById(req.params.id)]
  if (!reservation) {
    return res.status(404).json({ error: 'Reservation not found' })
  }
  res.status(200).json(reservation)
})

// POST create a reservation
router.post('/', (req, res) => {
  const candidate = { status: 'HELD', ...req.body }
  const error = validate(candidate)
  if (error) {
    return res.status(400).json({ error })
  }
  const newId = reservations.reduce((max, r) => Math.max(max, r.id), 100) + 1
  const reservation = normalise({ ...candidate, id: newId })
  if (overlapsExisting(reservation)) {
    return res.status(409).json({ error: 'Locker already reserved for this period' })
  }
  reservations.push(reservation)
  res.status(201).json(reservation)
})

// PUT update a reservation (fields not sent are kept)
router.put('/:id', (req, res) => {
  const index = findIndexById(req.params.id)
  if (index === -1) {
    return res.status(404).json({ error: 'Reservation not found' })
  }
  const candidate = { ...reservations[index], ...req.body, id: reservations[index].id }
  const error = validate(candidate)
  if (error) {
    return res.status(400).json({ error })
  }
  const updated = normalise(candidate)
  if (overlapsExisting(updated)) {
    return res.status(409).json({ error: 'Locker already reserved for this period' })
  }
  reservations[index] = updated
  res.status(200).json(updated)
})

// DELETE a reservation
router.delete('/:id', (req, res) => {
  const before = reservations.length
  reservations = reservations.filter((r) => r.id !== Number(req.params.id))
  if (reservations.length === before) {
    return res.status(404).json({ error: 'Reservation not found' })
  }
  res.status(204).end()
})

export default router
