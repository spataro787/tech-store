import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import Button from '../components/ui/Button'
import Panel from '../components/ui/Panel'
import { useAuth } from '../hooks/useAuth'
import { getOrderById } from '../services/orderService'
import type { Order } from '../types/order'
import { orderStatusLabels } from '../types/order'

const priceFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
})

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

type OrderDetailState = {
  orderId: string | undefined
  userId: string | null
  order: Order | null
  loading: boolean
  error: string | null
}

function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, loading: loadingAuth } = useAuth()
  const userId = user?.uid ?? null

  const [attempt, setAttempt] = useState(0)

  const [state, setState] = useState<OrderDetailState>({
    orderId: undefined,
    userId: null,
    order: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let active = true

    async function loadOrder() {
      if (!userId || !id) {
        setState({
          orderId: id,
          userId,
          order: null,
          loading: false,
          error: null,
        })
        return
      }

      setState({
        orderId: id,
        userId,
        order: null,
        loading: true,
        error: null,
      })

      try {
        const order = await getOrderById(id)

        if (active) {
          setState({
            orderId: id,
            userId,
            order,
            loading: false,
            error: null,
          })
        }
      } catch {
        if (active) {
          setState({
            orderId: id,
            userId,
            order: null,
            loading: false,
            error:
              'No pudimos consultar esta orden. Verificá que corresponda a tu cuenta y volvé a intentar.',
          })
        }
      }
    }

    void loadOrder()

    return () => {
      active = false
    }
  }, [id, userId, attempt])

  if (loadingAuth) {
    return (
      <Panel className="text-center">
        <p role="status" className="text-accent">
          Comprobando sesión…
        </p>
      </Panel>
    )
  }

  if (!user) {
    return (
      <Panel className="text-center">
        <h1 className="text-3xl font-bold text-heading">
          Iniciá sesión para consultar la orden
        </h1>

        <Link to="/login" className="store-nav-link mt-6">
          Iniciar sesión
        </Link>
      </Panel>
    )
  }

  if (
    state.loading ||
    state.orderId !== id ||
    state.userId !== userId
  ) {
    return (
      <Panel className="text-center" aria-busy="true">
        <p role="status" className="text-accent">
          Recuperando detalle de la orden…
        </p>
      </Panel>
    )
  }

  if (state.error) {
    return (
      <Panel className="text-center">
        <h1 className="text-2xl font-bold text-heading">
          No pudimos abrir la orden
        </h1>

        <p role="alert" className="store-error mt-5">
          {state.error}
        </p>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            onClick={() =>
              setAttempt((previous) => previous + 1)
            }
          >
            Reintentar
          </Button>

          <Link to="/orders" className="store-nav-link">
            Volver a mis órdenes
          </Link>
        </div>
      </Panel>
    )
  }

  const order = state.order

  if (!order) {
    return (
      <Panel className="py-12 text-center">
        <h1 className="text-3xl font-bold text-heading">
          Orden no encontrada
        </h1>

        <p className="mt-4 text-muted">
          No encontramos una orden con esa dirección.
        </p>

        <Link to="/orders" className="store-nav-link mt-6">
          Volver a mis órdenes
        </Link>
      </Panel>
    )
  }

  const totalUnits = order.items.reduce(
    (total, item) => total + item.quantity,
    0,
  )

  return (
    <section
      aria-labelledby="order-detail-title"
      className="space-y-6"
    >
      <Link to="/orders" className="store-nav-link">
        <span aria-hidden="true">←</span>
        Volver a mis órdenes
      </Link>

      <Panel>
        <p className="text-xs font-semibold tracking-widest text-secondary">
          DETALLE DE COMPRA
        </p>

        <h1
          id="order-detail-title"
          className="mt-3 text-3xl font-extrabold text-heading"
        >
          Orden #{order.id.slice(0, 8)}
        </h1>

        <p className="mt-3 break-all text-xs text-subtle">
          Identificador completo: {order.id}
        </p>

        <time
          dateTime={order.createdAt}
          className="mt-4 block text-sm text-muted"
        >
          {dateFormatter.format(new Date(order.createdAt))}
        </time>

        <p className="mt-4 font-semibold text-accent">
          Estado: {orderStatusLabels[order.status]}
        </p>
      </Panel>

      <Panel>
        <h2 className="text-xl font-bold text-heading">
          Productos comprados
        </h2>

        <ul className="mt-5 divide-y divide-subtle/20">
          {order.items.map((item) => (
            <li
              key={item.productId}
              className="flex flex-col gap-4 py-5 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-heading">
                  {item.name}
                </h3>

                <p className="mt-2 text-sm text-muted">
                  Cantidad: {item.quantity}
                </p>

                <p className="mt-2 text-sm text-muted">
                  Precio unitario:{' '}
                  {priceFormatter.format(
                    item.unitPriceCents / 100,
                  )}
                </p>
              </div>

              <p className="font-bold text-price">
                Subtotal:{' '}
                {priceFormatter.format(
                  item.subtotalCents / 100,
                )}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-5 border-t border-subtle/20 pt-5">
          <p className="text-sm text-muted">
            {totalUnits}{' '}
            {totalUnits === 1
              ? 'unidad comprada'
              : 'unidades compradas'}
          </p>

          <p className="mt-3 text-2xl font-extrabold text-price">
            Total: {priceFormatter.format(order.totalCents / 100)}
          </p>
        </div>
      </Panel>
    </section>
  )
}

export default OrderDetailPage