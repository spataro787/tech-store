import { doc, runTransaction } from 'firebase/firestore'
import { db } from './firebase'
import { products } from '../data/products'
import { validateProduct } from '../utils/productValidation'

export async function seedProducts(): Promise<number> {
  const entries = products.map((product) => ({
    reference: doc(db, 'products', product.id),
    data: validateProduct(product),
  }))

  return runTransaction(db, async (transaction) => {
    const snapshots = await Promise.all(
      entries.map((entry) =>
        transaction.get(entry.reference),
      ),
    )

    let createdCount = 0

    entries.forEach((entry, index) => {
      if (!snapshots[index].exists()) {
        transaction.set(entry.reference, entry.data)
        createdCount += 1
      }
    })

    return createdCount
  })
}