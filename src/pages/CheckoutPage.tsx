import { useRef, useState } from 'react'
import { Link } from 'react-router'
import Button from '../components/ui/Button'
import Panel from '../components/ui/Panel'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../hooks/useCart'
import {
  CheckoutServiceError,
  confirmCheckout,
} from '../services/checkoutService'
import type {
  CheckoutRequest,
  CheckoutResult,
} from '../types/checkout'

const priceFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
})

function getStorageKey(userId: string) {
  return `tech-store:checkout:${userId}`
}

function readPendingCheckout(
  userId: string,
): CheckoutRequest | null {
  const saved = sessionStorage.getItem(getStorageKey(userId))

  if (!saved) {
    return null
  }

  const value: unknown = JSON.parse(saved)

  if (
    typeof value !== 'object' ||
    value === null ||
    !('requestId' in value) ||
    typeof value.requestId !== 'string' ||
    !/^[a-zA-Z0-9-]{16,80}$/.test(value.requestId) ||
    !('expectedTotalCents' in value) ||
    typeof value.expectedTotalCents !== 'number' ||
    !Number.isSafeInteger(value.expectedTotalCents) ||
    value.expectedTotalCents <= 0 ||
    !('items' in value) ||
    !Array.isArray(value.items) ||
    value.items.length === 0 ||
    value.items.length > 100
  ) {
    throw new Error('El intento guardado tiene un formato inválido.')
  }

  const ids = new Set<string>()

  const items = value.items.map((item: unknown) => {
    if (
      typeof item !== 'object' ||
      item === null ||
      !('productId' in item) ||
      typeof item.productId !== 'string' ||
      !item.productId.trim() ||
      item.productId.includes('/') ||
      ids.has(item.productId) ||
      !('quantity' in item) ||
      typeof item.quantity !== 'number' ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 1_000_000
    ) {
      throw new Error('El intento guardado contiene un item inválido.')
    }

    ids.add(item.productId)

    return {
      productId: item.productId,
      quantity: item.quantity,
    }
  })

  return {
    requestId: value.requestId,
    items,
    expectedTotalCents: value.expectedTotalCents,
  }
}

function CheckoutPage() {
  const { user, loading } = useAuth()

  const {
    items,
    loadingCart,
    cartError,
    flushCart,
    clearCart,
  } = useCart()

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CheckoutResult | null>(null)
  const [needsReview, setNeedsReview] = useState(false)

  const busyRef = useRef(false)

  // Si la compra se registró pero se perdió la respuesta,
  // el carrito puede estar vacío. Conservamos la opción de reintentar.
  const [recovery] = useState(() => {
    if (!user) {
      return { input: null, error: null }
    }

    try {
      return {
        input: readPendingCheckout(user.uid),
        error: null,
      }
    } catch {
      return {
        input: null,
        error:
          'No pudimos recuperar el intento anterior. No confirmes otra compra hasta revisar tus órdenes.',
      }
    }
  })

  const totalCents = items.reduce(
    (total, item) =>
      total +
      Math.round(item.product.price * 100) * item.quantity,
    0,
  )

  async function handleConfirm() {
    if (!user || busyRef.current || needsReview || recovery.error) {
      return
    }

    busyRef.current = true
    setSubmitting(true)
    setError(null)

    try {
      // Esperamos que las cantidades estén guardadas antes de comprar.
      await flushCart()

      const pendingInput = readPendingCheckout(user.uid)

      const input: CheckoutRequest = pendingInput ?? {
        requestId: crypto.randomUUID(),
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        expectedTotalCents: totalCents,
      }

      // Se guarda antes de enviar la solicitud.
      sessionStorage.setItem(
        getStorageKey(user.uid),
        JSON.stringify(input),
      )

      const confirmation = await confirmCheckout(input)

      setResult(confirmation)
      clearCart()

      // La compra ya está confirmada aunque falle esta limpieza local.
      try {
        sessionStorage.removeItem(getStorageKey(user.uid))
      } catch {
        // Un reintento seguirá devolviendo la misma orden.
      }
    } catch (checkoutError) {
      if (checkoutError instanceof CheckoutServiceError) {
        setError(checkoutError.message)

        if (
          checkoutError.status === 400 ||
          checkoutError.status === 409
        ) {
          setNeedsReview(true)

          try {
            sessionStorage.removeItem(getStorageKey(user.uid))
          } catch {
            setError(
              'No pudimos limpiar el intento rechazado. Revisá tus órdenes antes de volver a comprar.',
            )
          }
        }
      } else {
        setError(
          'No pudimos preparar la compra. Verificá que el carrito se haya guardado y que el navegador permita guardar datos de esta pestaña.',
        )
      }
    } finally {
      busyRef.current = false
      setSubmitting(false)
    }
  }

  if (loading || loadingCart) {
    return (
      <Panel className="text-center" aria-busy="true">
        <p role="status" className="text-accent">
          Preparando tu compra…
        </p>
      </Panel>
    )
  }

  if (!user) {
    return (
      <Panel className="text-center">
        <h1 className="text-3xl font-bold text-heading">
          Iniciá sesión para comprar
        </h1>

        <p className="mt-4 text-muted">
          Tu compra quedará asociada a tu cuenta.
        </p>

        <Link to="/login" className="store-nav-link mt-6">
          Iniciar sesión
        </Link>
      </Panel>
    )
  }

  if (result) {
    return (
      <section aria-labelledby="checkout-success-title">
        <Panel className="text-center">
          <p className="text-sm font-semibold text-success">
            COMPRA CONFIRMADA
          </p>

          <h1
            id="checkout-success-title"
            className="mt-3 text-3xl font-bold text-heading"
          >
            ¡Gracias por tu compra!
          </h1>

          <p className="mt-4 text-muted">
            Pago simulado aprobado. Tu orden está pendiente
            de preparación.
          </p>

          <p className="mt-5 break-all text-sm text-subtle">
            Número de orden: {result.orderId}
          </p>

          <p className="mt-5 text-2xl font-bold text-price">
            Total: {priceFormatter.format(result.totalCents / 100)}
          </p>

          <Link to="/" className="store-nav-link mt-6">
            Volver al catálogo
          </Link>

          <Link
  to="/orders"
  className="store-nav-link store-cart-link mt-6"
>
  Ver mis órdenes
</Link>
        </Panel>
      </section>
    )
  }

  if (items.length === 0 && !recovery.input && !recovery.error) {
    return (
      <Panel className="text-center">
        <h1 className="text-3xl font-bold text-heading">
          Tu carrito está vacío
        </h1>

        <Link to="/" className="store-nav-link mt-6">
          Ver productos
        </Link>
      </Panel>
    )
  }

  return (
    <section aria-labelledby="checkout-title" className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-widest text-secondary">
          ÚLTIMO PASO
        </p>

        <h1
          id="checkout-title"
          className="mt-3 text-3xl font-extrabold text-heading"
        >
          Revisá tu compra
        </h1>
      </div>

      <Panel>
        {recovery.input ? (
          <p className="store-status">
            Hay un intento anterior pendiente de confirmación.
            Reintentaremos esa misma compra.
          </p>
        ) : (
          <>
            <ul className="divide-y divide-subtle/20">
              {items.map(({ product, quantity }) => (
                <li
                  key={product.id}
                  className="flex flex-wrap justify-between gap-3 py-4"
                >
                  <span className="text-heading">
                    {product.name} × {quantity}
                  </span>

                  <span className="font-semibold text-price">
                    {priceFormatter.format(
                      (Math.round(product.price * 100) * quantity) / 100,
                    )}
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-5 text-2xl font-bold text-price">
              Total: {priceFormatter.format(totalCents / 100)}
            </p>
          </>
        )}

        <p className="mt-5 text-sm leading-6 text-muted">
          Esta compra utiliza un pago simulado.
          No se solicitan datos de tarjeta ni se cobra dinero real.
        </p>

        {(error || recovery.error) && (
          <p role="alert" className="store-error mt-5">
            {error ?? recovery.error}
          </p>
        )}

        {cartError && (
          <p role="alert" className="store-error mt-5">
            {cartError}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={handleConfirm}
            disabled={
              submitting ||
              needsReview ||
              Boolean(recovery.error) ||
              Boolean(cartError)
            }
          >
            {submitting
              ? 'Confirmando compra…'
              : recovery.input || error
                ? 'Reintentar confirmación'
                : 'Confirmar compra simulada'}
          </Button>

          {needsReview ? (
            <Button
              variant="secondary"
              onClick={() => window.location.assign('/cart')}
            >
              Recargar y revisar carrito
            </Button>
          ) : (
            <Link
              to="/cart"
              className="store-nav-link"
              aria-disabled={submitting}
              onClick={(event) => {
                if (submitting) {
                  event.preventDefault()
                }
              }}
            >
              Volver al carrito
            </Link>
          )}
        </div>

        {submitting && (
          <p role="status" className="store-status mt-5">
            Verificando stock y registrando tu orden…
          </p>
        )}
      </Panel>
    </section>
  )
}

export default CheckoutPage