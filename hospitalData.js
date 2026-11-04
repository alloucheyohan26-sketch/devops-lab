// SED Lab 5 - 2.5 Modularization: data + functions exported to main.js

export const doctors = ['Dr. Lee', 'Dr. Khan']

export const patients = [
  { id: 1, name: 'Alice', age: 34 },
  { id: 2, name: 'John', age: 45 },
  { id: 3, name: 'Marie', age: 29 }
]

export function addDoctor (name) {
  doctors.push(name)
}

export function findDoctor (name) {
  return doctors.includes(name) ? 'Doctor found' : 'Doctor not found'
}

export function filterByAge (minAge) {
  return patients.filter((p) => p.age > minAge)
}

export function addPatient (name, age) {
  const newPatient = { id: patients.length + 1, name, age }
  patients.push(newPatient)
  return newPatient
}
