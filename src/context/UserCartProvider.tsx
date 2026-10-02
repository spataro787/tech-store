import type { ReactNode } from 'react'
import CartProvider from './CartProvider'
import type { CartStorage } from './CartProvider'
import { useAuth } from '../hooks/useAuth'
import { loadCart, saveCart } from '../services/cartService'

const storage: CartStorage = {
  load: loadCart,
  save: saveCart,
}

type UserCartProviderProps = {
  children: ReactNode
}

function UserCartProvider({ children }: UserCartProviderProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <p role="status" className="p-8 text-center">
        Comprobando sesión…
      </p>
    )
  }

  return (
    <CartProvider
      key={user?.uid ?? 'guest'}
      userId={user?.uid}
      storage={storage}
    >
      {children}
    </CartProvider>
  )
}

export default UserCartProvider