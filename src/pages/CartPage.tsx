import { Link } from 'react-router'
import Button from '../components/ui/Button'
import Panel from '../components/ui/Panel'
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
    loadingCart,
    cartError,
  } = useCart()

  if (loadingCart) {
    return (
      <section aria-busy="true">
        <Panel className="text-center">
          <p role="status" className="text-accent">
            Recuperando tu carrito…
          </p>
        </Panel>
      </section>
    )
  }

  if (items.length === 0 && cartError) {
    return (
      <section aria-labelledby="cart-error-title">
        <Panel className="text-center">
          <h1
            id="cart-error-title"
            className="text-2xl font-bold text-heading"
          >
            No pudimos recuperar tu carrito
          </h1>

          <p className="mt-4 text-sm leading-6 text-muted">
            Revisá el mensaje del encabezado y recargá la
            página para volver a intentar.
          </p>

          <Link to="/" className="store-nav-link mt-6">
            Volver al catálogo
          </Link>
        </Panel>
      </section>
    )
  }

  if (items.length === 0) {
    return (
      <section aria-labelledby="empty-cart-title">
        <Panel
          padding="none"
          className="relative isolate overflow-hidden px-6 py-14 text-center sm:py-20"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl"
          />

          <span
            aria-hidden="true"
            className="store-brand-mark mx-auto mb-6"
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 3h2l3 12h10l3-8H6" />
              <circle cx="9" cy="20" r="1" />
              <circle cx="18" cy="20" r="1" />
            </svg>
          </span>

          <h1
            id="empty-cart-title"
            className="text-3xl font-extrabold text-heading"
          >
            Tu carrito está vacío
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-muted">
            Explorá el catálogo para agregar productos.
            Tu próxima actualización te está esperando.
          </p>

          <Link
            to="/"
            className="store-nav-link store-cart-link mt-7"
          >
            Ver productos
            <span aria-hidden="true">↗</span>
          </Link>
        </Panel>
      </section>
    )
  }

  return (
    <section aria-labelledby="cart-title">
      <div className="mb-7">
        <p className="text-xs font-semibold tracking-widest text-secondary">
          TU SELECCIÓN
        </p>

        <h1
          id="cart-title"
          className="mt-3 text-3xl font-extrabold text-heading sm:text-4xl"
        >
          Tu carrito
        </h1>

        <p className="mt-3 text-sm text-muted">
          Unidades:{' '}
          <span className="font-semibold text-accent">
            {totalItems}
          </span>
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ul className="space-y-4">
          {items.map(({ product, quantity }) => (
            <li key={product.id}>
              <Panel>
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium tracking-wide text-secondary">
                      {product.category}
                    </p>

                    <h2 className="mt-2 text-xl font-bold text-heading">
                      <Link
                        to={`/products/${product.id}`}
                        className="rounded-sm hover:text-accent hover:underline"
                      >
                        {product.name}
                      </Link>
                    </h2>

                    <p className="mt-3 text-sm text-muted">
                      Precio unitario:{' '}
                      {priceFormatter.format(product.price)}
                    </p>

                    <p className="mt-2 font-semibold text-price">
                      Subtotal:{' '}
                      {priceFormatter.format(
                        product.price * quantity,
                      )}
                    </p>

                    <p className="mt-3 text-xs text-subtle">
                      Disponibles: {product.stock}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-3">
                    <div className="flex items-center gap-2 rounded-control border border-secondary/20 bg-surface-deep p-2">
                      <Button
                        variant="secondary"
                        onClick={() =>
                          updateQuantity(
                            product.id,
                            quantity - 1,
                          )
                        }
                        disabled={quantity <= 1}
                        aria-label={`Quitar una unidad de ${product.name}`}
                        className="px-4"
                      >
                        −
                      </Button>

                      <span
                        aria-label={`Cantidad de ${product.name}`}
                        className="min-w-8 text-center font-bold text-heading"
                      >
                        {quantity}
                      </span>

                      <Button
                        variant="secondary"
                        onClick={() =>
                          updateQuantity(
                            product.id,
                            quantity + 1,
                          )
                        }
                        disabled={quantity >= product.stock}
                        aria-label={`Agregar una unidad de ${product.name}`}
                        className="px-4"
                      >
                        +
                      </Button>
                    </div>

                    <Button
                      variant="secondary"
                      onClick={() => removeItem(product.id)}
                      aria-label={`Eliminar ${product.name} del carrito`}
                      className="w-full"
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </Panel>
            </li>
          ))}
        </ul>

        <aside aria-labelledby="summary-title">
          <Panel>
            <h2
              id="summary-title"
              className="text-lg font-bold text-heading"
            >
              Resumen del carrito
            </h2>

            <p className="mt-3 text-sm text-muted">
              {totalItems}{' '}
              {totalItems === 1
                ? 'unidad seleccionada'
                : 'unidades seleccionadas'}
            </p>

            <p className="mt-5 border-t border-accent/10 pt-5 text-2xl font-extrabold text-price">
              Total: {priceFormatter.format(totalPrice)}
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <Link
                to="/checkout"
                className="store-button store-button-primary w-full"
              >
                Continuar con la compra
              </Link>

              <Link
                to="/"
                className="store-nav-link store-cart-link w-full"
              >
                Seguir comprando
              </Link>

              <Button
                variant="secondary"
                onClick={clearCart}
                className="w-full"
              >
                Vaciar carrito
              </Button>
            </div>
          </Panel>
        </aside>
      </div>
    </section>
  )
}

export default CartPage