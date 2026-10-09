import { act, cleanup, renderHook } from '@testing-library/react'
import type { User } from 'firebase/auth'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import AuthProvider from '../context/AuthProvider'
import type { UserRole } from '../types/userProfile'
import { useAuth } from './useAuth'

const mocks = vi.hoisted(() => ({
  unsubscribeSession: vi.fn(),

  observeSession: vi.fn<
    (
      auth: unknown,
      callback: (user: User | null) => void,
    ) => () => void
  >(),

  observeRole: vi.fn<
    (
      userId: string,
      onChange: (role: UserRole | null) => void,
      onError: (error: Error) => void,
    ) => () => void
  >(),
}))

vi.mock('../services/firebase', () => ({
  auth: {},
}))

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: mocks.observeSession,
}))

vi.mock('../services/roleService', () => ({
  watchUserRole: mocks.observeRole,
}))

const testUser = {
  uid: 'customer-01',
  email: 'cliente@example.com',
} as User

const secondUser = {
  uid: 'customer-02',
  email: 'otro@example.com',
} as User

function notifySession(user: User | null) {
  const callback = mocks.observeSession.mock.calls[0][1]

  act(() => {
    callback(user)
  })
}

function notifyRole(
  role: UserRole | null,
  subscriptionIndex = 0,
) {
  const callback =
    mocks.observeRole.mock.calls[subscriptionIndex][1]

  act(() => {
    callback(role)
  })
}

function notifyRoleError() {
  const callback = mocks.observeRole.mock.calls[0][2]

  act(() => {
    callback(new Error('No se pudo leer el rol'))
  })
}

beforeEach(() => {
  vi.resetAllMocks()

  mocks.observeSession.mockReturnValue(
    mocks.unsubscribeSession,
  )

  // Cada escucha recibe su propia función de cancelación.
  mocks.observeRole.mockImplementation(() => vi.fn())
})

afterEach(() => {
  cleanup()
})

describe('useAuth', () => {
  it('comienza esperando la comprobación de sesión', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    expect(result.current.user).toBeNull()
    expect(result.current.loading).toBe(true)
    expect(result.current.role).toBeNull()
    expect(result.current.roleError).toBeNull()
  })

  it('termina la carga cuando no hay sesión', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    notifySession(null)

    expect(result.current.user).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.roleLoading).toBe(false)
    expect(mocks.observeRole).not.toHaveBeenCalled()
  })

  it('comparte al usuario y espera la comprobación del rol', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    notifySession(testUser)

    expect(result.current.user).toBe(testUser)
    expect(result.current.loading).toBe(false)
    expect(result.current.role).toBeNull()
    expect(result.current.roleLoading).toBe(true)

    expect(mocks.observeRole).toHaveBeenCalledWith(
      'customer-01',
      expect.any(Function),
      expect.any(Function),
    )
  })

  it.each(['customer', 'admin'] as const)(
    'comparte el rol confirmado %s',
    (role) => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      notifySession(testUser)
      notifyRole(role)

      expect(result.current.role).toBe(role)
      expect(result.current.roleLoading).toBe(false)
      expect(result.current.roleError).toBeNull()
    },
  )

  it('conserva el rol vacío cuando el perfil no existe', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    notifySession(testUser)
    notifyRole(null)

    expect(result.current.role).toBeNull()
    expect(result.current.roleLoading).toBe(false)
    expect(result.current.roleError).toBeNull()
  })

  it('informa un error sin otorgar permisos', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    notifySession(testUser)
    notifyRoleError()

    expect(result.current.role).toBeNull()
    expect(result.current.roleLoading).toBe(false)
    expect(result.current.roleError).toBe(
      'No pudimos comprobar tus permisos. Revisá tu conexión y recargá la página.',
    )
  })

  it('elimina el usuario y el rol al cerrar sesión', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    notifySession(testUser)
    notifyRole('admin')

    const unsubscribeRole =
      mocks.observeRole.mock.results[0].value

    notifySession(null)

    expect(result.current.user).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.role).toBeNull()
    expect(result.current.roleLoading).toBe(false)
    expect(result.current.roleError).toBeNull()

    expect(unsubscribeRole).toHaveBeenCalledTimes(1)
  })

  it('descarta el rol anterior cuando cambia la cuenta', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    notifySession(testUser)
    notifyRole('admin')

    notifySession(secondUser)

    expect(result.current.user).toBe(secondUser)
    expect(result.current.role).toBeNull()
    expect(result.current.roleLoading).toBe(true)

    // Simulamos una respuesta tardía de la cuenta anterior.
    notifyRole('admin', 0)

    expect(result.current.role).toBeNull()
    expect(result.current.roleLoading).toBe(true)

    // Ahora responde la escucha de la cuenta actual.
    notifyRole('customer', 1)

    expect(result.current.role).toBe('customer')
    expect(result.current.roleLoading).toBe(false)
  })

  it('cancela ambas suscripciones al desmontar el provider', () => {
    const { unmount } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    notifySession(testUser)

    const unsubscribeRole =
      mocks.observeRole.mock.results[0].value

    unmount()

    expect(
      mocks.unsubscribeSession,
    ).toHaveBeenCalledTimes(1)

    expect(unsubscribeRole).toHaveBeenCalledTimes(1)
  })
})