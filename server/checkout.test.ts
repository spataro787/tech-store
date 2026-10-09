import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeAdminDb } from './fakeAdminDb'
import { checkout } from './checkout'
import type { CheckoutInput } from './checkout'

const { getAdminDb } = vi.hoisted(() => ({
  getAdminDb: vi.fn(),
}))

vi.mock('./firebaseAdmin', () => ({ getAdminDb }))
vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: () => 'server-timestamp',
  },
}))

const product = {
  name: 'Teclado mecánico',
  description: 'Teclado de prueba.',
  price: 100,
  category: 'Periféricos',
  stock: 1,
  imageUrl: '',
}

function purchaseRequest(
  requestId: string,
  productId = 'keyboard-1',
): CheckoutInput {
  return {
    requestId,
    items: [{ productId, quantity: 1 }],
    expectedTotalCents: 10_000,
  }
}

function createDatabase(users: string[]) {
  return createFakeAdminDb({
    'products/keyboard-1': { ...product },
    ...Object.fromEntries(
      users.map((userId) => [
        `carts/${userId}`,
        { items: [{ productId: 'keyboard-1', quantity: 1 }] },
      ]),
    ),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('checkout', () => {
  it('crea la orden, descuenta stock y vacía el carrito en una transacción', async () => {
    const db = createDatabase(['customer-1'])
    getAdminDb.mockReturnValue(db)

    const result = await checkout(
      'customer-1',
      purchaseRequest('request-000000000001'),
    )

    expect(result).toMatchObject({
      totalCents: 10_000,
      status: 'pending',
    })
    expect(db.readDocument('products', 'keyboard-1')).toMatchObject({
      stock: 0,
    })
    expect(db.readDocument('carts', 'customer-1')).toMatchObject({
      items: [],
    })
    expect(db.readDocument('orders', result.orderId)).toMatchObject({
      userId: 'customer-1',
      totalCents: 10_000,
    })
  })

  it('permite solo una compra cuando dos clientes compiten por la última unidad', async () => {
    const db = createDatabase(['customer-a', 'customer-b'])
    getAdminDb.mockReturnValue(db)

    const results = await Promise.allSettled([
      checkout(
        'customer-a',
        purchaseRequest('request-customer-a-0001'),
      ),
      checkout(
        'customer-b',
        purchaseRequest('request-customer-b-0001'),
      ),
    ])

    expect(results.filter((result) => result.status === 'fulfilled'))
      .toHaveLength(1)
    expect(results.filter((result) => result.status === 'rejected'))
      .toHaveLength(1)
    expect(db.readDocument('products', 'keyboard-1')).toMatchObject({
      stock: 0,
    })
  })

  it('devuelve la misma orden al reintentar el mismo identificador', async () => {
    const db = createDatabase(['customer-1'])
    getAdminDb.mockReturnValue(db)
    const input = purchaseRequest('request-000000000002')

    const first = await checkout('customer-1', input)
    const retry = await checkout('customer-1', input)

    expect(retry).toEqual(first)
    expect(db.readDocument('products', 'keyboard-1')).toMatchObject({
      stock: 0,
    })
  })

  it('rechaza stock insuficiente sin escribir una orden ni alterar el carrito', async () => {
    const db = createDatabase(['customer-1'])
    db.readDocument('products', 'keyboard-1')!.stock = 0
    getAdminDb.mockReturnValue(db)

    await expect(
      checkout(
        'customer-1',
        purchaseRequest('request-000000000003'),
      ),
    ).rejects.toMatchObject({ status: 409 })

    expect(db.readDocument('carts', 'customer-1')).toMatchObject({
      items: [{ productId: 'keyboard-1', quantity: 1 }],
    })
    expect(db.listDocuments('orders')).toHaveLength(0)
  })

  it('rechaza reutilizar el identificador con otro carrito', async () => {
    const db = createDatabase(['customer-1'])
    getAdminDb.mockReturnValue(db)
    const input = purchaseRequest('request-000000000004')
    await checkout('customer-1', input)

    await expect(
      checkout('customer-1', {
        ...input,
        expectedTotalCents: 20_000,
      }),
    ).rejects.toMatchObject({ status: 409 })
  })
})
