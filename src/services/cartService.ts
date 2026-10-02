import {
  doc,
  getDocFromServer,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import { products } from '../data/products'
import type { CartState } from '../types/cart'

type StoredCartItem = {
  productId: string
  quantity: number
}

function isStoredCartItem(value: unknown): value is StoredCartItem {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  return (
    'productId' in value &&
    typeof value.productId === 'string' &&
    value.productId.trim() !== '' &&
    'quantity' in value &&
    typeof value.quantity === 'number' &&
    Number.isSafeInteger(value.quantity) &&
    value.quantity >= 1
  )
}

function validateItems(value: unknown): StoredCartItem[] {
  if (!Array.isArray(value) || value.length > 100) {
    throw new Error('El carrito guardado tiene un formato inválido.')
  }

  const result: StoredCartItem[] = []
  const ids = new Set<string>()

  for (const item of value) {
    if (!isStoredCartItem(item) || ids.has(item.productId)) {
      throw new Error('El carrito contiene un elemento inválido.')
    }

    ids.add(item.productId)

    result.push({
      productId: item.productId,
      quantity: item.quantity,
    })
  }

  return result
}

export async function loadCart(userId: string): Promise<CartState> {
  const reference = doc(db, 'carts', userId)
  const snapshot = await getDocFromServer(reference)

  if (!snapshot.exists()) {
    return []
  }

  const rawItems: unknown = snapshot.data().items
  const storedItems = validateItems(rawItems)
  const result: CartState = []

  for (const item of storedItems) {
    const product = products.find(
      (candidate) => candidate.id === item.productId,
    )

    if (
      !product ||
      !Number.isSafeInteger(product.stock) ||
      product.stock <= 0
    ) {
      continue
    }

    result.push({
      product,
      quantity: Math.min(item.quantity, product.stock),
    })
  }

  return result
}

export async function saveCart(
  userId: string,
  items: CartState,
): Promise<void> {
  const storedItems = validateItems(
    items.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
    })),
  )

  const reference = doc(db, 'carts', userId)

  await setDoc(reference, {
    items: storedItems,
    updatedAt: serverTimestamp(),
  })
}