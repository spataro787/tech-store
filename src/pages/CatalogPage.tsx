import { useState } from 'react'
import ProductCard from '../components/products/ProductCard'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Panel from '../components/ui/Panel'
import Select from '../components/ui/select'
import { products } from '../data/products'
import { useDebounce } from '../hooks/useDebounce'

const categories = [
  ...new Set(products.map((product) => product.category)),
]

function CatalogPage() {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const normalizedSearch = debouncedSearchTerm
    .trim()
    .toLocaleLowerCase('es-AR')

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

          <div className="grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
            <div>
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
            </div>

            <div
              aria-hidden="true"
              className="relative mx-auto flex h-52 w-52 items-center justify-center sm:h-64 sm:w-64"
            >
              <div className="absolute inset-0 rounded-full border border-accent/20" />

              <div className="absolute inset-4 rounded-full border border-dashed border-secondary/30" />

              <div className="absolute inset-9 rounded-full border border-accent/40 shadow-panel" />

              <div className="absolute inset-14 rounded-full bg-accent/10 blur-xl" />

              <div className="relative flex h-24 w-24 items-center justify-center rounded-control border border-accent/60 bg-surface-deep text-accent shadow-neon">
                <svg
                  width="58"
                  height="58"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect
                    x="6"
                    y="6"
                    width="12"
                    height="12"
                    rx="2"
                  />
                  <path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4" />
                  <path d="m13 9-3 4h3l-2 3" />
                </svg>
              </div>

              <span className="absolute right-5 top-8 h-3 w-3 rounded-full bg-secondary shadow-neon" />

              <span className="absolute bottom-10 left-4 h-2 w-2 rounded-full bg-accent shadow-neon" />
            </div>
          </div>
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
            />

            <Select
              id="category"
              label="Categoría"
              value={selectedCategory}
              onChange={(event) =>
                setSelectedCategory(event.target.value)
              }
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
          <Panel className="text-center">
            <p className="text-lg font-semibold text-heading">
              No encontramos productos.
            </p>

            <p className="mt-3 text-sm text-muted">
              Probá otra búsqueda o cambiá la categoría.
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
      </section>
    </div>
  )
}

export default CatalogPage