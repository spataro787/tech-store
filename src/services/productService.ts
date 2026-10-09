import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
} from 'firebase/firestore'
import { db } from './firebase'
import type {
  Product,
  ProductInput,
} from '../types/product'
import { validateProduct } from '../utils/productValidation'

function getProductReference(productId: string) {
  if (
    !productId.trim() ||
    productId.includes('/')
  ) {
    throw new Error('El ID del producto no es válido.')
  }

  return doc(db, 'products', productId)
}

export async function getProducts(): Promise<Product[]> {
  const productsQuery = query(
    collection(db, 'products'),
    orderBy('name'),
  )

  const snapshot = await getDocs(productsQuery)

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...validateProduct(document.data()),
  }))
}

export async function getProductById(
  productId: string,
): Promise<Product | null> {
  const reference = getProductReference(productId)
  const snapshot = await getDoc(reference)

  if (!snapshot.exists()) {
    return null
  }

  return {
    id: snapshot.id,
    ...validateProduct(snapshot.data()),
  }
}

export async function createProduct(
  input: ProductInput,
): Promise<Product> {
  const data = validateProduct(input)

  const reference = await addDoc(
    collection(db, 'products'),
    data,
  )

  return {
    id: reference.id,
    ...data,
  }
}

export async function updateProduct(
  productId: string,
  input: ProductInput,
  expectedStock: number,
): Promise<Product> {
  const data = validateProduct(input)
  const reference = getProductReference(productId)

  if (
    !Number.isSafeInteger(expectedStock) ||
    expectedStock < 0
  ) {
    throw new Error('El stock original no es válido.')
  }

  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(reference)

    if (!snapshot.exists()) {
      throw new Error('El producto ya no existe.')
    }

    const currentProduct = validateProduct(snapshot.data())

    if (currentProduct.stock !== expectedStock) {
      throw new Error(
        'El stock cambió mientras editabas. Cerrá el formulario, actualizá la lista y volvé a abrir el producto.',
      )
    }

    transaction.update(reference, { ...data })

    return {
      id: reference.id,
      ...data,
    }
  })
}

export async function deleteProduct(
  productId: string,
): Promise<void> {
  const reference = getProductReference(productId)

  await deleteDoc(reference)
}