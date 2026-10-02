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
  const [logoutError, setLogoutError] = useState<string | null>(null)

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
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white px-4 py-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                to="/"
                className="text-3xl font-bold text-blue-600"
              >
                Tech Store
              </Link>

              <p className="mt-2 text-slate-600">
                Tu tienda de tecnología
              </p>
            </div>

            <nav
              aria-label="Navegación principal"
              className="flex flex-wrap items-center gap-3"
            >
              <Link
                to="/cart"
                className="rounded-lg bg-blue-50 px-4 py-3 font-medium text-blue-700 hover:bg-blue-100"
              >
                Carrito: {totalItems} unidades
              </Link>

              {loading ? (
                <span
                  role="status"
                  className="text-sm text-slate-600"
                >
                  Comprobando sesión…
                </span>
              ) : user ? (
                <>
                  <span className="break-all text-sm text-slate-600">
                    {user.email ?? 'Usuario conectado'}
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
                  className="rounded-lg px-4 py-3 font-medium text-blue-600 hover:bg-blue-50"
                >
                  Iniciar sesión
                </Link>
              )}
            </nav>
          </div>

          {loadingCart && (
            <p
              role="status"
              className="mt-4 text-sm text-slate-600"
            >
              Recuperando carrito…
            </p>
          )}

          {savingCart && (
            <p
              role="status"
              className="mt-4 text-sm text-slate-600"
            >
              Guardando carrito…
            </p>
          )}

          {cartError && (
            <p
              role="alert"
              className="mt-4 text-sm text-red-700"
            >
              {cartError}
            </p>
          )}

          {logoutError && (
            <p
              role="alert"
              className="mt-4 text-sm text-red-700"
            >
              {logoutError}
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="px-4 py-4 text-center text-sm text-slate-500">
        <p>Proyecto educativo · React + TypeScript</p>
      </footer>
    </div>
  )
}

export default CustomerLayout