import type { ReactNode } from 'react'
import CartProvider from '../context/CartProvider'

type TestProvidersProps = {
  children: ReactNode
}

export function TestProviders({ children }: TestProvidersProps) {
  return (
    <CartProvider>
      {children}
    </CartProvider>
  )
}