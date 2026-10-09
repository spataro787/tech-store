export type UserRole = 'customer' | 'admin'

export type UserProfile = {
  uid: string
  firstName: string
  lastName: string
  birthDate: string
  role: UserRole
}