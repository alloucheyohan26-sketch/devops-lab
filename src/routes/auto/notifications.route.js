import express from 'express'

const router = express.Router()

const notifications = [
  {
    id: 1,
    reservation_id: 101,
    channel: 'email',
    sent_at: '2025-03-01T08:30:00Z',
    delivery_status: 'SENT'
  },
  {
    id: 2,
    reservation_id: 102,
    channel: 'SMS',
    sent_at: '2025-03-01T09:15:00Z',
    delivery_status: 'DELIVERED'
  },
  {
    id: 3,
    reservation_id: 103,
    channel: 'email',
    sent_at: '2025-03-01T10:00:00Z',
    delivery_status: 'PENDING'
  }
]

// GET /api/notifications - Retrieve all notifications
router.get('/', (_req, res) => {
  res.status(200).json(notifications)
})

// GET /api/notifications/:id - Retrieve a single notification by ID
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10)
  const notification = notifications.find(n => n.id === id)

  if (!notification) {
    return res.status(404).json({ error: 'Notification not found' })
  }

  res.status(200).json(notification)
})

// POST /api/notifications - Create a new notification
router.post('/', (req, res) => {
  const { reservation_id: reservationId, channel, sent_at: sentAt, delivery_status: deliveryStatus } = req.body

  if (!reservationId || !channel) {
    return res.status(400).json({ error: 'Missing required fields: reservation_id and channel are required' })
  }

  const newId = notifications.length > 0 ? Math.max(...notifications.map(n => n.id)) + 1 : 1
  const newNotification = {
    id: newId,
    reservation_id: Number(reservationId),
    channel,
    sent_at: sentAt || '2025-03-01T12:00:00Z',
    delivery_status: deliveryStatus || 'SENT'
  }

  notifications.push(newNotification)
  res.status(201).json(newNotification)
})

// PUT /api/notifications/:id - Update an existing notification by ID
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10)
  const index = notifications.findIndex(n => n.id === id)

  if (index === -1) {
    return res.status(404).json({ error: 'Notification not found' })
  }

  const { reservation_id: reservationId, channel, sent_at: sentAt, delivery_status: deliveryStatus } = req.body

  if (!reservationId || !channel) {
    return res.status(400).json({ error: 'Missing required fields: reservation_id and channel are required' })
  }

  notifications[index] = {
    id,
    reservation_id: Number(reservationId),
    channel,
    sent_at: sentAt || notifications[index].sent_at,
    delivery_status: deliveryStatus || notifications[index].delivery_status
  }

  res.status(200).json(notifications[index])
})

// DELETE /api/notifications/:id - Delete a notification by ID
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10)
  const index = notifications.findIndex(n => n.id === id)

  if (index === -1) {
    return res.status(404).json({ error: 'Notification not found' })
  }

  notifications.splice(index, 1)
  res.status(204).end()
})

export default router
