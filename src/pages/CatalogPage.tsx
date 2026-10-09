import { useState } from 'react'
import ProductCard from '../components/products/ProductCard'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Panel from '../components/ui/Panel'
import { useDebounce } from '../hooks/useDebounce'
import { useProducts } from '../hooks/useProducts'

function CatalogPage() {
  const { products, loading, error, retry } = useProducts()

  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const normalizedSearch = debouncedSearchTerm
    .trim()
    .toLocaleLowerCase('es-AR')

  const categories = [
    ...new Set(products.map((product) => product.category)),
  ].sort((first, second) => first.localeCompare(second, 'es-AR'))

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === '' ||
      product.category === selectedCategory

    const matchesSearch = product.name
      .toLocaleLowerCase('es-AR')
      .includes(normalizedSearch)

    return matchesCategory && matchesSearch
  })

  function handleClearFilters() {
    setSearchTerm('')
    setSelectedCategory('')
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      <section aria-labelledby="catalog-title">
        <Panel className="relative isolate overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-24 -z-10 h-80 w-80 rounded-full bg-secondary/15 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 -left-24 -z-10 h-80 w-80 rounded-full bg-accent/10 blur-3xl"
          />

          <p className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/5 px-3 py-2 text-xs font-semibold tracking-widest text-accent">
            <span
              aria-hidden="true"
              className="store-light-dot"
            />
            EXPLORÁ TECH STORE
          </p>

          <h1
            id="catalog-title"
            className="mt-6 text-3xl font-extrabold leading-tight tracking-tight text-heading sm:text-5xl"
          >
            Catálogo de productos
          </h1>

          <p className="mt-3 text-xl font-semibold text-accent sm:text-2xl">
            Tu próxima actualización empieza acá.
          </p>

          <p className="mt-5 max-w-lg text-sm leading-7 text-muted sm:text-base">
            Equipá tu espacio para trabajar, estudiar y jugar.
            Encontrá la tecnología que acompaña tus ideas.
          </p>

          <a
            href="#catalog-filters"
            className="store-nav-link store-cart-link mt-6"
          >
            Explorar productos
            <span aria-hidden="true">↓</span>
          </a>
        </Panel>
      </section>

      <section aria-labelledby="explore-title">
        <div className="mb-5">
          <p className="text-xs font-semibold tracking-widest text-secondary">
            ENCONTRÁ TU EQUIPO
          </p>

          <h2
            id="explore-title"
            className="mt-2 text-2xl font-bold text-heading"
          >
            Explorá el catálogo
          </h2>
        </div>

        <Panel
          id="catalog-filters"
          className="scroll-mt-6"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              id="search"
              label="Buscar producto"
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Por ejemplo: mouse"
              disabled={loading || Boolean(error)}
            />

            <Select
              id="category"
              label="Categoría"
              value={selectedCategory}
              onChange={(event) =>
                setSelectedCategory(event.target.value)
              }
              disabled={loading || Boolean(error)}
            >
              <option value="">
                Todas las categorías
              </option>

              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </div>
        </Panel>

        {loading ? (
          <Panel className="mt-6 text-center" aria-busy="true">
            <p role="status" className="text-accent">
              Cargando productos…
            </p>
          </Panel>
        ) : error ? (
          <Panel className="mt-6 text-center">
            <p role="alert" className="store-error">
              {error}
            </p>

            <Button
              onClick={retry}
              className="mt-5"
            >
              Reintentar
            </Button>
          </Panel>
        ) : (
          <>
            <div className="my-5 flex flex-wrap items-center justify-between gap-3">
              <p role="status" className="text-sm text-muted">
                Productos encontrados:{' '}
                <span className="font-bold text-accent">
                  {filteredProducts.length}
                </span>
              </p>

              {(searchTerm || selectedCategory) && (
                <Button
                  variant="secondary"
                  onClick={handleClearFilters}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>

            {filteredProducts.length === 0 ? (
              <Panel className="py-12 text-center">
                <p className="text-lg font-semibold text-heading">
                  {products.length === 0
                    ? 'Todavía no hay productos disponibles.'
                    : 'No encontramos productos.'}
                </p>

                <p className="mt-3 text-sm text-muted">
                  {products.length === 0
                    ? 'Volvé a visitarnos pronto.'
                    : 'Probá otra búsqueda o cambiá la categoría.'}
                </p>
              </Panel>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}

export default CatalogPage