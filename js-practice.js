// SED Lab 5 - Part 2: JavaScript practice
// Run with: node js-practice.js

// ---------------------------------------------------------------------------
// 2.1 Variables and Data Types
// ---------------------------------------------------------------------------
console.log('=== 2.1 Variables and Data Types ===')

const hospitalName = 'Central Hospital' // never changes -> const
let numberOfDoctors = 12 // can change -> let
let isOpen = true

const showStatus = () => {
  if (isOpen) {
    console.log(`Welcome to ${hospitalName}! We have ${numberOfDoctors} doctors currently available.`)
  } else {
    console.log(`Sorry, ${hospitalName} is currently closed. Please come back later.`)
  }
}

showStatus()
isOpen = false // change the Boolean
showStatus()
isOpen = true
numberOfDoctors -= 1 // let can be reassigned
console.log(`Doctors on duty after a shift change: ${numberOfDoctors}`)

// ---------------------------------------------------------------------------
// 2.2 Working with Arrays and Loops
// ---------------------------------------------------------------------------
console.log('\n=== 2.2 Arrays and Loops ===')

const doctors = ['Dr. Lee', 'Dr. Khan', 'Dr. Martin', 'Dr. Dubois', 'Dr. Rossi']

// for...of + entries() gives both the index and the value
for (const [index, name] of doctors.entries()) {
  console.log(`Doctor #${index + 1}: ${name}`)
}

doctors.push('Dr. Julie')
console.log(`Updated count: ${doctors.length} doctors`)

function findDoctor (name) {
  return doctors.includes(name) ? 'Doctor found' : 'Doctor not found'
}

console.log(`findDoctor('Dr. Khan') -> ${findDoctor('Dr. Khan')}`)
console.log(`findDoctor('Dr. House') -> ${findDoctor('Dr. House')}`)

// ---------------------------------------------------------------------------
// 2.3 Objects and Nested Data
// ---------------------------------------------------------------------------
console.log('\n=== 2.3 Objects and Nested Data ===')

const patient = {
  name: 'Alice Martin',
  age: 34,
  conditions: ['diabetes', 'hypertension'],
  doctor: { name: 'Dr. Lee', specialty: 'Cardiology' }
}

console.log(`Doctor: ${patient.doctor.name}`)
console.log(`Number of conditions: ${patient.conditions.length}`)
console.log(`${patient.name} is treated by ${patient.doctor.name} (${patient.doctor.specialty}).`)

// const object: the variable can't be reassigned, but its content can change
patient.conditions.push('anxiety')
console.log('Updated patient:', patient)

// ---------------------------------------------------------------------------
// 2.4 Functions and Array Filtering
// ---------------------------------------------------------------------------
console.log('\n=== 2.4 Functions and Array Filtering ===')

const patients = [
  { id: 1, name: 'Alice', age: 34 },
  { id: 2, name: 'John', age: 45 },
  { id: 3, name: 'Marie', age: 29 }
]

function filterByAge (minAge) {
  return patients.filter((p) => p.age > minAge)
}

function addPatient (name, age) {
  const newPatient = { id: patients.length + 1, name, age }
  patients.push(newPatient)
  return newPatient
}

console.log('Patients older than 30:', filterByAge(30))
addPatient('Lucas', 52)
console.log('Updated list:', patients)
console.log('Patients older than 30 now:', filterByAge(30))

// ---------------------------------------------------------------------------
// 2.5 Modularization -> see hospitalData.js and main.js (node main.js)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 2.6 Error Handling and Validation
// ---------------------------------------------------------------------------
console.log('\n=== 2.6 Error Handling and Validation ===')

function createAppointment (doctor, patient, date) {
  if (!doctor || !patient || !date) {
    throw new Error('Missing required fields')
  }
  return { doctor, patient, date }
}

try {
  console.log(createAppointment('Dr. Lee', 'Alice', '2025-03-15'))
  console.log(createAppointment('Dr. Lee')) // should trigger error
} catch (err) {
  console.error('Error:', err.message)
}

// ---------------------------------------------------------------------------
// 2.7 Asynchronous Code
// ---------------------------------------------------------------------------
console.log('\n=== 2.7 Asynchronous Code ===')

function getHospitalData () {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ name: 'Central Hospital', uptime: 1234 })
    }, 1000)
  })
}

async function showData () {
  console.log('Fetching hospital data...')
  const data = await getHospitalData() // waits ~1 s without blocking Node
  console.log('Data loaded:', data)
}

showData()
console.log("(this line prints BEFORE 'Data loaded' because the call is async)")
