import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { AuthContext } from './AuthContext'
import { auth } from '../services/firebase'
import { watchUserRole } from '../services/roleService'
import type { UserRole } from '../types/userProfile'

type AuthProviderProps = {
  children: ReactNode
}

type RoleState = {
  userId: string
  role: UserRole | null
  error: string | null
}

function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [roleState, setRoleState] =
    useState<RoleState | null>(null)

  const userId = user?.uid

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setRoleState(null)
        setUser(currentUser)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!userId) {
      return
    }

    let active = true

    const unsubscribe = watchUserRole(
      userId,
      (role) => {
        if (!active) {
          return
        }

        setRoleState({
          userId,
          role,
          error: null,
        })
      },
      () => {
        if (!active) {
          return
        }

        setRoleState({
          userId,
          role: null,
          error:
            'No pudimos comprobar tus permisos. Revisá tu conexión y recargá la página.',
        })
      },
    )

    return () => {
      active = false
      unsubscribe()
    }
  }, [userId])

  const currentRoleState =
    userId && roleState?.userId === userId
      ? roleState
      : null

  const roleLoading =
    Boolean(userId) && currentRoleState === null

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        role: currentRoleState?.role ?? null,
        roleLoading,
        roleError: currentRoleState?.error ?? null,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider