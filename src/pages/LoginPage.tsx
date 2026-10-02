import { useState } from 'react'
import type { FormEvent } from 'react'
import { FirebaseError } from 'firebase/app'
import { Navigate } from 'react-router'
import Button from '../components/ui/Button'
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
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
      <p role="status" className="py-12 text-center text-slate-600">
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
      className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h1 id="login-title" className="text-3xl font-bold">
        Iniciar sesión
      </h1>

      <p className="mt-2 text-slate-600">
        Accedé a tu cuenta de Tech Store.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-lg bg-red-50 p-3 text-red-700"
        >
          {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        aria-busy={submitting}
        className="mt-6 space-y-4"
      >
        <div>
          <label htmlFor="email" className="mb-2 block font-medium">
            Email
          </label>

          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={submitting}
            className="w-full rounded-lg border border-slate-300 p-3 focus-visible:outline-2 focus-visible:outline-blue-600"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block font-medium">
            Contraseña
          </label>

          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={submitting}
            className="w-full rounded-lg border border-slate-300 p-3 focus-visible:outline-2 focus-visible:outline-blue-600"
          />
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full"
        >
          Iniciar sesión
        </Button>
      </form>

      <Button
        variant="secondary"
        onClick={handleGoogleLogin}
        disabled={submitting}
        className="mt-4 w-full"
      >
        Continuar con Google
      </Button>

      {submitting && (
        <p role="status" className="mt-4 text-center text-slate-600">
          Iniciando sesión…
        </p>
      )}
    </section>
  )
}

export default LoginPage