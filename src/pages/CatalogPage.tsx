import { useState } from 'react'
import ProductCard from '../components/products/ProductCard'
import { products } from '../data/products'
import { useDebounce } from '../hooks/useDebounce'

const categories = [
  ...new Set(products.map((product) => product.category)),
]

function CatalogPage() {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const normalizedSearch = debouncedSearchTerm.trim().toLocaleLowerCase('es-AR')

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === '' ||
      product.category === selectedCategory

    const matchesSearch = product.name
      .toLocaleLowerCase('es-AR')
      .includes(normalizedSearch)

    return matchesCategory && matchesSearch
  })

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white px-4 py-6">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold text-blue-600">
            Tech Store
          </h1>

          <p className="mt-2 text-slate-600">
            Tu tienda de tecnología
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <section aria-labelledby="catalog-title">
          <h2
            id="catalog-title"
            className="mb-6 text-2xl font-bold"
          >
            Catálogo de productos
          </h2>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="search"
                className="mb-2 block font-medium"
              >
                Buscar producto
              </label>

              <input
                id="search"
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Por ejemplo: mouse"
                className="w-full rounded-lg border border-slate-300 bg-white p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="category"
                className="mb-2 block font-medium"
              >
                Categoría
              </label>

              <select
                id="category"
                value={selectedCategory}
                onChange={(event) =>
                  setSelectedCategory(event.target.value)
                }
                className="w-full rounded-lg border border-slate-300 bg-white p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                <option value="">Todas las categorías</option>

                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p
            role="status"
            className="mb-4 text-sm text-slate-600"
          >
            Productos encontrados: {filteredProducts.length}
          </p>

          {filteredProducts.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
              <p className="font-medium">
                No encontramos productos.
              </p>

              <p className="mt-2 text-slate-600">
                Probá otra búsqueda o cambiá la categoría.
              </p>
            </div>
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
      </main>

      <footer className="px-4 py-4 text-center text-sm text-slate-500">
        <p>Proyecto educativo · React + TypeScript</p>
      </footer>
    </div>
  )
}

export default CatalogPage