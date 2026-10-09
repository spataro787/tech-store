import { Link, Navigate, Outlet } from 'react-router'
import Panel from '../ui/Panel'
import { useAuth } from '../../hooks/useAuth'

function RequireAdmin() {
  const {
    user,
    loading,
    role,
    roleLoading,
    roleError,
  } = useAuth()

  if (loading || (user && roleLoading)) {
    return (
      <div className="store-shell grid min-h-screen place-items-center p-4">
        <Panel className="w-full max-w-md text-center">
          <p role="status" className="text-accent">
            Comprobando acceso…
          </p>
        </Panel>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (roleError) {
    return (
      <div className="store-shell grid min-h-screen place-items-center p-4">
        <section
          aria-labelledby="access-error-title"
          className="w-full max-w-md"
        >
          <Panel>
            <h1
              id="access-error-title"
              className="text-2xl font-bold text-heading"
            >
              No pudimos comprobar tu acceso
            </h1>

            <p role="alert" className="store-error mt-4">
              {roleError}
            </p>

            <Link to="/" className="store-nav-link mt-6">
              Volver al catálogo
            </Link>
          </Panel>
        </section>
      </div>
    )
  }

  if (role !== 'admin') {
    return (
      <div className="store-shell grid min-h-screen place-items-center p-4">
        <section
          aria-labelledby="restricted-title"
          className="w-full max-w-md"
        >
          <Panel>
            <p className="text-xs font-semibold tracking-widest text-secondary">
              ACCESO RESTRINGIDO
            </p>

            <h1
              id="restricted-title"
              className="mt-3 text-2xl font-bold text-heading"
            >
              Acceso restringido
            </h1>

            <p className="mt-4 leading-7 text-muted">
              Esta sección está disponible únicamente para
              administradores.
            </p>

            <Link
              to="/"
              className="store-nav-link store-cart-link mt-6"
            >
              Volver al catálogo
            </Link>
          </Panel>
        </section>
      </div>
    )
  }

  return <Outlet />
}

export default RequireAdmin