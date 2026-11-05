/**
 * In-memory "database" shared by the healthcare routes.
 * Data is reset every time the server restarts (no real DB in this lab).
 *
 * Team: import these arrays in your route (doctors, patients, appointments)
 * instead of declaring local ones, so all routes share the same data.
 *   import { doctors, nextId, findById } from '../../data/store.js'
 */
export const doctors = [
  { id: 1, name: 'Dr. Sarah Lee', specialty: 'Cardiology' },
  { id: 2, name: 'Dr. Amir Khan', specialty: 'Pediatrics' }
]

export const patients = [
  { id: 1, name: 'Alice', age: 30 },
  { id: 2, name: 'John', age: 45 }
]

export const appointments = []

// Next free id = highest existing id + 1 (safer than array.length + 1)
export const nextId = (collection) =>
  collection.reduce((max, item) => Math.max(max, item.id), 0) + 1

export const findById = (collection, id) =>
  collection.find((item) => item.id === Number(id))
