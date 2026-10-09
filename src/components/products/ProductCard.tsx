import { Link } from 'react-router'
import type { Product } from '../../types/product'
import { useCart } from '../../hooks/useCart'
import Button from '../ui/Button'
import Panel from '../ui/Panel'
import ProductImage from './ProductImage'

type ProductCardProps = {
  product: Product
}

const priceFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
})

function ProductCard({ product }: ProductCardProps) {
  const { items, addItem, loadingCart } = useCart()

  const quantityInCart =
    items.find(
      (item) => item.product.id === product.id,
    )?.quantity ?? 0

  const hasStock = product.stock > 0
  const reachedStock = quantityInCart >= product.stock

  const cannotAdd =
    loadingCart || !hasStock || reachedStock

  const buttonText = loadingCart
    ? 'Recuperando carrito…'
    : !hasStock
      ? 'Sin stock'
      : reachedStock
        ? 'Stock máximo en carrito'
        : 'Agregar al carrito'

  return (
    <article className="h-full">
      <Panel
        padding="none"
        className="flex h-full flex-col overflow-hidden transition-[border-color,box-shadow] duration-200 hover:border-accent/50 hover:shadow-neon motion-reduce:transition-none"
      >
        <div className="relative flex h-52 items-center justify-center overflow-hidden border-b border-subtle/20 bg-surface-deep">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute h-36 w-36 rounded-full bg-accent/10 blur-2xl"
          />

          <span className="absolute left-4 top-4 z-10 rounded-full border border-secondary/25 bg-surface-secondary px-3 py-1 text-xs font-medium text-secondary">
            {product.category}
          </span>

          {product.imageUrl ? (
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              loading="lazy"
              width={320}
              height={208}
              className="relative h-full w-full object-contain p-6 pt-12"
            />
          ) : (
            <div className="relative flex flex-col items-center gap-4 pt-6">
              <div
                aria-hidden="true"
                className="flex h-20 w-20 items-center justify-center rounded-control border border-accent/30 bg-accent/5 text-accent shadow-panel"
              >
                <svg
                  width="42"
                  height="42"
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
              </div>

              <p className="text-xs text-subtle">
                Sin imagen disponible
              </p>
            </div>
          )}

          <div
            aria-hidden="true"
            className="absolute bottom-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-accent/60 to-transparent"
          />
        </div>

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <h2 className="text-xl font-bold text-heading">
            {product.name}
          </h2>

          <p className="mt-3 text-sm leading-6 text-muted">
            {product.description}
          </p>

          <div className="mt-auto pt-6">
            <p className="text-xs font-medium tracking-widest text-subtle">
              PRECIO
            </p>

            <p className="mt-1 text-3xl font-extrabold tracking-tight text-price">
              {priceFormatter.format(product.price)}
            </p>

            <div className="mt-4 space-y-2 border-t border-subtle/20 pt-4">
              <p
                className={`text-sm ${
                  hasStock
                    ? 'text-accent'
                    : 'text-danger-content'
                }`}
              >
                {hasStock
                  ? `Disponibles: ${product.stock}`
                  : 'Sin stock'}
              </p>

              <p
                role="status"
                className="text-sm text-muted"
              >
                En tu carrito: {quantityInCart}
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <Button
                onClick={() => addItem(product)}
                disabled={cannotAdd}
                className="w-full"
              >
                {buttonText}
              </Button>

              <Link
                to={`/products/${product.id}`}
                aria-label={`Ver detalle de ${product.name}`}
                className="store-nav-link w-full"
              >
                Ver detalle
                <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        </div>
      </Panel>
    </article>
  )
}

export default ProductCard