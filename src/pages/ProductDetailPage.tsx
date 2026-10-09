import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import Button from '../components/ui/Button'
import Panel from '../components/ui/Panel'
import ProductImage from '../components/products/ProductImage'
import { useCart } from '../hooks/useCart'
import { getProductById } from '../services/productService'
import type { Product } from '../types/product'

const priceFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
})

type ProductDetailState = {
  id: string | undefined
  product: Product | null
  loading: boolean
  error: string | null
}

function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { items, addItem, loadingCart, cartError } = useCart()

  const [attempt, setAttempt] = useState(0)

  const [state, setState] = useState<ProductDetailState>({
    id,
    product: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let active = true

    async function loadProduct() {
      setState({
        id,
        product: null,
        loading: true,
        error: null,
      })

      if (!id) {
        setState({
          id,
          product: null,
          loading: false,
          error: null,
        })
        return
      }

      try {
        const product = await getProductById(id)

        if (active) {
          setState({
            id,
            product,
            loading: false,
            error: null,
          })
        }
      } catch {
        if (active) {
          setState({
            id,
            product: null,
            loading: false,
            error:
              'No pudimos cargar el producto. Revisá tu conexión e intentá nuevamente.',
          })
        }
      }
    }

    void loadProduct()

    return () => {
      active = false
    }
  }, [id, attempt])

  function handleRetry() {
    setAttempt((previous) => previous + 1)
  }

  // Evita mostrar el producto anterior al cambiar de URL.
  if (state.id !== id || state.loading) {
    return (
      <section aria-busy="true">
        <Panel className="text-center">
          <p role="status" className="text-accent">
            Cargando producto…
          </p>
        </Panel>
      </section>
    )
  }

  if (state.error) {
    return (
      <section aria-labelledby="product-error-title">
        <Panel className="text-center">
          <h1
            id="product-error-title"
            className="text-2xl font-bold text-heading"
          >
            No pudimos cargar el producto
          </h1>

          <p role="alert" className="store-error mt-5">
            {state.error}
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={handleRetry}>
              Reintentar
            </Button>

            <Link to="/" className="store-nav-link">
              Volver al catálogo
            </Link>
          </div>
        </Panel>
      </section>
    )
  }

  const product = state.product

  if (!product) {
    return (
      <section aria-labelledby="product-not-found-title">
        <Panel className="py-12 text-center">
          <h1
            id="product-not-found-title"
            className="text-3xl font-bold text-heading"
          >
            Producto no encontrado
          </h1>

          <p className="mt-4 text-muted">
            El producto no existe o ya no está disponible.
          </p>

          <Link to="/" className="store-nav-link mt-6">
            Volver al catálogo
          </Link>
        </Panel>
      </section>
    )
  }

  const quantityInCart =
    items.find((item) => item.product.id === product.id)
      ?.quantity ?? 0

  const hasStock = product.stock > 0
  const reachedStock = quantityInCart >= product.stock

  const cannotAdd =
    loadingCart ||
    Boolean(cartError) ||
    !hasStock ||
    reachedStock

  const buttonText = loadingCart
    ? 'Recuperando carrito…'
    : cartError
      ? 'Carrito no disponible'
      : !hasStock
        ? 'Sin stock'
        : reachedStock
          ? 'Stock máximo en carrito'
          : 'Agregar al carrito'

  return (
    <section aria-labelledby="product-title">
      <Link to="/" className="store-nav-link mb-6">
        <span aria-hidden="true">←</span>
        Volver al catálogo
      </Link>

      <Panel>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="flex min-h-64 items-center justify-center overflow-hidden rounded-panel border border-accent/20 bg-surface-deep p-6">
            {product.imageUrl ? (
              <ProductImage
                src={product.imageUrl}
                alt={product.name}
                className="h-72 w-full object-contain"
                loading="eager"
              />
            ) : (
              <div className="text-center">
                <span
                  aria-hidden="true"
                  className="store-brand-mark mx-auto mb-4"
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="6"
                      y="6"
                      width="12"
                      height="12"
                      rx="2"
                    />
                    <path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4" />
                  </svg>
                </span>

                <p className="text-sm text-subtle">
                  Sin imagen disponible
                </p>
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-widest text-secondary">
              {product.category}
            </p>

            <h1
              id="product-title"
              className="mt-3 text-3xl font-extrabold text-heading"
            >
              {product.name}
            </h1>

            <p className="mt-5 whitespace-pre-line leading-7 text-muted">
              {product.description}
            </p>

            <p className="mt-6 text-3xl font-extrabold text-price">
              {priceFormatter.format(product.price)}
            </p>

            <p
              className={`mt-4 text-sm ${
                hasStock ? 'text-accent' : 'text-danger-content'
              }`}
            >
              {hasStock
                ? `Disponibles: ${product.stock}`
                : 'Sin stock'}
            </p>

            <p role="status" className="mt-3 text-sm text-muted">
              En tu carrito: {quantityInCart}
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <Button
                onClick={() => addItem(product)}
                disabled={cannotAdd}
              >
                {buttonText}
              </Button>

              <Link
                to="/cart"
                className="store-nav-link"
              >
                Ver mi carrito
              </Link>
            </div>
          </div>
        </div>
      </Panel>
    </section>
  )
}

export default ProductDetailPage