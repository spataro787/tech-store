import type {
  VercelRequest,
  VercelResponse,
} from '@vercel/node'
import { getAdminAuth } from '../server/firebaseAdmin.js'
import {
  checkout,
  CheckoutError,
} from '../server/checkout.js'
import type { CheckoutInput } from '../server/checkout.js'

function parseBody(value: unknown): CheckoutInput {
  let body: unknown = value

  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      throw new CheckoutError(
        400,
        'El cuerpo de la solicitud no es un JSON válido.',
      )
    }
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    Array.isArray(body) ||
    !('requestId' in body) ||
    !('items' in body) ||
    !('expectedTotalCents' in body) ||
    typeof body.requestId !== 'string' ||
    !Array.isArray(body.items) ||
    typeof body.expectedTotalCents !== 'number'
  ) {
    throw new CheckoutError(
      400,
      'La solicitud de compra tiene un formato inválido.',
    )
  }

  // checkout() valida cada producto, sus cantidades y los límites.
  return {
    requestId: body.requestId,
    items: body.items,
    expectedTotalCents: body.expectedTotalCents,
  }
}

function isAuthenticationError(error: unknown): boolean {
  if (
    typeof error !== 'object' ||
    error === null ||
    !('code' in error) ||
    typeof error.code !== 'string'
  ) {
    return false
  }

  return [
    'auth/argument-error',
    'auth/invalid-id-token',
    'auth/id-token-expired',
    'auth/id-token-revoked',
    'auth/user-disabled',
    'auth/user-not-found',
  ].includes(error.code)
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  response.setHeader('Cache-Control', 'no-store')

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')

    return response.status(405).json({
      error: 'Método no permitido.',
    })
  }

  const authorization = request.headers.authorization

  if (
    typeof authorization !== 'string' ||
    !authorization.startsWith('Bearer ')
  ) {
    return response.status(401).json({
      error: 'Iniciá sesión para confirmar la compra.',
    })
  }

  const token = authorization.slice('Bearer '.length).trim()

  if (!token) {
    return response.status(401).json({
      error: 'Iniciá sesión para confirmar la compra.',
    })
  }

  try {
    const input = parseBody(request.body)

    const decodedToken = await getAdminAuth().verifyIdToken(
      token,
      true,
    )

    const result = await checkout(decodedToken.uid, input)

    return response.status(200).json(result)
  } catch (error) {
    if (error instanceof CheckoutError) {
      return response.status(error.status).json({
        error: error.message,
      })
    }

    if (isAuthenticationError(error)) {
      return response.status(401).json({
        error:
          'Tu sesión venció o ya no es válida. Volvé a iniciar sesión.',
      })
    }

    // No enviamos detalles internos ni credenciales al navegador.
    return response.status(500).json({
      error:
        'No pudimos confirmar la compra. Reintentá conservando el mismo intento de compra.',
    })
  }
}