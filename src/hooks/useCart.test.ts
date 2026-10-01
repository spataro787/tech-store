import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { Product } from '../types/product'
import { TestProviders } from '../test/TestProviders'
import { useCart } from './useCart'

const product: Product = {
  id: 'mouse-01',
  name: 'Mouse inalámbrico',
  description: 'Producto de prueba',
  price: 25000,
  category: 'Periféricos',
  stock: 3,
  imageUrl: '',
}

afterEach(() => {
  cleanup()
})

describe('useCart', () => {
  it('comienza con el carrito vacío y los totales en cero', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: TestProviders,
    })

    expect(result.current.items).toEqual([])
    expect(result.current.totalItems).toBe(0)
    expect(result.current.totalPrice).toBe(0)
  })

  it('agrega productos y calcula los totales', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: TestProviders,
    })

    act(() => {
      result.current.addItem(product)
      result.current.addItem(product)
    })

    expect(result.current.items).toEqual([
      { product, quantity: 2 },
    ])
    expect(result.current.totalItems).toBe(2)
    expect(result.current.totalPrice).toBe(50000)
  })

  it('suma unidades y precios de distintos productos', () => {
    const otherProduct: Product = {
      ...product,
      id: 'keyboard-01',
      price: 65000,
    }

    const { result } = renderHook(() => useCart(), {
      wrapper: TestProviders,
    })

    act(() => {
      result.current.addItem(product)
      result.current.addItem(product)
      result.current.addItem(otherProduct)
    })

    expect(result.current.items).toHaveLength(2)
    expect(result.current.totalItems).toBe(3)
    expect(result.current.totalPrice).toBe(115000)
  })

  it('actualiza la cantidad y recalcula los totales', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: TestProviders,
    })

    act(() => {
      result.current.addItem(product)
    })

    act(() => {
      result.current.updateQuantity(product.id, 3)
    })

    expect(result.current.items[0].quantity).toBe(3)
    expect(result.current.totalItems).toBe(3)
    expect(result.current.totalPrice).toBe(75000)
  })

  it('conserva los totales al rechazar una cantidad inválida', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: TestProviders,
    })

    act(() => {
      result.current.addItem(product)
    })

    act(() => {
      result.current.updateQuantity(product.id, 4)
    })

    expect(result.current.items[0].quantity).toBe(1)
    expect(result.current.totalItems).toBe(1)
    expect(result.current.totalPrice).toBe(25000)
  })

  it('elimina un producto y conserva los totales del restante', () => {
    const otherProduct: Product = {
      ...product,
      id: 'keyboard-01',
      price: 65000,
    }

    const { result } = renderHook(() => useCart(), {
      wrapper: TestProviders,
    })

    act(() => {
      result.current.addItem(product)
      result.current.addItem(otherProduct)
    })

    act(() => {
      result.current.removeItem(product.id)
    })

    expect(result.current.items).toEqual([
      { product: otherProduct, quantity: 1 },
    ])
    expect(result.current.totalItems).toBe(1)
    expect(result.current.totalPrice).toBe(65000)
  })

  it('vacía el carrito y reinicia los totales', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: TestProviders,
    })

    act(() => {
      result.current.addItem(product)
    })

    act(() => {
      result.current.clearCart()
    })

    expect(result.current.items).toEqual([])
    expect(result.current.totalItems).toBe(0)
    expect(result.current.totalPrice).toBe(0)
  })
})