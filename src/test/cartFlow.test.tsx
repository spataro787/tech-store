import {
  cleanup,
  render,
  screen,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import App from '../App'
import { TestProviders } from './TestProviders'

vi.mock('../services/authService', () => ({
  loginWithEmail: vi.fn(),
  loginWithGoogle: vi.fn(),
  logout: vi.fn(),
}))

beforeEach(() => {
  window.history.replaceState({}, '', '/')
})

afterEach(() => {
  cleanup()
  window.history.replaceState({}, '', '/')
})

describe('Flujo de compra: catálogo y carrito', () => {
  it('permite agregar, cambiar cantidades y eliminar el producto', async () => {
    const user = userEvent.setup()

    render(<App />, {
      wrapper: TestProviders,
    })

    const productTitle = screen.getByRole('heading', {
      name: 'Mouse inalámbrico',
    })

    const productCard = productTitle.closest('article')

    if (!productCard) {
      throw new Error('No se encontró la tarjeta del mouse')
    }

    const addButton = within(productCard).getByRole('button', {
      name: 'Agregar al carrito',
    })

    await user.click(addButton)
    await user.click(addButton)

    await user.click(
      screen.getByRole('link', {
        name: 'Carrito: 2 unidades',
      }),
    )

    expect(window.location.pathname).toBe('/cart')

    expect(
      screen.getByRole('heading', {
        name: 'Tu carrito',
      }),
    ).toBeTruthy()

    expect(
      screen.getByText(/^Subtotal:.*50[.]000/),
    ).toBeTruthy()

    await user.click(
      screen.getByRole('button', {
        name: 'Agregar una unidad de Mouse inalámbrico',
      }),
    )

    expect(
      screen.getByRole('link', {
        name: 'Carrito: 3 unidades',
      }),
    ).toBeTruthy()

    expect(
      screen.getByText(/^Total:.*75[.]000/),
    ).toBeTruthy()

    await user.click(
      screen.getByRole('button', {
        name: 'Quitar una unidad de Mouse inalámbrico',
      }),
    )

    expect(
      screen.getByRole('link', {
        name: 'Carrito: 2 unidades',
      }),
    ).toBeTruthy()

    expect(
      screen.getByText(/^Total:.*50[.]000/),
    ).toBeTruthy()

    await user.click(
      screen.getByRole('button', {
        name: 'Eliminar Mouse inalámbrico del carrito',
      }),
    )

    expect(
      screen.getByRole('heading', {
        name: 'Tu carrito está vacío',
      }),
    ).toBeTruthy()

    expect(
      screen.getByRole('link', {
        name: 'Carrito: 0 unidades',
      }),
    ).toBeTruthy()
  })
})