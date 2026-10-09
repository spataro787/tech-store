import { createHash } from 'node:crypto'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from './firebaseAdmin.js'
import { validateProduct } from '../src/utils/productValidation.js'

type CheckoutItem = {
  productId: string
  quantity: number
}

export type CheckoutInput = {
  requestId: string
  items: CheckoutItem[]
  expectedTotalCents: number
}

export class CheckoutError extends Error {
  public status: number

  constructor(
    status: number,
    message: string,
  ) {
    super(message)
    this.name = 'CheckoutError'
    this.status = status
  }
}

function validateItems(value: unknown): CheckoutItem[] {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.length > 100
  ) {
    throw new CheckoutError(
      400,
      'El carrito debe contener entre 1 y 100 productos.',
    )
  }

  const ids = new Set<string>()

  const items = value.map((item: unknown) => {
    if (
      typeof item !== 'object' ||
      item === null ||
      !('productId' in item) ||
      !('quantity' in item) ||
      typeof item.productId !== 'string' ||
      !item.productId.trim() ||
      item.productId.includes('/') ||
      typeof item.quantity !== 'number' ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 1_000_000 ||
      ids.has(item.productId)
    ) {
      throw new CheckoutError(
        400,
        'El carrito contiene un producto o cantidad inválidos.',
      )
    }

    ids.add(item.productId)

    return {
      productId: item.productId,
      quantity: item.quantity,
    }
  })

  return items.sort((first, second) =>
    first.productId.localeCompare(second.productId),
  )
}

export async function checkout(
  userId: string,
  input: CheckoutInput,
) {
  if (
    typeof input.requestId !== 'string' ||
    !/^[a-zA-Z0-9-]{16,80}$/.test(input.requestId)
  ) {
    throw new CheckoutError(
      400,
      'El identificador de la compra no es válido.',
    )
  }

  if (
    !Number.isSafeInteger(input.expectedTotalCents) ||
    input.expectedTotalCents <= 0
  ) {
    throw new CheckoutError(400, 'El total no es válido.')
  }

  const requestedItems = validateItems(input.items)

  const fingerprint = createHash('sha256')
    .update(
      JSON.stringify({
        items: requestedItems,
        total: input.expectedTotalCents,
      }),
    )
    .digest('hex')

  const orderId = createHash('sha256')
    .update(JSON.stringify([userId, input.requestId]))
    .digest('hex')

  const db = getAdminDb()
  const orderReference = db.collection('orders').doc(orderId)
  const cartReference = db.collection('carts').doc(userId)

  return db.runTransaction(async (transaction) => {
    const existingOrder = await transaction.get(orderReference)

    if (existingOrder.exists) {
      const savedOrder = existingOrder.data()

      if (
        savedOrder?.userId !== userId ||
        savedOrder?.requestFingerprint !== fingerprint
      ) {
        throw new CheckoutError(
          409,
          'Este intento de compra corresponde a otro carrito.',
        )
      }

      return {
        orderId,
        totalCents: savedOrder.totalCents as number,
        status: savedOrder.status as string,
      }
    }

    const cartSnapshot = await transaction.get(cartReference)

    if (!cartSnapshot.exists) {
      throw new CheckoutError(409, 'Tu carrito está vacío.')
    }

    const savedItems = validateItems(cartSnapshot.data()?.items)

    if (
      JSON.stringify(savedItems) !==
      JSON.stringify(requestedItems)
    ) {
      throw new CheckoutError(
        409,
        'Tu carrito cambió. Revisalo antes de confirmar.',
      )
    }

    const productReferences = savedItems.map((item) =>
      db.collection('products').doc(item.productId),
    )

    const productSnapshots = await transaction.getAll(
      ...productReferences,
    )

    const orderItems = savedItems.map((item, index) => {
      const snapshot = productSnapshots[index]

      if (!snapshot.exists) {
        throw new CheckoutError(
          409,
          'Un producto ya no está disponible. Revisá tu carrito.',
        )
      }

      const product = validateProduct(snapshot.data())

      if (product.stock < item.quantity) {
        throw new CheckoutError(
          409,
          `No hay stock suficiente de ${product.name}.`,
        )
      }

      const unitPriceCents = Math.round(product.price * 100)
      const subtotalCents = unitPriceCents * item.quantity

      if (!Number.isSafeInteger(subtotalCents)) {
        throw new CheckoutError(
          400,
          'El importe del producto supera el límite permitido.',
        )
      }

      return {
        productId: item.productId,
        name: product.name,
        imageUrl: product.imageUrl,
        quantity: item.quantity,
        unitPriceCents,
        subtotalCents,
        remainingStock: product.stock - item.quantity,
      }
    })

    const totalCents = orderItems.reduce(
      (total, item) => total + item.subtotalCents,
      0,
    )

    if (!Number.isSafeInteger(totalCents)) {
      throw new CheckoutError(400, 'El total supera el límite permitido.')
    }

    if (totalCents !== input.expectedTotalCents) {
      throw new CheckoutError(
        409,
        'Los precios cambiaron. Revisá el total antes de comprar.',
      )
    }

    orderItems.forEach((item, index) => {
      transaction.update(productReferences[index], {
        stock: item.remainingStock,
      })
    })

    transaction.create(orderReference, {
      userId,
      requestFingerprint: fingerprint,
      items: orderItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        imageUrl: item.imageUrl,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        subtotalCents: item.subtotalCents,
      })),
      totalCents,
      currency: 'ARS',
      status: 'pending',
      payment: {
        method: 'simulation',
        status: 'approved',
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    transaction.set(cartReference, {
      items: [],
      updatedAt: FieldValue.serverTimestamp(),
    })

    return {
      orderId,
      totalCents,
      status: 'pending',
    }
  })
}
