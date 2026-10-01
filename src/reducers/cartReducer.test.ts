import { describe, expect, it } from 'vitest'
import type { Product } from '../types/product'
import type { CartState } from '../types/cart'
import { cartReducer } from './cartReducer'

const product: Product = {
  id: 'mouse-01',
  name: 'Mouse inalámbrico',
  description: 'Mouse de prueba',
  price: 25000,
  category: 'Periféricos',
  stock: 3,
  imageUrl: '',
}

describe('cartReducer', () => {
  it('agrega un producto con cantidad uno', () => {
    const result = cartReducer([], {
      type: 'ADD_ITEM',
      product,
    })

    expect(result).toEqual([{ product, quantity: 1 }])
  })

  it('incrementa la cantidad sin duplicar el producto', () => {
    const state: CartState = [{ product, quantity: 1 }]

    const result = cartReducer(state, {
      type: 'ADD_ITEM',
      product,
    })

    expect(result).toEqual([{ product, quantity: 2 }])
  })

  it('no agrega unidades por encima del stock', () => {
    const state: CartState = [{ product, quantity: 3 }]

    const result = cartReducer(state, {
      type: 'ADD_ITEM',
      product,
    })

    expect(result).toEqual(state)
  })

  it('no agrega un producto sin stock', () => {
    const result = cartReducer([], {
      type: 'ADD_ITEM',
      product: { ...product, stock: 0 },
    })

    expect(result).toEqual([])
  })

  it.each([-1, 1.5, NaN])(
    'rechaza un stock inválido: %s',
    (stock) => {
      const result = cartReducer([], {
        type: 'ADD_ITEM',
        product: { ...product, stock },
      })

      expect(result).toEqual([])
    },
  )

  it('elimina el producto indicado y conserva los demás', () => {
    const otherProduct = { ...product, id: 'keyboard-01' }

    const state: CartState = [
      { product, quantity: 1 },
      { product: otherProduct, quantity: 2 },
    ]

    const result = cartReducer(state, {
      type: 'REMOVE_ITEM',
      productId: product.id,
    })

    expect(result).toEqual([
      { product: otherProduct, quantity: 2 },
    ])
  })

  it('conserva el carrito si se intenta eliminar un ID inexistente', () => {
    const state: CartState = [{ product, quantity: 1 }]

    const result = cartReducer(state, {
      type: 'REMOVE_ITEM',
      productId: 'no-existe',
    })

    expect(result).toEqual(state)
  })

  it('actualiza la cantidad y conserva los demás productos', () => {
    const otherProduct = { ...product, id: 'keyboard-01' }

    const state: CartState = [
      { product, quantity: 1 },
      { product: otherProduct, quantity: 2 },
    ]

    const result = cartReducer(state, {
      type: 'UPDATE_QUANTITY',
      productId: product.id,
      quantity: 3,
    })

    expect(result).toEqual([
      { product, quantity: 3 },
      { product: otherProduct, quantity: 2 },
    ])
  })

  it.each([0, -1, 1.5, 4, NaN, Infinity])(
    'rechaza una cantidad inválida: %s',
    (quantity) => {
      const state: CartState = [{ product, quantity: 1 }]

      const result = cartReducer(state, {
        type: 'UPDATE_QUANTITY',
        productId: product.id,
        quantity,
      })

      expect(result).toEqual(state)
    },
  )

  it('no agrega productos al actualizar un ID inexistente', () => {
    const state: CartState = [{ product, quantity: 1 }]

    const result = cartReducer(state, {
      type: 'UPDATE_QUANTITY',
      productId: 'no-existe',
      quantity: 2,
    })

    expect(result).toEqual(state)
  })

  it('vacía el carrito', () => {
    const state: CartState = [{ product, quantity: 2 }]

    const result = cartReducer(state, {
      type: 'CLEAR_CART',
    })

    expect(result).toEqual([])
  })

  it('agrega un producto sin modificar el arreglo original', () => {
    const state: CartState = []

    const result = cartReducer(state, {
      type: 'ADD_ITEM',
      product,
    })

    expect(state).toEqual([])
    expect(result).toEqual([{ product, quantity: 1 }])
    expect(result).not.toBe(state)
  })

  it('incrementa sin modificar el elemento original', () => {
    const state: CartState = [{ product, quantity: 1 }]

    const result = cartReducer(state, {
      type: 'ADD_ITEM',
      product,
    })

    expect(state[0].quantity).toBe(1)
    expect(result[0].quantity).toBe(2)
    expect(result[0]).not.toBe(state[0])
  })

  it('actualiza sin modificar el elemento original', () => {
    const state: CartState = [{ product, quantity: 1 }]

    const result = cartReducer(state, {
      type: 'UPDATE_QUANTITY',
      productId: product.id,
      quantity: 3,
    })

    expect(state[0].quantity).toBe(1)
    expect(result[0].quantity).toBe(3)
    expect(result[0]).not.toBe(state[0])
  })
})