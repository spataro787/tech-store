import { Link, Outlet } from 'react-router'

function CustomerLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white px-4 py-6">
        <div className="mx-auto max-w-6xl">
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