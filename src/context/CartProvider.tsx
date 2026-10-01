import { useReducer } from 'react'
import type { ReactNode } from 'react'
import { CartContext } from './CartContext'
import type { CartContextValue } from './CartContext'
import { cartReducer } from '../reducers/cartReducer'

type CartProviderProps = {
  children: ReactNode
}

function CartProvider({ children }: CartProviderProps) {
  const [items, dispatch] = useReducer(cartReducer, [])

  const totalItems = items.reduce(
    (total, item) => total + item.quantity,
    0,
  )

  const totalPrice = items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  )

  const value: CartContextValue = {
    items,
    totalItems,
    totalPrice,

    addItem(product) {
      dispatch({ type: 'ADD_ITEM', product })
    },

    removeItem(productId) {
      dispatch({ type: 'REMOVE_ITEM', productId })
    },

    updateQuantity(productId, quantity) {
      dispatch({
        type: 'UPDATE_QUANTITY',
        productId,
        quantity,
      })
    },

    clearCart() {
      dispatch({ type: 'CLEAR_CART' })
    },
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export default CartProvider