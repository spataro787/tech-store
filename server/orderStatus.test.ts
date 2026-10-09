import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeAdminDb } from './fakeAdminDb'
import { changeOrderStatus } from './orderStatus'

const { getAdminDb } = vi.hoisted(() => ({
  getAdminDb: vi.fn(),
}))

vi.mock('./firebaseAdmin', () => ({ getAdminDb }))
vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: () => 'server-timestamp',
  },
}))

function createDatabase(role = 'admin') {
  return createFakeAdminDb({
    'users/admin-1': { role },
    'orders/order-1': {
      userId: 'customer-1',
      status: 'processing',
      items: [{ productId: 'keyboard-1', quantity: 2 }],
    },
    'products/keyboard-1': {
      name: 'Teclado mecánico',
      description: 'Teclado de prueba.',
      price: 100,
      category: 'Periféricos',
      stock: 3,
      imageUrl: '',
    },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('changeOrderStatus', () => {
  it('cancela una orden y devuelve el stock sin duplicar la devolución al reintentar', async () => {
    const db = createDatabase()
    getAdminDb.mockReturnValue(db)

    const first = await changeOrderStatus(
      'admin-1',
      'order-1',
      'cancelled',
    )
    const retry = await changeOrderStatus(
      'admin-1',
      'order-1',
      'cancelled',
    )

    expect(first).toEqual({ orderId: 'order-1', status: 'cancelled' })
    expect(retry).toEqual(first)
    expect(db.readDocument('products', 'keyboard-1')).toMatchObject({
      stock: 5,
    })
    expect(db.readDocument('orders', 'order-1')).toMatchObject({
      status: 'cancelled',
      cancellation: {
        restoredItems: [
          { productId: 'keyboard-1', quantity: 2 },
        ],
      },
    })
  })

  it('rechaza la operación si el usuario no tiene rol de administrador', async () => {
    getAdminDb.mockReturnValue(createDatabase('customer'))

    await expect(
      changeOrderStatus('admin-1', 'order-1', 'cancelled'),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('rechaza cancelar una orden completada', async () => {
    const db = createDatabase()
    db.readDocument('orders', 'order-1')!.status = 'completed'
    getAdminDb.mockReturnValue(db)

    await expect(
      changeOrderStatus('admin-1', 'order-1', 'cancelled'),
    ).rejects.toMatchObject({ status: 409 })

    expect(db.readDocument('products', 'keyboard-1')).toMatchObject({
      stock: 3,
    })
  })
})
