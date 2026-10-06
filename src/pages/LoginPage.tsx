import { useState } from 'react'
import type { FormEvent } from 'react'
import { FirebaseError } from 'firebase/app'
import { Link, Navigate } from 'react-router'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Panel from '../components/ui/Panel'
import { useAuth } from '../hooks/useAuth'
import {
  loginWithEmail,
  loginWithGoogle,
} from '../services/authService'

function getLoginError(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    return 'No pudimos iniciar sesión. Intentá nuevamente.'
  }

  switch (error.code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-email':
      return 'Revisá tu email y contraseña.'

    case 'auth/too-many-requests':
      return 'Hubo demasiados intentos. Esperá un momento y volvé a intentar.'

    case 'auth/network-request-failed':
      return 'No pudimos conectarnos. Revisá tu conexión a internet.'

    case 'auth/popup-closed-by-user':
      return 'Se cerró la ventana de Google antes de terminar.'

    case 'auth/popup-blocked':
      return 'El navegador bloqueó la ventana. Permití ventanas emergentes para este sitio.'

    case 'auth/account-exists-with-different-credential':
      return 'Esta cuenta utiliza otro método de acceso. Intentá con el método que usaste al registrarte.'

    default:
      return 'No pudimos iniciar sesión. Intentá nuevamente.'
  }
}

function LoginPage() {
  const { user, loading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (submitting) {
      return
    }

    setError(null)

    if (!email.trim() || !password) {
      setError('Completá tu email y contraseña.')
      return
    }

    setSubmitting(true)

    try {
      await loginWithEmail(email, password)
    } catch (loginError) {
      setError(getLoginError(loginError))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogleLogin() {
    if (submitting) {
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      await loginWithGoogle()
    } catch (loginError) {
      setError(getLoginError(loginError))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <p
        role="status"
        className="py-12 text-center text-accent"
      >
        Comprobando sesión…
      </p>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <section
      aria-labelledby="login-title"
      className="mx-auto max-w-md"
    >
      <Panel
        padding="none"
        className="relative isolate overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 -z-10 h-56 w-56 rounded-full bg-secondary/15 blur-3xl"
        />

        <div className="store-panel-header sm:px-8">
          <span
            aria-hidden="true"
            className="store-brand-mark mb-5"
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect
                x="5"
                y="10"
                width="14"
                height="11"
                rx="2"
              />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              <path d="M12 14v3" />
            </svg>
          </span>

          <p className="text-xs font-semibold tracking-widest text-secondary">
            TU ESPACIO EN TECH STORE
          </p>

          <h1
            id="login-title"
            className="mt-3 text-3xl font-extrabold text-heading"
          >
            Iniciar sesión
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted">
            Volvé a tu cuenta y continuá explorando.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {error && (
            <p role="alert" className="store-error mb-5">
              {error}
            </p>
          )}

          <form
            onSubmit={handleSubmit}
            aria-busy={submitting}
            className="space-y-5"
          >
            <Input
              id="email"
              label="Email"
              name="email"
              type="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
              disabled={submitting}
              placeholder="tu@email.com"
            />

            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
              <Input
                id="password"
                label="Contraseña"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
                disabled={submitting}
              />

              <Button
                variant="secondary"
                aria-controls="password"
                aria-pressed={showPassword}
                aria-label={
                  showPassword
                    ? 'Ocultar contraseña'
                    : 'Mostrar contraseña'
                }
                disabled={submitting}
                onClick={() =>
                  setShowPassword((previous) => !previous)
                }
                className="min-h-12 px-3"
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </Button>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full"
            >
              Iniciar sesión
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <span
              aria-hidden="true"
              className="h-px flex-1 bg-subtle/20"
            />

            <span className="text-xs text-subtle">
              o continuá con
            </span>

            <span
              aria-hidden="true"
              className="h-px flex-1 bg-subtle/20"
            />
          </div>

          <Button
            variant="secondary"
            onClick={handleGoogleLogin}
            disabled={submitting}
            className="w-full"
          >
            Continuar con Google
          </Button>

          {submitting && (
            <p
              role="status"
              className="mt-4 text-center text-sm text-accent"
            >
              Iniciando sesión…
            </p>
          )}

          <p className="mt-7 text-center text-sm text-muted">
            ¿No tenés cuenta?{' '}
            <Link
              to="/register"
              className="font-semibold text-accent underline underline-offset-4 hover:text-accent-hover"
            >
              Crear cuenta
            </Link>
          </p>
        </div>
      </Panel>
    </section>
  )
}

export default LoginPage