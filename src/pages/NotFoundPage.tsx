import { Link } from 'react-router'
import Panel from '../components/ui/Panel'

function NotFoundPage() {
  return (
    <section
      aria-labelledby="not-found-title"
      className="mx-auto max-w-xl"
    >
      <Panel className="text-center">
        <p className="text-6xl font-extrabold tracking-widest text-accent">
          404
        </p>

        <h1
          id="not-found-title"
          className="mt-5 text-3xl font-bold text-heading"
        >
          Página no encontrada
        </h1>

        <p className="mt-4 leading-7 text-muted">
          La dirección que buscás no existe.
        </p>

        <Link
          to="/"
          className="store-nav-link store-cart-link mt-7"
        >
          Volver al catálogo
          <span aria-hidden="true">↗</span>
        </Link>
      </Panel>
    </section>
  )
}

export default NotFoundPage