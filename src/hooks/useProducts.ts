import { useEffect, useState } from 'react'
import type { Product } from '../types/product'
import { getProducts } from '../services/productService'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true

    async function loadProducts() {
      setLoading(true)
      setError(null)

      try {
        const result = await getProducts()

        if (active) {
          setProducts(result)
        }
      } catch {
        if (active) {
          setError(
            'No pudimos cargar los productos. Revisá tu conexión e intentá nuevamente.',
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadProducts()

    return () => {
      active = false
    }
  }, [attempt])

  function retry() {
    setAttempt((previous) => previous + 1)
  }

  return {
    products,
    loading,
    error,
    retry,
  }
}