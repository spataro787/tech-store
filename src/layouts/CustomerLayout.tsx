import { useState } from 'react'
import { Link, Outlet } from 'react-router'
import Button from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../hooks/useCart'
import { logout } from '../services/authService'

function CustomerLayout() {
  const { user, loading } = useAuth()

  const {
    totalItems,
    flushCart,
    loadingCart,
    savingCart,
    cartError,
  } = useCart()

  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] =
    useState<string | null>(null)

  async function handleLogout() {
    if (loggingOut) {
      return
    }

    setLoggingOut(true)
    setLogoutError(null)

    try {
      await flushCart()
      await logout()
    } catch {
      setLogoutError(
        'No pudimos completar el cierre de sesión. Verificá que el carrito se haya guardado e intentá nuevamente.',
      )
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="store-shell flex min-h-screen flex-col">
      <header className="store-header px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <Link
              to="/"
              aria-label="Tech Store, ir al catálogo"
              className="inline-flex items-center gap-3 rounded-control"
            >
              <span
                aria-hidden="true"
                className="store-brand-mark"
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
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
                  <path d="M9 1v5m6-5v5M9 18v5m6-5v5M1 9h5m-5 6h5m12-6h5m-5 6h5" />
                  <path d="m13 9-3 4h3l-2 3" />
                </svg>
              </span>

              <span>
                <span className="store-brand-title block text-xl sm:text-2xl">
                  TECH STORE
                </span>

                <span className="mt-1 block text-xs tracking-widest text-accent/80">
                  TECNOLOGÍA DE OTRA GALAXIA
                </span>
              </span>
            </Link>

            <nav
              aria-label="Navegación principal"
              className="flex flex-wrap items-center gap-3"
            >
              <Link to="/" className="store-nav-link">
                Catálogo
              </Link>

              <Link
                to="/cart"
                className="store-nav-link store-cart-link"
              >
                <svg
                  aria-hidden="true"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3h2l3 12h10l3-8H6" />
                  <circle cx="9" cy="20" r="1" />
                  <circle cx="18" cy="20" r="1" />
                </svg>

                <span>
                  Carrito: {totalItems} unidades
                </span>
              </Link>

              {user && (
                <Link to="/orders" className="store-nav-link">
                  Mis órdenes
                </Link>
              )}

              {loading ? (
                <span
                  role="status"
                  className="text-sm text-muted"
                >
                  Comprobando sesión…
                </span>
              ) : user ? (
                <>
                  <span className="flex max-w-full items-center gap-2 text-sm text-muted">
                    <span
                      aria-hidden="true"
                      className="store-light-dot"
                    />

                    <span className="min-w-0 break-all">
                      {user.email ?? 'Usuario conectado'}
                    </span>
                  </span>

                  <Button
                    variant="secondary"
                    onClick={handleLogout}
                    disabled={loggingOut || loadingCart}
                  >
                    {loggingOut
                      ? 'Cerrando sesión…'
                      : 'Cerrar sesión'}
                  </Button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="store-nav-link"
                >
                  Iniciar sesión
                </Link>
              )}
            </nav>
          </div>

          <div className="space-y-3">
            {loadingCart && (
              <p role="status" className="store-status mt-4">
                Recuperando carrito…
              </p>
            )}

            {savingCart && (
              <p role="status" className="store-status mt-4">
                Guardando carrito…
              </p>
            )}

            {cartError && (
              <p role="alert" className="store-error mt-4">
                {cartError}
              </p>
            )}

            {logoutError && (
              <p role="alert" className="store-error mt-4">
                {logoutError}
              </p>
            )}
          </div>
        </div>
      </header>

      <main className="store-content mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <Outlet />
      </main>

      <footer className="store-footer px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p className="text-xs font-semibold tracking-widest text-accent">
            TECH STORE
          </p>

          <p className="text-xs text-subtle">
            Proyecto educativo · React + TypeScript
          </p>

          <p className="text-xs text-secondary">
            Explorá tu próxima actualización
          </p>
        </div>
      </footer>
    </div>
  )
}

export default CustomerLayout