import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { FirebaseError } from 'firebase/app'
import { Link, Navigate } from 'react-router'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Panel from '../components/ui/Panel'
import { useAuth } from '../hooks/useAuth'
import {
  completeRegistrationProfile,
  isValidBirthDate,
  registerWithEmail,
  watchRegistrationProfile,
} from '../services/authService'
import {
  getPasswordChecks,
  isValidPassword,
} from '../utils/passwordValidation'

type ProfileStatus = {
  userId: string
  status: 'missing' | 'complete' | 'error'
}

function getRegisterError(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    return 'No pudimos guardar tus datos. Intentá nuevamente.'
  }

  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'No pudimos registrar este email. Probá iniciar sesión.'

    case 'auth/invalid-email':
      return 'Ingresá un email válido.'

    case 'auth/weak-password':
    case 'auth/password-does-not-meet-requirements':
      return 'Revisá los requisitos de la contraseña. Usá un símbolo común, como !, @ o #.'

    case 'auth/network-request-failed':
    case 'unavailable':
      return 'Revisá tu conexión a internet y volvé a intentar.'

    case 'auth/too-many-requests':
      return 'Hubo demasiados intentos. Esperá un momento.'

    case 'permission-denied':
      return 'No pudimos guardar el perfil. Revisá las reglas de Firestore.'

    default:
      return 'No pudimos completar el registro. Intentá nuevamente.'
  }
}

function getToday(): string {
  const now = new Date()

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')
}

function RegisterPage() {
  const { user, loading } = useAuth()
  const userId = user?.uid

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profileStatus, setProfileStatus] =
    useState<ProfileStatus | null>(null)
  const [profileRetry, setProfileRetry] = useState(0)

  const checks = getPasswordChecks(password)

  const requirements = [
    { label: 'Mínimo 10 caracteres', met: checks.minLength },
    { label: 'Una mayúscula de A a Z', met: checks.uppercase },
    { label: 'Una minúscula de a a z', met: checks.lowercase },
    { label: 'Un número', met: checks.number },
    { label: 'Un símbolo, como !, @ o #', met: checks.symbol },
    { label: 'Sin espacios', met: checks.noSpaces },
  ]

  useEffect(() => {
    if (!userId) {
      return
    }

    return watchRegistrationProfile(
      userId,
      (exists) => {
        setProfileStatus({
          userId,
          status: exists ? 'complete' : 'missing',
        })
      },
      () => {
        setProfileStatus({
          userId,
          status: 'error',
        })
      },
    )
  }, [userId, profileRetry])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (submitting) {
      return
    }

    setError(null)

    if (
      !firstName.trim() ||
      firstName.trim().length > 80 ||
      !lastName.trim() ||
      lastName.trim().length > 80
    ) {
      setError('Ingresá nombre y apellido de hasta 80 caracteres.')
      return
    }

    if (!isValidBirthDate(birthDate)) {
      setError('Ingresá una fecha de nacimiento válida, no futura.')
      return
    }

    if (!user) {
      if (!email.trim()) {
        setError('Ingresá tu email.')
        return
      }

      if (!isValidPassword(password)) {
        setError('Completá todos los requisitos de la contraseña.')
        return
      }

      if (password !== confirmation) {
        setError('Las contraseñas no coinciden.')
        return
      }
    }

    const profile = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDate,
    }

    setSubmitting(true)

    try {
      if (user) {
        await completeRegistrationProfile(profile)
      } else {
        await registerWithEmail(email, password, profile)
      }
    } catch (registerError) {
      setError(getRegisterError(registerError))
    } finally {
      setSubmitting(false)
    }
  }

  if (
    loading ||
    (userId && profileStatus?.userId !== userId)
  ) {
    return (
      <p role="status" className="py-12 text-center text-accent">
        Comprobando tu cuenta…
      </p>
    )
  }

  if (user && profileStatus?.status === 'complete') {
    return <Navigate to="/" replace />
  }

  if (user && profileStatus?.status === 'error') {
    return (
      <section
        aria-labelledby="profile-error-title"
        className="mx-auto max-w-md"
      >
        <Panel>
          <h1
            id="profile-error-title"
            className="text-2xl font-bold text-heading"
          >
            No pudimos comprobar tus datos
          </h1>

          <p role="alert" className="store-error mt-4">
            Revisá tu conexión y las reglas de Firestore.
          </p>

          <Button
            className="mt-5"
            onClick={() => {
              setProfileStatus(null)
              setProfileRetry((previous) => previous + 1)
            }}
          >
            Volver a intentar
          </Button>
        </Panel>
      </section>
    )
  }

  return (
    <section
      aria-labelledby="register-title"
      className="mx-auto max-w-xl"
    >
      <Panel
        padding="none"
        className="relative isolate overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 -z-10 h-64 w-64 rounded-full bg-secondary/15 blur-3xl"
        />

        <div className="store-panel-header sm:px-8">
          <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-accent">
            <span
              aria-hidden="true"
              className="store-light-dot"
            />
            UNITE A TECH STORE
          </p>

          <h1
            id="register-title"
            className="mt-4 text-3xl font-extrabold text-heading"
          >
            {user ? 'Completá tu perfil' : 'Creá tu cuenta'}
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted">
            {user
              ? 'Tu cuenta ya está creada. Completá los datos que faltan para terminar el registro.'
              : 'Registrate para guardar tu carrito y consultar tus compras.'}
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {error && (
            <p role="alert" className="store-error mb-6">
              {error}
            </p>
          )}

          <form
            onSubmit={handleSubmit}
            aria-busy={submitting}
            className="space-y-7"
          >
            <fieldset
              disabled={submitting}
              className="min-w-0 space-y-4"
            >
              <legend className="mb-4 text-lg font-semibold text-secondary">
                Datos personales
              </legend>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  id="first-name"
                  label="Nombre"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  maxLength={80}
                  required
                  value={firstName}
                  onChange={(event) =>
                    setFirstName(event.target.value)
                  }
                />

                <Input
                  id="last-name"
                  label="Apellido"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  maxLength={80}
                  required
                  value={lastName}
                  onChange={(event) =>
                    setLastName(event.target.value)
                  }
                />
              </div>

              <Input
                id="birth-date"
                label="Fecha de nacimiento"
                name="birthDate"
                type="date"
                autoComplete="bday"
                min="0001-01-01"
                max={getToday()}
                required
                value={birthDate}
                onChange={(event) =>
                  setBirthDate(event.target.value)
                }
              />
            </fieldset>

            {!user && (
              <fieldset
                disabled={submitting}
                className="min-w-0 space-y-5 border-t border-secondary/20 pt-5"
              >
                <legend className="px-1 text-lg font-semibold text-secondary">
                  Datos de acceso
                </legend>

                <Input
                  id="register-email"
                  label="Email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                />

                <div>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
                    <Input
                      id="register-password"
                      label="Contraseña"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      aria-describedby="password-requirements"
                      minLength={10}
                      required
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                    />

                    <Button
                      variant="secondary"
                      aria-controls="register-password"
                      aria-pressed={showPassword}
                      aria-label={
                        showPassword
                          ? 'Ocultar contraseña'
                          : 'Mostrar contraseña'
                      }
                      onClick={() =>
                        setShowPassword((previous) => !previous)
                      }
                      className="min-h-12 px-3"
                    >
                      {showPassword ? 'Ocultar' : 'Mostrar'}
                    </Button>
                  </div>

                  <div
                    id="password-requirements"
                    className="mt-4 rounded-control border border-subtle/20 bg-surface-deep p-4"
                  >
                    <p className="text-sm font-medium text-content">
                      La contraseña debe contener:
                    </p>

                    <ul className="mt-3 space-y-2 text-sm">
                      {requirements.map((requirement) => (
                        <li
                          key={requirement.label}
                          className={
                            password && requirement.met
                              ? 'text-success'
                              : 'text-subtle'
                          }
                        >
                          <span aria-hidden="true">
                            {password && requirement.met ? '✓' : '○'}
                          </span>{' '}
                          {requirement.label}

                          <span className="sr-only">
                            {password && requirement.met
                              ? ': cumplido'
                              : ': pendiente'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
                  <Input
                    id="confirm-password"
                    label="Confirmar contraseña"
                    name="confirmation"
                    type={showConfirmation ? 'text' : 'password'}
                    autoComplete="new-password"
                    minLength={10}
                    required
                    value={confirmation}
                    onChange={(event) =>
                      setConfirmation(event.target.value)
                    }
                  />

                  <Button
                    variant="secondary"
                    aria-controls="confirm-password"
                    aria-pressed={showConfirmation}
                    aria-label={
                      showConfirmation
                        ? 'Ocultar confirmación de contraseña'
                        : 'Mostrar confirmación de contraseña'
                    }
                    onClick={() =>
                      setShowConfirmation((previous) => !previous)
                    }
                    className="min-h-12 px-3"
                  >
                    {showConfirmation ? 'Ocultar' : 'Mostrar'}
                  </Button>
                </div>
              </fieldset>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full"
            >
              {submitting
                ? 'Guardando datos…'
                : user
                  ? 'Guardar perfil'
                  : 'Crear cuenta'}
            </Button>

            {submitting && (
              <p
                role="status"
                className="text-center text-sm text-accent"
              >
                Estamos completando tu registro…
              </p>
            )}
          </form>

          {!user && (
            <p className="mt-7 text-center text-sm text-muted">
              ¿Ya tenés cuenta?{' '}
              <Link
                to="/login"
                className="font-semibold text-accent underline underline-offset-4 hover:text-accent-hover"
              >
                Iniciar sesión
              </Link>
            </p>
          )}
        </div>
      </Panel>
    </section>
  )
}

export default RegisterPage