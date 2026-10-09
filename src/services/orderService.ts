import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  where,
} from 'firebase/firestore'
import { db } from './firebase'
import type {
  Order,
  OrderItem,
  OrderStatus,
} from '../types/order'

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function isPositiveInteger(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value > 0
  )
}

function readStatus(value: unknown): OrderStatus {
  if (
    value === 'pending' ||
    value === 'processing' ||
    value === 'completed' ||
    value === 'cancelled'
  ) {
    return value
  }

  throw new Error('La orden tiene un estado inválido.')
}

function readOrderItem(value: unknown): OrderItem {
  if (
    !isRecord(value) ||
    typeof value.productId !== 'string' ||
    !value.productId ||
    typeof value.name !== 'string' ||
    !value.name.trim() ||
    typeof value.imageUrl !== 'string' ||
    !isPositiveInteger(value.quantity) ||
    !isPositiveInteger(value.unitPriceCents) ||
    !isPositiveInteger(value.subtotalCents) ||
    value.subtotalCents !==
      value.unitPriceCents * value.quantity
  ) {
    throw new Error('La orden contiene un producto inválido.')
  }

  return {
    productId: value.productId,
    name: value.name,
    imageUrl: value.imageUrl,
    quantity: value.quantity,
    unitPriceCents: value.unitPriceCents,
    subtotalCents: value.subtotalCents,
  }
}

export function readOrder(id: string, value: unknown): Order {  if (
    !isRecord(value) ||
    typeof value.userId !== 'string' ||
    !value.userId ||
    !Array.isArray(value.items) ||
    value.items.length === 0 ||
    value.items.length > 100 ||
    !isPositiveInteger(value.totalCents) ||
    value.currency !== 'ARS' ||
    !(value.createdAt instanceof Timestamp)
  ) {
    throw new Error('La orden tiene un formato inválido.')
  }

  const items = value.items.map(readOrderItem)

  const totalCents = items.reduce(
    (total, item) => total + item.subtotalCents,
    0,
  )

  const productIds = new Set(
    items.map((item) => item.productId),
  )

  if (
    !Number.isSafeInteger(totalCents) ||
    totalCents !== value.totalCents ||
    productIds.size !== items.length
  ) {
    throw new Error('Los importes o productos de la orden son inválidos.')
  }

  return {
    id,
    userId: value.userId,
    items,
    totalCents,
    currency: 'ARS',
    status: readStatus(value.status),
    createdAt: value.createdAt.toDate().toISOString(),
  }
}

export async function getUserOrders(
  userId: string,
): Promise<Order[]> {
  const ordersQuery = query(
    collection(db, 'orders'),
    where('userId', '==', userId),
  )

  const snapshot = await getDocs(ordersQuery)

  return snapshot.docs
    .map((document) =>
      readOrder(document.id, document.data()),
    )
    .sort((first, second) =>
      second.createdAt.localeCompare(first.createdAt),
    )
}

export async function getOrderById(
  orderId: string,
): Promise<Order | null> {
  if (!orderId.trim() || orderId.includes('/')) {
    throw new Error('El identificador de la orden no es válido.')
  }

  const snapshot = await getDoc(
    doc(db, 'orders', orderId),
  )

  if (!snapshot.exists()) {
    return null
  }

  return readOrder(snapshot.id, snapshot.data())
}