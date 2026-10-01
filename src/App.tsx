import {
  BrowserRouter,
  Link,
  Route,
  Routes,
} from 'react-router'
import CustomerLayout from './layouts/CustomerLayout'
import CatalogPage from './pages/CatalogPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<CustomerLayout />}>
          <Route index element={<CatalogPage />} />

          <Route
            path="products/:id"
            element={<ProductDetailPage />}
          />

          <Route path="cart" element={<CartPage />} />

          <Route
            path="*"
            element={
              <section className="py-12 text-center">
                <h1 className="text-3xl font-bold">
                  Página no encontrada
                </h1>

                <p className="mt-4 text-slate-600">
                  La dirección que buscás no existe.
                </p>

                <Link
                  to="/"
                  className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
                >
                  Volver al catálogo
                </Link>
              </section>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App