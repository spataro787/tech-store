import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'

const AuthProvider = lazy(
  () => import('../../context/AuthProvider'),
)
const UserCartProvider = lazy(
  () => import('../../context/UserCartProvider'),
)

type AppProvidersProps = {
  children: ReactNode
}

function AppProviders({ children }: AppProvidersProps) {
  return (
    <Suspense
      fallback={
        <p role="status" className="p-6 text-center text-accent">
          Iniciando Tech Store…
        </p>
      }
    >
      <AuthProvider>
        <UserCartProvider>
          {children}
        </UserCartProvider>
      </AuthProvider>
    </Suspense>
  )
}

export default AppProviders
