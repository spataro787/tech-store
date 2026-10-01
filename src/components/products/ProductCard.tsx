import { Link } from 'react-router'
import type { Product } from '../../types/product'
import { useCart } from '../../hooks/useCart'
import Button from '../ui/Button'

type ProductCardProps = {
  product: Product
}

const priceFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
})

function ProductCard({ product }: ProductCardProps) {
  const { items, addItem } = useCart()

  const quantityInCart =
    items.find((item) => item.product.id === product.id)?.quantity ?? 0

  const hasStock = product.stock > 0
  const reachedStock = quantityInCart >= product.stock
  const cannotAdd = !hasStock || reachedStock

  const buttonText = !hasStock
    ? 'Sin stock'
    : reachedStock
      ? 'Stock máximo en carrito'
      : 'Agregar al carrito'

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className="h-48 w-full object-contain"
        />
      ) : (
        <div className="flex h-48 items-center justify-center bg-slate-100 text-slate-500">
          Sin imagen disponible
        </div>
      )}

      <div className="p-5">
        <p className="text-sm text-slate-500">
          {product.category}
        </p>

        <h2 className="mt-1 text-xl font-semibold">
          {product.name}
        </h2>

        <p className="mt-2 text-slate-600">
          {product.description}
        </p>

        <p className="mt-4 text-2xl font-bold text-blue-600">
          {priceFormatter.format(product.price)}
        </p>

        <p className="mt-2 text-sm text-slate-500">
          {hasStock
            ? `Disponibles: ${product.stock}`
            : 'Sin stock'}
        </p>

        <p role="status" className="mt-2 text-sm text-slate-600">
          En tu carrito: {quantityInCart}
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <Button
            onClick={() => addItem(product)}
            disabled={cannotAdd}
          >
            {buttonText}
          </Button>

          <Link
            to={`/products/${product.id}`}
            aria-label={`Ver detalle de ${product.name}`}
            className="rounded-lg border border-blue-600 px-5 py-3 text-center font-medium text-blue-600 hover:bg-blue-50"
          >
            Ver detalle
          </Link>
        </div>
      </div>
    </article>
  )
}

export default ProductCard