import {
  BrowserRouter,
  Route,
  Routes,
} from 'react-router'
import { lazy, Suspense } from 'react'
import CatalogPage from './pages/CatalogPage'
import CustomerLayout from './layouts/CustomerLayout'

const RequireAdmin = lazy(
  () => import('./components/auth/RequireAdmin'),
)
const AdminLayout = lazy(() => import('./layouts/AdminLayout'))
const ProductDetailPage = lazy(
  () => import('./pages/ProductDetailPage'),
)
const CartPage = lazy(() => import('./pages/CartPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const OrdersPage = lazy(() => import('./pages/ordersPage'))
const OrderDetailPage = lazy(
  () => import('./pages/OrderDetailPage'),
)
const AdminHomePage = lazy(
  () => import('./pages/admin/AdminHomePage'),
)
const AdminOrdersPage = lazy(
  () => import('./pages/admin/AdminOrdersPage'),
)
const AdminProductsPage = lazy(
  () => import('./pages/admin/AdminProductsPage'),
)

function App() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <p role="status" className="p-6 text-center text-accent">
            Cargando página…
          </p>
        }
      >
        <Routes>
          <Route element={<CustomerLayout />}>
            <Route index element={<CatalogPage />} />

            <Route
              path="products/:id"
              element={<ProductDetailPage />}
            />

            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={<CheckoutPage />} />

            <Route path="orders" element={<OrdersPage />} />

            <Route
              path="orders/:id"
              element={<OrderDetailPage />}
            />

            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />

            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route element={<RequireAdmin />}>
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<AdminHomePage />} />

              <Route
                path="orders"
                element={<AdminOrdersPage />}
              />

              <Route
                path="products"
                element={<AdminProductsPage />}
              />

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App