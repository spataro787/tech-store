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
import { useAuth } from './useAuth'

const mocks = vi.hoisted(() => ({
  unsubscribe: vi.fn(),
  observe: vi.fn<
    (
      auth: unknown,
      callback: (user: User | null) => void,
    ) => () => void
  >(),
}))

vi.mock('../services/firebase', () => ({
  auth: {},
}))

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: mocks.observe,
}))

// Solo necesitamos estos campos para las comprobaciones del test.
const testUser = {
  uid: 'customer-01',
  email: 'cliente@example.com',
} as User

function notifySession(user: User | null) {
  const callback = mocks.observe.mock.calls[0][1]

  act(() => {
    callback(user)
  })
}

beforeEach(() => {
  mocks.observe.mockReset()
  mocks.unsubscribe.mockReset()

  mocks.observe.mockReturnValue(mocks.unsubscribe)
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
  })

  it('termina la carga cuando Firebase informa que no hay sesión', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    notifySession(null)

    expect(result.current.user).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('comparte al usuario cuando Firebase informa una sesión', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    notifySession(testUser)

    expect(result.current.user).toBe(testUser)
    expect(result.current.loading).toBe(false)
  })

  it('actualiza el contexto cuando se cierra la sesión', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    notifySession(testUser)
    notifySession(null)

    expect(result.current.user).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('cancela la suscripción al desmontar el provider', () => {
    const { unmount } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    unmount()

    expect(mocks.unsubscribe).toHaveBeenCalledTimes(1)
  })
})