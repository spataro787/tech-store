import { useEffect, useRef, useState } from 'react'
import Button from '../../components/ui/Button'
import Panel from '../../components/ui/Panel'
import ProductForm from '../../components/products/ProductForm'
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from '../../services/productService'
import type {
  Product,
  ProductInput,
} from '../../types/product'

const priceFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
})

type Editor =
  | { mode: 'create' }
  | { mode: 'edit'; product: Product }
  | null

function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [editor, setEditor] = useState<Editor>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [attempt, setAttempt] = useState(0)

  const busyRef = useRef(false)

  useEffect(() => {
    let active = true

    async function loadProducts() {
      setLoading(true)
      setLoadError(null)

      try {
        const result = await getProducts()

        if (active) {
          setProducts(result)
        }
      } catch {
        if (active) {
          setLoadError(
            'No pudimos cargar los productos. Revisá tu conexión e intentá nuevamente.',
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadProducts()

    return () => {
      active = false
    }
  }, [attempt])

  function handleRefresh() {
    setActionError(null)
    setMessage(null)
    setAttempt((previous) => previous + 1)
  }

  function handleCreate() {
    setActionError(null)
    setMessage(null)
    setEditor({ mode: 'create' })
  }

  function handleEdit(product: Product) {
    setActionError(null)
    setMessage(null)
    setEditor({ mode: 'edit', product })
  }

  async function handleSave(input: ProductInput) {
    if (!editor || busyRef.current) {
      return
    }

    const currentEditor = editor

    busyRef.current = true
    setSaving(true)
    setActionError(null)
    setMessage(null)

    try {
      if (currentEditor.mode === 'create') {
        await createProduct(input)
        setMessage('Producto creado correctamente.')
      } else {
        await updateProduct(
          currentEditor.product.id,
          input,
          currentEditor.product.stock,
        )

        setMessage('Producto actualizado correctamente.')
      }

      setEditor(null)
      setAttempt((previous) => previous + 1)
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }

      throw new Error(
        'No pudimos guardar el producto.',
        { cause: error },
      )
    } finally {
      busyRef.current = false
      setSaving(false)
    }
  }

  async function handleDelete(product: Product) {
    if (busyRef.current) {
      return
    }

    const confirmed = window.confirm(
      `¿Eliminar "${product.name}"? Dejará de estar disponible en el catálogo y los carritos. Las compras anteriores conservarán sus datos.`,
    )

    if (!confirmed) {
      return
    }

    busyRef.current = true
    setDeleting(true)
    setActionError(null)
    setMessage(null)

    try {
      await deleteProduct(product.id)

      setMessage('Producto eliminado correctamente.')
      setAttempt((previous) => previous + 1)
    } catch {
      setActionError(
        'No pudimos confirmar la eliminación. Actualizá la lista para comprobar si el producto todavía existe.',
      )
    } finally {
      busyRef.current = false
      setDeleting(false)
    }
  }

  const controlsDisabled = loading || saving || deleting

  return (
    <section
      aria-labelledby="admin-products-title"
      className="space-y-6"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest text-secondary">
            ADMINISTRACIÓN
          </p>

          <h1
            id="admin-products-title"
            className="mt-3 text-3xl font-extrabold text-heading"
          >
            Gestión de productos
          </h1>

          <p className="mt-3 text-muted">
            Administrá el catálogo, los precios y el stock.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleCreate}
            disabled={controlsDisabled || editor !== null}
          >
            Nuevo producto
          </Button>

          <Button
            variant="secondary"
            onClick={handleRefresh}
            disabled={controlsDisabled || editor !== null}
          >
            Actualizar lista
          </Button>
        </div>
      </div>

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

      {deleting && (
        <p role="status" className="store-status">
          Eliminando producto…
        </p>
      )}

      {editor && (
        <Panel>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-heading">
              {editor.mode === 'create'
                ? 'Crear producto'
                : 'Editar producto'}
            </h2>

            <Button
              variant="secondary"
              onClick={() => setEditor(null)}
              disabled={saving}
            >
              Cerrar formulario
            </Button>
          </div>

          <ProductForm
            key={
              editor.mode === 'create'
                ? 'create'
                : editor.product.id
            }
            initialValues={
              editor.mode === 'edit'
                ? editor.product
                : undefined
            }
            submitLabel={
              editor.mode === 'create'
                ? 'Crear producto'
                : 'Guardar cambios'
            }
            onSubmit={handleSave}
          />
        </Panel>
      )}

      {loading ? (
        <Panel className="text-center" aria-busy="true">
          <p role="status" className="text-accent">
            Cargando productos…
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
      ) : products.length === 0 ? (
        <Panel className="py-10 text-center">
          <h2 className="text-xl font-bold text-heading">
            Todavía no hay productos
          </h2>

          <p className="mt-3 text-muted">
            Usá “Nuevo producto” para comenzar.
          </p>
        </Panel>
      ) : (
        <ul className="space-y-4">
          {products.map((product) => (
            <li key={product.id}>
              <Panel>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-secondary">
                      {product.category}
                    </p>

                    <h2 className="mt-2 text-xl font-bold text-heading">
                      {product.name}
                    </h2>

                    <p className="mt-2 text-lg font-bold text-price">
                      {priceFormatter.format(product.price)}
                    </p>

                    <p className="mt-2 text-sm text-muted">
                      Stock: {product.stock}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => handleEdit(product)}
                      disabled={controlsDisabled || editor !== null}
                    >
                      Editar
                    </Button>

                    <Button
                      variant="secondary"
                      onClick={() => handleDelete(product)}
                      disabled={controlsDisabled || editor !== null}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default AdminProductsPage