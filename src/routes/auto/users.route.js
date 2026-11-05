import express from 'express'
const router = express.Router()

let users = [
  { id: 1, name: 'Alice Martin', email: 'alice.martin@edu.devinci.fr', phone: '+33612345678', role: 'Student' },
  { id: 2, name: 'Marc Dubois', email: 'marc.dubois@devinci.fr', phone: '+33698765432', role: 'Teacher' },
  { id: 3, name: 'Sophie Bernard', email: 'sophie.bernard@devinci.fr', phone: '+33611223344', role: 'Management' }
]

// GET all users
router.get('/', (_req, res) => {
  res.status(200).json(users)
})

// GET user by ID
router.get('/:id', (req, res) => {
  const id = Number(req.params.id)
  const user = users.find(u => u.id === id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json(user)
})

// POST create a new user
router.post('/', (req, res) => {
  const { name, email, phone, role } = req.body
  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  const newUser = {
    id: users.length + 1,
    name,
    email,
    phone: phone || '',
    role
  }
  users.push(newUser)
  res.status(201).json(newUser)
})

// PUT update a user by ID
router.put('/:id', (req, res) => {
  const id = Number(req.params.id)
  const index = users.findIndex(u => u.id === id)
  if (index === -1) {
    return res.status(404).json({ error: 'User not found' })
  }
  users[index] = { ...users[index], ...req.body, id }
  res.json(users[index])
})

// DELETE a user by ID
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id)
  const before = users.length
  users = users.filter(u => u.id !== id)
  if (users.length === before) {
    return res.status(404).json({ error: 'User not found' })
  }
  res.status(204).end()
})

export default router
