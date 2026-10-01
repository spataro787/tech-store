import { Link } from 'react-router'
import Button from '../components/ui/Button'
import { useCart } from '../hooks/useCart'

const priceFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
})

function CartPage() {
  const {
    items,
    totalItems,
    totalPrice,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart()

  if (items.length === 0) {
    return (
      <section className="py-12 text-center">
        <h1 className="text-3xl font-bold">
          Tu carrito está vacío
        </h1>

        <p className="mt-4 text-slate-600">
          Explorá el catálogo para agregar productos.
        </p>

        <Link
          to="/"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
        >
          Ver productos
        </Link>
      </section>
    )
  }

  return (
    <section aria-labelledby="cart-title">
      <h1 id="cart-title" className="text-3xl font-bold">
        Tu carrito
      </h1>

      <p className="mt-2 text-slate-600">
        Unidades: {totalItems}
      </p>

      <ul className="mt-6 space-y-4">
        {items.map(({ product, quantity }) => (
          <li
            key={product.id}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  <Link
                    to={`/products/${product.id}`}
                    className="hover:underline"
                  >
                    {product.name}
                  </Link>
                </h2>

                <p className="mt-2 text-slate-600">
                  Precio unitario: {priceFormatter.format(product.price)}
                </p>

                <p className="mt-1 font-semibold">
                  Subtotal:{' '}
                  {priceFormatter.format(product.price * quantity)}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      updateQuantity(product.id, quantity - 1)
                    }
                    disabled={quantity <= 1}
                    aria-label={`Quitar una unidad de ${product.name}`}
                  >
                    −
                  </Button>

                  <span
                    aria-label={`Cantidad de ${product.name}`}
                    className="min-w-8 text-center font-semibold"
                  >
                    {quantity}
                  </span>

                  <Button
                    variant="secondary"
                    onClick={() =>
                      updateQuantity(product.id, quantity + 1)
                    }
                    disabled={quantity >= product.stock}
                    aria-label={`Agregar una unidad de ${product.name}`}
                  >
                    +
                  </Button>
                </div>

                <Button
                  variant="secondary"
                  onClick={() => removeItem(product.id)}
                  aria-label={`Eliminar ${product.name} del carrito`}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-2xl font-bold">
          Total: {priceFormatter.format(totalPrice)}
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button variant="secondary" onClick={clearCart}>
            Vaciar carrito
          </Button>

          <Link
            to="/"
            className="px-5 py-3 text-center font-medium text-blue-600 hover:underline"
          >
            Seguir comprando
          </Link>
        </div>
      </div>
    </section>
  )
}

export default CartPage