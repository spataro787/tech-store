import type { ReactNode } from 'react'
import { AuthContext } from '../context/AuthContext'
import CartProvider from '../context/CartProvider'

type TestProvidersProps = {
  children: ReactNode
}

export function TestProviders({ children }: TestProvidersProps) {
  return (
    <AuthContext.Provider value={{ user: null, loading: false }}>
      <CartProvider>
        {children}
      </CartProvider>
    </AuthContext.Provider>
  )
}