import { auth } from './firebase'
import type {
  CheckoutRequest,
  CheckoutResult,
} from '../types/checkout'

export class CheckoutServiceError extends Error {
  public readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'CheckoutServiceError'
    this.status = status
  }
}

function getErrorMessage(value: unknown): string | null {
  if (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof value.error === 'string'
  ) {
    return value.error
  }

  return null
}

function validateResult(value: unknown): CheckoutResult {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('orderId' in value) ||
    typeof value.orderId !== 'string' ||
    !value.orderId ||
    !('totalCents' in value) ||
    typeof value.totalCents !== 'number' ||
    !Number.isSafeInteger(value.totalCents) ||
    value.totalCents <= 0 ||
    !('status' in value)
  ) {
    throw new CheckoutServiceError(
      502,
      'No pudimos interpretar la confirmación. Reintentá con el mismo identificador de compra.',
    )
  }

  const status = value.status

  if (
    status !== 'pending' &&
    status !== 'processing' &&
    status !== 'completed' &&
    status !== 'cancelled'
  ) {
    throw new CheckoutServiceError(
      502,
      'La confirmación tiene un estado inválido. Conservá el mismo intento de compra.',
    )
  }

  return {
    orderId: value.orderId,
    totalCents: value.totalCents,
    status,
  }
}

export async function confirmCheckout(
  input: CheckoutRequest,
): Promise<CheckoutResult> {
  const user = auth.currentUser

  if (!user) {
    throw new CheckoutServiceError(
      401,
      'Iniciá sesión para confirmar la compra.',
    )
  }

  let token: string

  try {
    token = await user.getIdToken()
  } catch {
    throw new CheckoutServiceError(
      401,
      'No pudimos comprobar tu sesión. Volvé a iniciar sesión.',
    )
  }

  let response: Response

  try {
    response = await fetch('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
    })
  } catch {
    throw new CheckoutServiceError(
      0,
      'Se interrumpió la conexión. La compra podría haberse registrado; reintentá con el mismo identificador.',
    )
  }

  let body: unknown

  try {
    body = await response.json()
  } catch {
    throw new CheckoutServiceError(
      502,
      'No recibimos una confirmación válida. Reintentá con el mismo identificador de compra.',
    )
  }

  if (!response.ok) {
    throw new CheckoutServiceError(
      response.status,
      getErrorMessage(body) ??
        'No pudimos confirmar la compra. Conservá el mismo intento para reintentar.',
    )
  }

  return validateResult(body)
}