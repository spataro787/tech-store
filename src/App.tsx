import { useState } from 'react'
import Button from './components/ui/Button'

function App() {
  const [count, setCount] = useState(0)

  function handleAddProduct() {
    setCount((previousCount) => previousCount + 1)
  }

  function handleReset() {
    setCount(0)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white px-4 py-6">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-3xl font-bold text-blue-600">
            Tech Store
          </h1>

          <p className="mt-2 text-slate-600">
            Tu tienda de tecnología
          </p>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <section
          aria-labelledby="practice-title"
          className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm"
        >
          <h2
            id="practice-title"
            className="text-xl font-semibold"
          >
            Práctica de estado
          </h2>

          <p className="mt-4 text-slate-600">
            Productos agregados: {count}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={handleAddProduct}>
              Agregar producto
            </Button>

            <Button
              variant="secondary"
              onClick={handleReset}
              disabled={count === 0}
            >
              Reiniciar
            </Button>
          </div>
        </section>
      </main>

      <footer className="px-4 py-4 text-center text-sm text-slate-500">
        <p>Proyecto educativo · React + TypeScript</p>
      </footer>
    </div>
  )
}

export default App