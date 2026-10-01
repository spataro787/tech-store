import type { Product } from '../../types/product'

type ProductCardProps = {
  product: Product
}

const priceFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
})

function ProductCard({ product }: ProductCardProps) {
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
          {product.stock > 0
            ? `Disponibles: ${product.stock}`
            : 'Sin stock'}
        </p>
      </div>
    </article>
  )
}

export default ProductCard