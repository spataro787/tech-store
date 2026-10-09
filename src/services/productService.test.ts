import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createProduct,
  deleteProduct,
  updateProduct,
} from './productService'
import { validateProduct } from '../utils/productValidation'
import type { ProductInput } from '../types/product'

const mocks = vi.hoisted(() => ({
  addDoc: vi.fn(),
  collection: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  runTransaction: vi.fn(),
}))

vi.mock('firebase/firestore', () => mocks)
vi.mock('./firebase', () => ({ db: {} }))

const input: ProductInput = {
  name: 'Teclado mecánico',
  description: 'Teclado compacto.',
  price: 125_000,
  category: 'Periféricos',
  stock: 8,
  imageUrl:
    '/api/product-image?key=products%2F123e4567-e89b-12d3-a456-426614174000.webp',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('productService', () => {
  it('crea el producto validado y devuelve su ID', async () => {
    const productsCollection = {}
    mocks.collection.mockReturnValue(productsCollection)
    mocks.addDoc.mockResolvedValue({ id: 'keyboard-1' })

    await expect(createProduct(input)).resolves.toEqual({
      id: 'keyboard-1',
      ...input,
    })

    expect(mocks.addDoc).toHaveBeenCalledWith(
      productsCollection,
      input,
    )
  })

  it('actualiza el producto dentro de una transacción si el stock no cambió', async () => {
    const reference = { id: 'keyboard-1' }
    const transaction = {
      get: vi.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({ ...input, stock: 8 }),
      }),
      update: vi.fn(),
    }
    mocks.doc.mockReturnValue(reference)
    mocks.runTransaction.mockImplementation(
      async (_database, operation) => operation(transaction),
    )

    await expect(
      updateProduct('keyboard-1', input, 8),
    ).resolves.toEqual({ id: 'keyboard-1', ...input })

    expect(transaction.update).toHaveBeenCalledWith(
      reference,
      input,
    )
  })

  it('evita sobrescribir el producto si cambió el stock al editarlo', async () => {
    const transaction = {
      get: vi.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({ ...input, stock: 9 }),
      }),
      update: vi.fn(),
    }
    mocks.doc.mockReturnValue({ id: 'keyboard-1' })
    mocks.runTransaction.mockImplementation(
      async (_database, operation) => operation(transaction),
    )

    await expect(
      updateProduct('keyboard-1', input, 8),
    ).rejects.toThrow('El stock cambió mientras editabas.')

    expect(transaction.update).not.toHaveBeenCalled()
  })

  it('rechaza IDs con segmentos de ruta antes de intentar borrar', async () => {
    await expect(deleteProduct('products/keyboard-1')).rejects.toThrow(
      'El ID del producto no es válido.',
    )

    expect(mocks.deleteDoc).not.toHaveBeenCalled()
  })

  it('valida URLs del proxy de imágenes privadas', () => {
    expect(validateProduct(input)).toEqual(input)
    expect(() =>
      validateProduct({ ...input, imageUrl: '/private/key.png' }),
    ).toThrow('La dirección de la imagen no es válida.')
  })
})
