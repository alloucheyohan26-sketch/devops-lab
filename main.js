// SED Lab 5 - 2.5 Modularization: imports from hospitalData.js
// Run with: node main.js
import {
  doctors,
  addDoctor,
  findDoctor,
  patients,
  addPatient,
  filterByAge
} from './hospitalData.js'

addDoctor('Dr. Martin')
console.log('Updated doctors:', doctors)
console.log(`findDoctor('Dr. Martin') -> ${findDoctor('Dr. Martin')}`)

addPatient('Lucas', 52)
console.log('Updated patients:', patients)
console.log('Patients older than 40:', filterByAge(40))
