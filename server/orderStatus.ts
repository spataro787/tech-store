import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from './firebaseAdmin.js'
import { validateProduct } from '../src/utils/productValidation.js'
import type { OrderStatus } from '../src/types/order.js'

export class OrderStatusError extends Error {
  public readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'OrderStatusError'
    this.status = status
  }
}

const transitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ['processing', 'cancelled'],
  processing: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    value === 'pending' ||
    value === 'processing' ||
    value === 'completed' ||
    value === 'cancelled'
  )
}

function readItems(value: unknown) {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.length > 100
  ) {
    throw new OrderStatusError(
      409,
      'Los productos de la orden tienen un formato inválido.',
    )
  }

  const ids = new Set<string>()

  return value.map((item: unknown) => {
    if (
      typeof item !== 'object' ||
      item === null ||
      !('productId' in item) ||
      typeof item.productId !== 'string' ||
      !item.productId.trim() ||
      item.productId.includes('/') ||
      ids.has(item.productId) ||
      !('quantity' in item) ||
      typeof item.quantity !== 'number' ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 1_000_000
    ) {
      throw new OrderStatusError(
        409,
        'La orden contiene un producto o cantidad inválidos.',
      )
    }

    ids.add(item.productId)

    return {
      productId: item.productId,
      quantity: item.quantity,
    }
  })
}

export async function changeOrderStatus(
  adminUserId: string,
  orderId: string,
  requestedStatus: unknown,
) {
  if (
    !orderId.trim() ||
    orderId.includes('/') ||
    !isOrderStatus(requestedStatus)
  ) {
    throw new OrderStatusError(
      400,
      'La orden o el estado solicitado no son válidos.',
    )
  }

  const db = getAdminDb()
  const adminReference = db.collection('users').doc(adminUserId)
  const orderReference = db.collection('orders').doc(orderId)

  return db.runTransaction(async (transaction) => {
    const adminSnapshot = await transaction.get(adminReference)

    if (adminSnapshot.data()?.role !== 'admin') {
      throw new OrderStatusError(
        403,
        'No tenés permiso para gestionar órdenes.',
      )
    }

    const orderSnapshot = await transaction.get(orderReference)

    if (!orderSnapshot.exists) {
      throw new OrderStatusError(404, 'La orden no existe.')
    }

    const order = orderSnapshot.data()
    const currentStatus: unknown = order?.status

    if (!isOrderStatus(currentStatus)) {
      throw new OrderStatusError(
        409,
        'La orden tiene un estado inválido.',
      )
    }

    // Un reintento no vuelve a modificar el stock.
    if (currentStatus === requestedStatus) {
      return {
        orderId,
        status: currentStatus,
      }
    }

    if (!transitions[currentStatus].includes(requestedStatus)) {
      throw new OrderStatusError(
        409,
        'Ese cambio de estado no está permitido. Actualizá la lista de órdenes.',
      )
    }

    if (requestedStatus === 'cancelled') {
      const items = readItems(order?.items)

      const references = items.map((item) =>
        db.collection('products').doc(item.productId),
      )

      const snapshots = await transaction.getAll(...references)

      // Validamos todas las devoluciones antes de escribir.
      const restorations = snapshots.map((snapshot, index) => {
        const item = items[index]

        if (!snapshot.exists) {
          return {
            reference: references[index],
            productId: item.productId,
            quantity: item.quantity,
            stock: null,
          }
        }

        const product = validateProduct(snapshot.data())
        const stock = product.stock + item.quantity

        if (!Number.isSafeInteger(stock) || stock > 1_000_000) {
          throw new OrderStatusError(
            409,
            'La devolución supera el límite de stock permitido.',
          )
        }

        return {
          reference: references[index],
          productId: item.productId,
          quantity: item.quantity,
          stock,
        }
      })

      for (const restoration of restorations) {
        if (restoration.stock !== null) {
          transaction.update(restoration.reference, {
            stock: restoration.stock,
          })
        }
      }

      transaction.update(orderReference, {
        status: 'cancelled',
        updatedAt: FieldValue.serverTimestamp(),
        cancellation: {
          cancelledBy: adminUserId,
          cancelledAt: FieldValue.serverTimestamp(),
          restoredItems: restorations
            .filter((item) => item.stock !== null)
            .map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          unavailableItems: restorations
            .filter((item) => item.stock === null)
            .map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
        },
      })
    } else {
      transaction.update(orderReference, {
        status: requestedStatus,
        updatedAt: FieldValue.serverTimestamp(),
      })
    }

    return {
      orderId,
      status: requestedStatus,
    }
  })
}