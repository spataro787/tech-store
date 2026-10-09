import {
  collection,
  getDocs,
} from 'firebase/firestore'
import { auth, db } from './firebase'
import { readOrder } from './orderService'
import type {
  Order,
  OrderStatus,
} from '../types/order'

export async function getAdminOrders(): Promise<Order[]> {
  const snapshot = await getDocs(collection(db, 'orders'))

  return snapshot.docs
    .map((document) =>
      readOrder(document.id, document.data()),
    )
    .sort((first, second) =>
      second.createdAt.localeCompare(first.createdAt),
    )
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<void> {
  const user = auth.currentUser

  if (!user) {
    throw new Error('Iniciá sesión para gestionar órdenes.')
  }

  const token = await user.getIdToken()

  let response: Response

  try {
    response = await fetch('/api/order-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        orderId,
        status,
      }),
    })
  } catch {
    throw new Error(
      'Se interrumpió la conexión. Actualizá las órdenes para comprobar si el cambio se realizó.',
    )
  }

  let body: unknown

  try {
    body = await response.json()
  } catch {
    throw new Error(
      'No recibimos una respuesta válida. Actualizá las órdenes antes de reintentar.',
    )
  }

  if (!response.ok) {
    const message =
      typeof body === 'object' &&
      body !== null &&
      'error' in body &&
      typeof body.error === 'string'
        ? body.error
        : 'No pudimos actualizar la orden.'

    throw new Error(message)
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('orderId' in body) ||
    body.orderId !== orderId ||
    !('status' in body) ||
    body.status !== status
  ) {
    throw new Error(
      'La confirmación no coincide con el cambio solicitado. Actualizá las órdenes.',
    )
  }
}