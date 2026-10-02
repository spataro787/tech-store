import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import CartProvider from './CartProvider'
import type { CartStorage } from './CartProvider'
import type { CartState } from '../types/cart'
import type { Product } from '../types/product'
import { useCart } from '../hooks/useCart'

const product: Product = {
  id: 'mouse-01',
  name: 'Mouse inalámbrico',
  description: 'Producto de prueba',
  price: 25000,
  category: 'Periféricos',
  stock: 15,
  imageUrl: '',
}

function createWrapper(storage: CartStorage) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <CartProvider userId="customer-01" storage={storage}>
        {children}
      </CartProvider>
    )
  }
}

afterEach(() => {
  cleanup()
})

describe('Persistencia de CartProvider', () => {
  it('recupera el carrito sin sobrescribirlo al cargar', async () => {
    const savedItems: CartState = [{ product, quantity: 2 }]

    const storage = {
      load: vi.fn().mockResolvedValue(savedItems),
      save: vi.fn().mockResolvedValue(undefined),
    }

    const { result } = renderHook(() => useCart(), {
      wrapper: createWrapper(storage),
    })

    await waitFor(() => {
      expect(result.current.loadingCart).toBe(false)
    })

    expect(storage.load).toHaveBeenCalledWith('customer-01')
    expect(result.current.items).toEqual(savedItems)
    expect(result.current.totalItems).toBe(2)
    expect(storage.save).not.toHaveBeenCalled()
  })

  it('guarda las modificaciones en el carrito de la cuenta', async () => {
    const storage = {
      load: vi.fn().mockResolvedValue([]),
      save: vi.fn().mockResolvedValue(undefined),
    }

    const { result } = renderHook(() => useCart(), {
      wrapper: createWrapper(storage),
    })

    await waitFor(() => {
      expect(result.current.loadingCart).toBe(false)
    })

    act(() => {
      result.current.addItem(product)
    })

    await act(async () => {
      await result.current.flushCart()
    })

    expect(storage.save).toHaveBeenCalledWith(
      'customer-01',
      [{ product, quantity: 1 }],
    )
    expect(result.current.savingCart).toBe(false)
    expect(result.current.cartError).toBeNull()
  })

  it('rechaza modificaciones mientras está cargando', async () => {
    let resolveLoad!: (items: CartState) => void

    const storage = {
      load: vi.fn(
        () =>
          new Promise<CartState>((resolve) => {
            resolveLoad = resolve
          }),
      ),
      save: vi.fn().mockResolvedValue(undefined),
    }

    const { result } = renderHook(() => useCart(), {
      wrapper: createWrapper(storage),
    })

    act(() => {
      result.current.addItem(product)
    })

    expect(result.current.items).toEqual([])
    expect(storage.save).not.toHaveBeenCalled()

    await act(async () => {
      resolveLoad([{ product, quantity: 2 }])
    })

    expect(result.current.totalItems).toBe(2)
    expect(storage.save).not.toHaveBeenCalled()
  })

  it('no sobrescribe el carrito si falla la lectura', async () => {
    const storage = {
      load: vi.fn().mockRejectedValue(new Error('Sin conexión')),
      save: vi.fn().mockResolvedValue(undefined),
    }

    const { result } = renderHook(() => useCart(), {
      wrapper: createWrapper(storage),
    })

    await waitFor(() => {
      expect(result.current.cartError).not.toBeNull()
    })

    act(() => {
      result.current.addItem(product)
    })

    expect(storage.save).not.toHaveBeenCalled()
    expect(result.current.items).toEqual([])
  })

  it('informa el fallo de guardado y evita confirmar flushCart', async () => {
    const storage = {
      load: vi.fn().mockResolvedValue([]),
      save: vi.fn().mockRejectedValue(new Error('Sin permisos')),
    }

    const { result } = renderHook(() => useCart(), {
      wrapper: createWrapper(storage),
    })

    await waitFor(() => {
      expect(result.current.loadingCart).toBe(false)
    })

    act(() => {
      result.current.addItem(product)
    })

    await waitFor(() => {
      expect(result.current.cartError).not.toBeNull()
    })

    await expect(
      result.current.flushCart(),
    ).rejects.toThrow('El carrito tiene cambios sin guardar.')
  })

  it('espera el guardado pendiente antes de completar flushCart', async () => {
    let resolveSave!: () => void

    const storage = {
      load: vi.fn().mockResolvedValue([]),
      save: vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveSave = resolve
          }),
      ),
    }

    const { result } = renderHook(() => useCart(), {
      wrapper: createWrapper(storage),
    })

    await waitFor(() => {
      expect(result.current.loadingCart).toBe(false)
    })

    act(() => {
      result.current.addItem(product)
    })

    await waitFor(() => {
      expect(storage.save).toHaveBeenCalledTimes(1)
    })

    const finished = vi.fn()
    const pendingFlush = result.current.flushCart().then(finished)

    await Promise.resolve()

    expect(finished).not.toHaveBeenCalled()
    expect(result.current.savingCart).toBe(true)

    await act(async () => {
      resolveSave()
      await pendingFlush
    })

    expect(finished).toHaveBeenCalledTimes(1)
    expect(result.current.savingCart).toBe(false)
  })
})