import { useState } from 'react'
import { FirebaseError } from 'firebase/app'
import Button from '../../components/ui/Button'
import Panel from '../../components/ui/Panel'
import { seedProducts } from '../../services/seedProducts'

function getSeedError(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'permission-denied':
        return 'No tenés permiso para cargar productos. Verificá que tu cuenta tenga el rol admin y que las reglas estén publicadas.'

      case 'unavailable':
      case 'deadline-exceeded':
        return 'No pudimos conectarnos con Firestore. Revisá tu conexión y volvé a intentar.'

      default:
        return 'No pudimos cargar los productos. Intentá nuevamente.'
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'No pudimos cargar los productos. Intentá nuevamente.'
}

function AdminHomePage() {
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSeedProducts() {
    if (submitting) {
      return
    }

    setSubmitting(true)
    setMessage(null)
    setError(null)

    try {
      const createdCount = await seedProducts()

      setMessage(
        createdCount === 0
          ? 'Los productos iniciales ya estaban cargados. No se modificó ninguno.'
          : `Carga completada: ${createdCount} ${
              createdCount === 1
                ? 'producto creado'
                : 'productos creados'
            }.`,
      )
    } catch (seedError) {
      setError(getSeedError(seedError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section aria-labelledby="admin-title" className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-widest text-secondary">
          ADMINISTRACIÓN
        </p>

        <h1
          id="admin-title"
          className="mt-3 text-3xl font-extrabold text-heading"
        >
          Panel de administración
        </h1>

        <p className="mt-3 text-muted">
          Accediste con una cuenta administradora.
        </p>
      </div>

      <Panel>
        <h2 className="text-xl font-bold text-heading">
          Cargar productos iniciales
        </h2>

        <p className="mt-3 max-w-xl text-sm leading-7 text-muted">
          Copiá el teclado, el mouse y el monitor a Firestore.
          Conservaremos sus IDs para mantener la relación
          con los carritos guardados.
        </p>

        <p className="mt-3 text-sm text-subtle">
          Si un producto ya existe, se conserva sin cambios.
        </p>

        <Button
          onClick={handleSeedProducts}
          disabled={submitting}
          className="mt-5"
        >
          {submitting
            ? 'Cargando productos…'
            : 'Cargar productos iniciales'}
        </Button>

        {submitting && (
          <p role="status" className="store-status mt-5">
            Guardando los productos en Firestore…
          </p>
        )}

        {message && (
          <p role="status" className="store-status mt-5">
            {message}
          </p>
        )}

        {error && (
          <p role="alert" className="store-error mt-5">
            {error}
          </p>
        )}
      </Panel>
    </section>
  )
}

export default AdminHomePage