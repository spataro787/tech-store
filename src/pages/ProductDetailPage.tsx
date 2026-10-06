import { Link, useParams } from 'react-router'
import Panel from '../components/ui/Panel'
import { products } from '../data/products'

const priceFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
})

function ProductDetailPage() {
  const { id } = useParams()

  const product = products.find(
    (candidate) => candidate.id === id,
  )

  if (!product) {
    return (
      <section aria-labelledby="product-not-found-title">
        <Panel className="text-center">
          <h1
            id="product-not-found-title"
            className="text-3xl font-bold text-heading"
          >
            Producto no encontrado
          </h1>

          <p className="mt-4 text-muted">
            El producto que buscás no está disponible.
          </p>

          <Link
            to="/"
            className="store-nav-link store-cart-link mt-6"
          >
            Volver al catálogo
          </Link>
        </Panel>
      </section>
    )
  }

  return (
    <section aria-labelledby="product-title">
      <Link to="/" className="store-nav-link mb-6">
        <span aria-hidden="true">←</span>
        Volver al catálogo
      </Link>

      <Panel>
        <div className="grid items-start gap-8 md:grid-cols-2">
          <div className="relative flex min-h-64 items-center justify-center overflow-hidden rounded-control border border-accent/20 bg-surface-deep sm:min-h-80">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute h-48 w-48 rounded-full bg-accent/10 blur-3xl"
            />

            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                width={480}
                height={320}
                className="relative h-80 w-full object-contain p-6"
              />
            ) : (
              <div className="relative text-center">
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
                    strokeWidth="1.2"
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
                    <rect
                      x="9"
                      y="9"
                      width="6"
                      height="6"
                      rx="1"
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

          <div>
            <p className="text-sm font-semibold text-secondary">
              {product.category}
            </p>

            <h1
              id="product-title"
              className="mt-3 text-3xl font-extrabold text-heading"
            >
              {product.name}
            </h1>

            <p className="mt-5 leading-7 text-muted">
              {product.description}
            </p>

            <p className="mt-7 text-xs font-medium tracking-widest text-subtle">
              PRECIO
            </p>

            <p className="mt-2 text-4xl font-extrabold text-price">
              {priceFormatter.format(product.price)}
            </p>

            <p
              className={`mt-5 text-sm ${
                product.stock > 0
                  ? 'text-accent'
                  : 'text-danger-content'
              }`}
            >
              {product.stock > 0
                ? `Disponibles: ${product.stock}`
                : 'Sin stock'}
            </p>

            <Link
              to="/cart"
              className="store-nav-link store-cart-link mt-7"
            >
              Ver mi carrito
            </Link>
          </div>
        </div>
      </Panel>
    </section>
  )
}

export default ProductDetailPage