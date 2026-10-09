import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router'
import RegisterPage from './RegisterPage'

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  registerWithEmail: vi.fn(),
  completeRegistrationProfile: vi.fn(),
  watchRegistrationProfile: vi.fn(),
  isValidBirthDate: vi.fn(),
  unsubscribe: vi.fn(),
}))

vi.mock('../hooks/useAuth', () => ({
  useAuth: mocks.useAuth,
}))

vi.mock('../services/authService', () => ({
  registerWithEmail: mocks.registerWithEmail,
  completeRegistrationProfile: mocks.completeRegistrationProfile,
  watchRegistrationProfile: mocks.watchRegistrationProfile,
  isValidBirthDate: mocks.isValidBirthDate,
}))

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/"
          element={<h1>Catálogo de productos</h1>}
        />
      </Routes>
    </MemoryRouter>,
  )
}

async function fillPersonalData(
  user: ReturnType<typeof userEvent.setup>,
) {
  await user.type(screen.getByLabelText('Nombre'), 'Agustín')
  await user.type(screen.getByLabelText('Apellido'), 'Spataro')
  await user.type(
    screen.getByLabelText('Fecha de nacimiento'),
    '1990-11-02',
  )
}

beforeEach(() => {
  vi.resetAllMocks()

  mocks.useAuth.mockReturnValue({
    user: null,
    loading: false,
  })

  mocks.isValidBirthDate.mockReturnValue(true)
  mocks.registerWithEmail.mockResolvedValue(undefined)
  mocks.completeRegistrationProfile.mockResolvedValue(undefined)

  mocks.watchRegistrationProfile.mockImplementation(
    (_userId, onChange) => {
      onChange(false)
      return mocks.unsubscribe
    },
  )
})

afterEach(() => {
  cleanup()
})

describe('RegisterPage', () => {
  it('mantiene las contraseñas ocultas y permite mostrarlas', async () => {
    const user = userEvent.setup()

    renderPage()

    const password = screen.getByLabelText('Contraseña')
    const confirmation = screen.getByLabelText('Confirmar contraseña')

    expect(password.getAttribute('type')).toBe('password')
    expect(confirmation.getAttribute('type')).toBe('password')

    await user.click(
      screen.getByRole('button', {
        name: 'Mostrar contraseña',
      }),
    )

    expect(password.getAttribute('type')).toBe('text')
    expect(confirmation.getAttribute('type')).toBe('password')

    await user.click(
      screen.getByRole('button', {
        name: 'Ocultar contraseña',
      }),
    )

    expect(password.getAttribute('type')).toBe('password')
  })

  it('envía los datos personales junto con el email y contraseña', async () => {
    const user = userEvent.setup()

    renderPage()

    await fillPersonalData(user)

    await user.type(
      screen.getByLabelText('Email'),
      'agustin@example.com',
    )

    await user.type(
      screen.getByLabelText('Contraseña'),
      'TechStore123!',
    )

    await user.type(
      screen.getByLabelText('Confirmar contraseña'),
      'TechStore123!',
    )

    await user.click(
      screen.getByRole('button', { name: 'Crear cuenta' }),
    )

    expect(mocks.registerWithEmail).toHaveBeenCalledExactlyOnceWith(
      'agustin@example.com',
      'TechStore123!',
      {
        firstName: 'Agustín',
        lastName: 'Spataro',
        birthDate: '1990-11-02',
      },
    )
  })

  it('rechaza contraseñas que no coinciden sin crear una cuenta', async () => {
    const user = userEvent.setup()

    renderPage()

    await fillPersonalData(user)

    await user.type(
      screen.getByLabelText('Email'),
      'agustin@example.com',
    )

    await user.type(
      screen.getByLabelText('Contraseña'),
      'TechStore123!',
    )

    await user.type(
      screen.getByLabelText('Confirmar contraseña'),
      'OtraClave123!',
    )

    await user.click(
      screen.getByRole('button', { name: 'Crear cuenta' }),
    )

    expect(screen.getByRole('alert').textContent).toBe(
      'Las contraseñas no coinciden.',
    )

    expect(mocks.registerWithEmail).not.toHaveBeenCalled()
  })

  it('permite completar el perfil de una cuenta ya creada', async () => {
    const user = userEvent.setup()

    mocks.useAuth.mockReturnValue({
      user: { uid: 'customer-01' },
      loading: false,
    })

    renderPage()

    expect(
      screen.getByRole('heading', { name: 'Completá tu perfil' }),
    ).toBeTruthy()

    expect(screen.queryByLabelText('Contraseña')).toBeNull()

    await fillPersonalData(user)

    await user.click(
      screen.getByRole('button', { name: 'Guardar perfil' }),
    )

    expect(
      mocks.completeRegistrationProfile,
    ).toHaveBeenCalledExactlyOnceWith({
      firstName: 'Agustín',
      lastName: 'Spataro',
      birthDate: '1990-11-02',
    })

    expect(mocks.registerWithEmail).not.toHaveBeenCalled()
  })

  it('espera la confirmación del perfil antes de mostrar el catálogo', () => {
    let confirmProfile: (exists: boolean) => void = () => {
      throw new Error('No se inició la escucha del perfil.')
    }

    mocks.useAuth.mockReturnValue({
      user: { uid: 'customer-01' },
      loading: false,
    })

    mocks.watchRegistrationProfile.mockImplementation(
      (_userId, onChange) => {
        confirmProfile = onChange
        onChange(false)
        return mocks.unsubscribe
      },
    )

    renderPage()

    expect(
      screen.queryByRole('heading', {
        name: 'Catálogo de productos',
      }),
    ).toBeNull()

    act(() => {
      confirmProfile(true)
    })

    expect(
      screen.getByRole('heading', {
        name: 'Catálogo de productos',
      }),
    ).toBeTruthy()

    expect(mocks.unsubscribe).toHaveBeenCalled()
  })
})