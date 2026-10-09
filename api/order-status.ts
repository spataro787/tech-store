import type {
  VercelRequest,
  VercelResponse,
} from '@vercel/node'
import { getAdminAuth } from '../server/firebaseAdmin'
import {
  changeOrderStatus,
  OrderStatusError,
} from '../server/orderStatus'

function parseBody(value: unknown) {
  let body: unknown = value

  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      throw new OrderStatusError(
        400,
        'La solicitud no contiene un JSON válido.',
      )
    }
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    Array.isArray(body) ||
    !('orderId' in body) ||
    typeof body.orderId !== 'string' ||
    !('status' in body)
  ) {
    throw new OrderStatusError(
      400,
      'La solicitud tiene un formato inválido.',
    )
  }

  return {
    orderId: body.orderId,
    status: body.status,
  }
}

function isAuthenticationError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    [
      'auth/argument-error',
      'auth/invalid-id-token',
      'auth/id-token-expired',
      'auth/id-token-revoked',
      'auth/user-disabled',
      'auth/user-not-found',
    ].includes(error.code)
  )
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
      error: 'Iniciá sesión para gestionar órdenes.',
    })
  }

  const token = authorization.slice('Bearer '.length).trim()

  if (!token) {
    return response.status(401).json({
      error: 'Iniciá sesión para gestionar órdenes.',
    })
  }

  try {
    const input = parseBody(request.body)

    const decodedToken = await getAdminAuth().verifyIdToken(
      token,
      true,
    )

    const result = await changeOrderStatus(
      decodedToken.uid,
      input.orderId,
      input.status,
    )

    return response.status(200).json(result)
  } catch (error) {
    if (error instanceof OrderStatusError) {
      return response.status(error.status).json({
        error: error.message,
      })
    }

    if (isAuthenticationError(error)) {
      return response.status(401).json({
        error: 'Tu sesión ya no es válida. Volvé a iniciar sesión.',
      })
    }

    return response.status(500).json({
      error:
        'No pudimos confirmar el cambio. Actualizá las órdenes para comprobar su estado antes de reintentar.',
    })
  }
}