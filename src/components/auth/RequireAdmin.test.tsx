import { cleanup, render, screen } from '@testing-library/react'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import {
  MemoryRouter,
  Route,
  Routes,
} from 'react-router'
import type { User } from 'firebase/auth'
import { AuthContext } from '../../context/AuthContext'
import type { AuthContextValue } from '../../context/AuthContext'
import RequireAdmin from './RequireAdmin'

const testUser = {
  uid: 'customer-01',
  email: 'cliente@example.com',
} as User

function renderAccess(
  overrides: Partial<AuthContextValue> = {},
) {
  const value: AuthContextValue = {
    user: null,
    loading: false,
    role: null,
    roleLoading: false,
    roleError: null,
    ...overrides,
  }

  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/login"
            element={<h1>Formulario de login</h1>}
          />

          <Route element={<RequireAdmin />}>
            <Route
              path="/admin"
              element={<h1>Contenido administrativo</h1>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

describe('RequireAdmin', () => {
  it('espera mientras se comprueba la sesión', () => {
    renderAccess({ loading: true })

    expect(screen.getByRole('status').textContent).toBe(
      'Comprobando acceso…',
    )

    expect(
      screen.queryByRole('heading', {
        name: 'Contenido administrativo',
      }),
    ).toBeNull()

    expect(
      screen.queryByRole('heading', {
        name: 'Formulario de login',
      }),
    ).toBeNull()
  })

  it('envía al login cuando no hay sesión', () => {
    renderAccess()

    expect(
      screen.getByRole('heading', {
        name: 'Formulario de login',
      }),
    ).toBeTruthy()

    expect(
      screen.queryByRole('heading', {
        name: 'Contenido administrativo',
      }),
    ).toBeNull()
  })

  it('espera mientras se comprueba el rol', () => {
    renderAccess({
      user: testUser,
      roleLoading: true,
    })

    expect(screen.getByRole('status').textContent).toBe(
      'Comprobando acceso…',
    )

    expect(
      screen.queryByRole('heading', {
        name: 'Contenido administrativo',
      }),
    ).toBeNull()
  })

  it('bloquea a un cliente', () => {
    renderAccess({
      user: testUser,
      role: 'customer',
    })

    expect(
      screen.getByRole('heading', {
        name: 'Acceso restringido',
      }),
    ).toBeTruthy()

    expect(
      screen.queryByRole('heading', {
        name: 'Contenido administrativo',
      }),
    ).toBeNull()
  })

  it('bloquea a un usuario sin rol confirmado', () => {
    renderAccess({
      user: testUser,
      role: null,
    })

    expect(
      screen.getByRole('heading', {
        name: 'Acceso restringido',
      }),
    ).toBeTruthy()

    expect(
      screen.queryByRole('heading', {
        name: 'Contenido administrativo',
      }),
    ).toBeNull()
  })

  it('bloquea el acceso si falla la lectura de permisos', () => {
    renderAccess({
      user: testUser,
      role: 'admin',
      roleError: 'No pudimos comprobar tus permisos.',
    })

    expect(screen.getByRole('alert').textContent).toBe(
      'No pudimos comprobar tus permisos.',
    )

    expect(
      screen.queryByRole('heading', {
        name: 'Contenido administrativo',
      }),
    ).toBeNull()
  })

  it('permite entrar a un administrador confirmado', () => {
    renderAccess({
      user: testUser,
      role: 'admin',
    })

    expect(
      screen.getByRole('heading', {
        name: 'Contenido administrativo',
      }),
    ).toBeTruthy()

    expect(
      screen.queryByRole('heading', {
        name: 'Acceso restringido',
      }),
    ).toBeNull()
  })
})