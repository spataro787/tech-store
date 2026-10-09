import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import Button from '../../components/ui/Button'
import Panel from '../../components/ui/Panel'
import Select from '../../components/ui/Select'
import {
  getAdminOrders,
  updateOrderStatus,
} from '../../services/adminOrderService'
import type {
  Order,
  OrderStatus,
} from '../../types/order'
import { orderStatusLabels } from '../../types/order'

const priceFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
})

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [filter, setFilter] = useState<OrderStatus | ''>('')
  const [attempt, setAttempt] = useState(0)
  const [updating, setUpdating] = useState(false)

  const busyRef = useRef(false)
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadOrders() {
      setLoading(true)
      setLoadError(null)

      try {
        const result = await getAdminOrders()

        if (active) {
          setOrders(result)
        }
      } catch {
        if (active) {
          setLoadError(
            'No pudimos cargar las órdenes. Revisá tu conexión y los permisos de administrador.',
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadOrders()

    return () => {
      active = false
    }
  }, [attempt])

  function handleRefresh() {
    setActionError(null)
    setMessage(null)
    setAttempt((previous) => previous + 1)
  }

  async function handleStatusChange(
    order: Order,
    status: OrderStatus,
  ) {
    if (busyRef.current || loading) {
      return
    }

    if (
      status === 'cancelled' &&
      !window.confirm(
        '¿Cancelar esta orden? Las unidades volverán al stock de los productos que todavía existan.',
      )
    ) {
      return
    }

    busyRef.current = true
    setUpdating(true)
    setActionError(null)
    setMessage(null)

    try {
      await updateOrderStatus(order.id, status)

      if (mountedRef.current) {
        setOrders((current) =>
          current.map((item) =>
            item.id === order.id
              ? { ...item, status }
              : item,
          ),
        )

        setMessage(
          status === 'cancelled'
            ? 'Orden cancelada. Se devolvió el stock de los productos existentes.'
            : `Orden actualizada: ${orderStatusLabels[status]}.`,
        )
      }
    } catch (error) {
      if (mountedRef.current) {
        setActionError(
          error instanceof Error
            ? error.message
            : 'No pudimos actualizar la orden.',
        )
      }
    } finally {
      busyRef.current = false

      if (mountedRef.current) {
        setUpdating(false)

        // Consulta el estado real, incluso si se perdió la respuesta.
        setAttempt((previous) => previous + 1)
      }
    }
  }

  const filteredOrders = orders.filter(
    (order) => filter === '' || order.status === filter,
  )

  const controlsDisabled = updating || loading

  return (
    <section aria-labelledby="admin-orders-title" className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-widest text-secondary">
          ADMINISTRACIÓN
        </p>

        <h1
          id="admin-orders-title"
          className="mt-3 text-3xl font-extrabold text-heading"
        >
          Gestión de órdenes
        </h1>

        <p className="mt-3 text-muted">
          Consultá las compras y actualizá su estado.
        </p>
      </div>

      <Panel>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Select
              id="order-status-filter"
              label="Filtrar por estado"
              value={filter}
              disabled={controlsDisabled}
              onChange={(event) => {
                const value = event.target.value

                if (
                  value === '' ||
                  value === 'pending' ||
                  value === 'processing' ||
                  value === 'completed' ||
                  value === 'cancelled'
                ) {
                  setFilter(value)
                }
              }}
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="processing">En preparación</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
            </Select>
          </div>

          <Button
            variant="secondary"
            onClick={handleRefresh}
            disabled={controlsDisabled}
          >
            Actualizar lista
          </Button>
        </div>
      </Panel>

      {message && (
        <p role="status" className="store-status">
          {message}
        </p>
      )}

      {actionError && (
        <p role="alert" className="store-error">
          {actionError}
        </p>
      )}

      {updating && (
        <p role="status" className="store-status">
          Actualizando orden…
        </p>
      )}

      {loading ? (
        <Panel className="text-center" aria-busy="true">
          <p role="status" className="text-accent">
            Cargando órdenes…
          </p>
        </Panel>
      ) : loadError ? (
        <Panel className="text-center">
          <p role="alert" className="store-error">
            {loadError}
          </p>

          <Button onClick={handleRefresh} className="mt-5">
            Reintentar
          </Button>
        </Panel>
      ) : filteredOrders.length === 0 ? (
        <Panel className="py-10 text-center">
          <h2 className="text-xl font-bold text-heading">
            No hay órdenes para mostrar
          </h2>

          <p className="mt-3 text-muted">
            {orders.length === 0
              ? 'Las compras aparecerán aquí cuando se registren.'
              : 'Probá seleccionar otro estado.'}
          </p>
        </Panel>
      ) : (
        <>
          <p role="status" className="text-sm text-muted">
            Órdenes encontradas: {filteredOrders.length}
          </p>

          <ul className="space-y-4">
            {filteredOrders.map((order) => (
              <li key={order.id}>
                <Panel>
                  <div className="flex flex-col gap-5 sm:flex-row sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="text-xl font-bold text-heading">
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

                      <p className="mt-3 break-all text-xs text-muted">
                        Cliente: {order.userId}
                      </p>

                      <p className="mt-3 font-semibold text-accent">
                        Estado: {orderStatusLabels[order.status]}
                      </p>
                    </div>

                    <p className="text-2xl font-bold text-price">
                      {priceFormatter.format(
                        order.totalCents / 100,
                      )}
                    </p>
                  </div>

                  <ul className="mt-5 space-y-2 text-sm text-muted">
                    {order.items.map((item) => (
                      <li key={item.productId}>
                        {item.name} × {item.quantity}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      to={`/orders/${order.id}`}
                      className="store-nav-link"
                    >
                      Ver detalle
                    </Link>

                    {order.status === 'pending' && (
                      <Button
                        disabled={controlsDisabled}
                        onClick={() =>
                          handleStatusChange(order, 'processing')
                        }
                      >
                        Pasar a preparación
                      </Button>
                    )}

                    {order.status === 'processing' && (
                      <Button
                        disabled={controlsDisabled}
                        onClick={() =>
                          handleStatusChange(order, 'completed')
                        }
                      >
                        Completar orden
                      </Button>
                    )}

                    {(order.status === 'pending' ||
                      order.status === 'processing') && (
                      <Button
                        variant="secondary"
                        disabled={controlsDisabled}
                        onClick={() =>
                          handleStatusChange(order, 'cancelled')
                        }
                      >
                        Cancelar orden
                      </Button>
                    )}
                  </div>
                </Panel>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

export default AdminOrdersPage