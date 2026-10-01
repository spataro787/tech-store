import { createContext } from 'react'
import type { CartState } from '../types/cart'
import type { Product } from '../types/product'

export type CartContextValue = {
  items: CartState
  totalItems: number
  totalPrice: number
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
}

export const CartContext = createContext<CartContextValue | undefined>(
  undefined,
)