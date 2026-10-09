import { doc, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import type { UserProfile } from '../types/userProfile'

export type ProfileInput = {
  firstName: string
  lastName: string
  birthDate: string
}

export function isValidBirthDate(value: string): boolean {
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value)) {
    return false
  }

  const date = new Date(`${value}T00:00:00.000Z`)

  if (Number.isNaN(date.getTime())) {
    return false
  }

  if (date.toISOString().slice(0, 10) !== value) {
    return false
  }

  const now = new Date()

  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')

  return value >= '0001-01-01' && value <= today
}

export async function createUserProfile(
  uid: string,
  input: ProfileInput,
): Promise<void> {
  const firstName = input.firstName.trim()
  const lastName = input.lastName.trim()

  if (
    !firstName ||
    firstName.length > 80 ||
    !lastName ||
    lastName.length > 80
  ) {
    throw new Error('Ingresá nombre y apellido de hasta 80 caracteres.')
  }

  if (!isValidBirthDate(input.birthDate)) {
    throw new Error('Ingresá una fecha de nacimiento válida, no futura.')
  }

  const profile: UserProfile = {
    uid,
    firstName,
    lastName,
    birthDate: input.birthDate,
    role: 'customer',
  }

  await setDoc(doc(db, 'users', uid), profile)
}