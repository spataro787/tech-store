import { Link, Outlet } from 'react-router'
import { useAuth } from '../hooks/useAuth'

function AdminLayout() {
  const { user } = useAuth()

  return (
    <div className="store-shell flex min-h-screen flex-col">
      <header className="store-header px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/admin"
            className="inline-block rounded-control"
          >
            <span className="store-brand-title block text-xl">
              TECH STORE
            </span>
            <span className="mt-2 block text-xs font-semibold tracking-widest text-secondary">
              ADMINISTRACIÓN
            </span>
          </Link>

          <nav
            aria-label="Navegación de administración"
            className="flex flex-wrap items-center gap-3"
          >
            <Link to="/admin" className="store-nav-link">
              Inicio
            </Link>

            <Link to="/admin/orders" className="store-nav-link">
              Órdenes
            </Link>

            <Link to="/admin/products" className="store-nav-link">
              Productos
            </Link>

            <Link to="/" className="store-nav-link">
              Ir a la tienda
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <Outlet />
      </main>

      <footer className="store-footer px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 text-sm sm:flex-row sm:justify-between">
          <p className="text-secondary">
            Panel de administración
          </p>

          <p className="break-all text-subtle">
            {user?.email ?? 'Administrador'}
          </p>
        </div>
      </footer>
    </div>
  )
}

export default AdminLayout