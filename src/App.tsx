import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  function handleAddProduct() {
    setCount((previousCount) => previousCount + 1)
  }

  function handleReset() {
    setCount(0)
  }

  return (
    <div>
      <header>
        <h1>Tech Store</h1>
        <p>Tu tienda de tecnología</p>
      </header>

      <main>
        <section aria-labelledby="practice-title">
          <h2 id="practice-title">Práctica de estado</h2>

          <p>Productos agregados: {count}</p>

          <button type="button" onClick={handleAddProduct}>
            Agregar producto
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={count === 0}
          >
            Reiniciar
          </button>
        </section>
      </main>

      <footer>
        <p>Proyecto educativo · React + TypeScript</p>
      </footer>
    </div>
  )
}

export default App