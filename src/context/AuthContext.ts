import { createContext } from 'react'
import type { User } from 'firebase/auth'
import type { UserRole } from '../types/userProfile'

export type AuthContextValue = {
  user: User | null
  loading: boolean
  role: UserRole | null
  roleLoading: boolean
  roleError: string | null
}

export const AuthContext = createContext<
  AuthContextValue | undefined
>(undefined)