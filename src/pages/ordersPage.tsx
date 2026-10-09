import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import Button from '../components/ui/Button'
import Panel from '../components/ui/Panel'
import { useAuth } from '../hooks/useAuth'
import { getUserOrders } from '../services/orderService'
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

type OrdersState = {
  userId: string | null
  orders: Order[]
  loading: boolean
  error: string | null
}

function OrdersPage() {
  const { user, loading: loadingAuth } = useAuth()
  const userId = user?.uid ?? null

  const [attempt, setAttempt] = useState(0)

  const [state, setState] = useState<OrdersState>({
    userId: null,
    orders: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    let active = true

    async function loadOrders() {
      if (!userId) {
        setState({
          userId: null,
          orders: [],
          loading: false,
          error: null,
        })
        return
      }

      setState({
        userId,
        orders: [],
        loading: true,
        error: null,
      })

      try {
        const orders = await getUserOrders(userId)

        if (active) {
          setState({
            userId,
            orders,
            loading: false,
            error: null,
          })
        }
      } catch {
        if (active) {
          setState({
            userId,
            orders: [],
            loading: false,
            error:
              'No pudimos recuperar tus órdenes. Revisá tu conexión e intentá nuevamente.',
          })
        }
      }
    }

    void loadOrders()

    return () => {
      active = false
    }
  }, [userId, attempt])

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
          Iniciá sesión para ver tus órdenes
        </h1>

        <Link to="/login" className="store-nav-link mt-6">
          Iniciar sesión
        </Link>
      </Panel>
    )
  }

  return (
    <section aria-labelledby="orders-title" className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-widest text-secondary">
          TU HISTORIAL
        </p>

        <h1
          id="orders-title"
          className="mt-3 text-3xl font-extrabold text-heading"
        >
          Mis órdenes
        </h1>

        <p className="mt-3 text-muted">
          Consultá tus compras y su estado.
        </p>
      </div>

      {state.userId !== userId || state.loading ? (
        <Panel className="text-center" aria-busy="true">
          <p role="status" className="text-accent">
            Recuperando tus órdenes…
          </p>
        </Panel>
      ) : state.error ? (
        <Panel className="text-center">
          <p role="alert" className="store-error">
            {state.error}
          </p>

          <Button
            onClick={() =>
              setAttempt((previous) => previous + 1)
            }
            className="mt-5"
          >
            Reintentar
          </Button>
        </Panel>
      ) : state.orders.length === 0 ? (
        <Panel className="py-12 text-center">
          <h2 className="text-2xl font-bold text-heading">
            Todavía no tenés compras
          </h2>

          <p className="mt-4 text-muted">
            Explorá el catálogo para encontrar tu próximo equipo.
          </p>

          <Link to="/" className="store-nav-link mt-6">
            Ver productos
          </Link>
        </Panel>
      ) : (
        <ul className="space-y-4">
          {state.orders.map((order) => {
            const totalUnits = order.items.reduce(
              (total, item) => total + item.quantity,
              0,
            )

            return (
              <li key={order.id}>
                <Panel>
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-heading">
                        Orden #{order.id.slice(0, 8)}
                      </h2>

                      <time
                        dateTime={order.createdAt}
                        className="mt-2 block text-sm text-subtle"
                      >
                        {dateFormatter.format(
                          new Date(order.createdAt),
                        )}
                      </time>

                      <p className="mt-3 text-sm text-muted">
                        {totalUnits}{' '}
                        {totalUnits === 1 ? 'unidad' : 'unidades'}
                      </p>

                      <p className="mt-3 text-sm font-semibold text-accent">
                        Estado: {orderStatusLabels[order.status]}
                      </p>
                    </div>

                    <div className="flex flex-col gap-4 sm:items-end">
                      <p className="text-2xl font-bold text-price">
                        {priceFormatter.format(
                          order.totalCents / 100,
                        )}
                      </p>

                      <Link
                        to={`/orders/${order.id}`}
                        aria-label={`Ver detalle de la orden ${order.id}`}
                        className="store-nav-link"
                      >
                        Ver detalle
                      </Link>
                    </div>
                  </div>
                </Panel>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default OrdersPage