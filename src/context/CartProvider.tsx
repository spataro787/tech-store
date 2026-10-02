import { useEffect, useReducer, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { CartContext } from './CartContext'
import type { CartContextValue } from './CartContext'
import type { CartAction, CartState } from '../types/cart'
import { cartReducer } from '../reducers/cartReducer'

export type CartStorage = {
  load: (userId: string) => Promise<CartState>
  save: (userId: string, items: CartState) => Promise<void>
}

type CartProviderProps = {
  children: ReactNode
  userId?: string
  storage?: CartStorage
}

function CartProvider({
  children,
  userId,
  storage,
}: CartProviderProps) {
  const persistent = Boolean(userId && storage)

  const [items, dispatch] = useReducer(cartReducer, [])
  const [loadingCart, setLoadingCart] = useState(persistent)
  const [pendingWrites, setPendingWrites] = useState(0)
  const [cartError, setCartError] = useState<string | null>(null)

  const itemsRef = useRef<CartState>([])
  const readyRef = useRef(!persistent)
  const queueRef = useRef<Promise<void>>(Promise.resolve())
  const saveFailedRef = useRef(false)

  useEffect(() => {
    if (!userId || !storage) {
      return
    }

    let active = true

    storage.load(userId).then(
      (savedItems) => {
        if (!active) {
          return
        }

        itemsRef.current = savedItems
        dispatch({ type: 'LOAD_CART', items: savedItems })
        readyRef.current = true
        setLoadingCart(false)
      },
      () => {
        if (!active) {
          return
        }

        setCartError(
          'No pudimos recuperar tu carrito. Recargá para volver a intentar.',
        )
        setLoadingCart(false)
      },
    )

    return () => {
      active = false
    }
  }, [userId, storage])

  function applyAction(action: CartAction) {
    if (!readyRef.current) {
      return
    }

    const nextItems = cartReducer(itemsRef.current, action)

    if (nextItems === itemsRef.current) {
      return
    }

    itemsRef.current = nextItems
    dispatch(action)

    if (!userId || !storage) {
      return
    }

    setPendingWrites((count) => count + 1)

    queueRef.current = queueRef.current.then(async () => {
      try {
        await storage.save(userId, nextItems)
        saveFailedRef.current = false
        setCartError(null)
      } catch {
        saveFailedRef.current = true
        setCartError(
          'No pudimos guardar los últimos cambios. Revisá tu conexión y volvé a intentar.',
        )
      } finally {
        setPendingWrites((count) => count - 1)
      }
    })
  }

  async function flushCart() {
    await queueRef.current

    if (saveFailedRef.current) {
      throw new Error('El carrito tiene cambios sin guardar.')
    }
  }

  const value: CartContextValue = {
    items,
    totalItems: items.reduce(
      (total, item) => total + item.quantity,
      0,
    ),
    totalPrice: items.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0,
    ),
    loadingCart,
    savingCart: pendingWrites > 0,
    cartError,
    flushCart,

    addItem(product) {
      applyAction({ type: 'ADD_ITEM', product })
    },

    removeItem(productId) {
      applyAction({ type: 'REMOVE_ITEM', productId })
    },

    updateQuantity(productId, quantity) {
      applyAction({
        type: 'UPDATE_QUANTITY',
        productId,
        quantity,
      })
    },

    clearCart() {
      applyAction({ type: 'CLEAR_CART' })
    },
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export default CartProvider