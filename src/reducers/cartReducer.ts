import type { CartAction, CartState } from '../types/cart'

export function cartReducer(
  state: CartState,
  action: CartAction,
): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const product = action.product

      if (!Number.isInteger(product.stock) || product.stock <= 0) {
        return state
      }

      const existingItem = state.find(
        (item) => item.product.id === product.id,
      )

      if (!existingItem) {
        return [...state, { product, quantity: 1 }]
      }

      if (existingItem.quantity >= product.stock) {
        return state
      }

      return state.map((item) =>
        item.product.id === product.id
          ? {
              ...item,
              product,
              quantity: item.quantity + 1,
            }
          : item,
      )
    }

    case 'REMOVE_ITEM': {
      return state.filter(
        (item) => item.product.id !== action.productId,
      )
    }

    case 'UPDATE_QUANTITY': {
      const existingItem = state.find(
        (item) => item.product.id === action.productId,
      )

      if (!existingItem) {
        return state
      }

      const isValidQuantity =
        Number.isInteger(action.quantity) &&
        action.quantity >= 1 &&
        action.quantity <= existingItem.product.stock

      if (!isValidQuantity) {
        return state
      }

      return state.map((item) =>
        item.product.id === action.productId
          ? { ...item, quantity: action.quantity }
          : item,
      )
    }

     case 'CLEAR_CART': {
      return []
    }

    case 'LOAD_CART': {
      return action.items
    }

    default: {
      return state
    }
  }
}