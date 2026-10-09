import { randomUUID } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { getAdminAuth, getAdminDb } from '../server/firebaseAdmin'
import { getS3Bucket, getS3Client } from '../server/s3'

const MAX_FILE_SIZE = 5 * 1024 * 1024

function getImageExtension(contentType: string): string | null {
  switch (contentType) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    default:
      return null
  }
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

  if (!authorization?.startsWith('Bearer ')) {
    return response.status(401).json({
      error: 'Iniciá sesión para subir imágenes.',
    })
  }

  let userId: string

  try {
    const token = authorization.slice(7).trim()
    const decodedToken = await getAdminAuth().verifyIdToken(
      token,
      true,
    )

    userId = decodedToken.uid
  } catch {
    return response.status(401).json({
      error: 'No pudimos validar tu sesión. Volvé a iniciar sesión.',
    })
  }

  try {
    const userSnapshot = await getAdminDb()
      .collection('users')
      .doc(userId)
      .get()

    if (userSnapshot.data()?.role !== 'admin') {
      return response.status(403).json({
        error: 'Solo los administradores pueden subir imágenes.',
      })
    }

    let body: unknown

    try {
      body =
        typeof request.body === 'string'
          ? JSON.parse(request.body)
          : request.body
    } catch {
      return response.status(400).json({
        error: 'La solicitud tiene un formato inválido.',
      })
    }

    if (
      typeof body !== 'object' ||
      body === null ||
      !('contentType' in body) ||
      typeof body.contentType !== 'string' ||
      !('size' in body) ||
      typeof body.size !== 'number' ||
      !Number.isSafeInteger(body.size) ||
      body.size < 1 ||
      body.size > MAX_FILE_SIZE
    ) {
      return response.status(400).json({
        error: 'Seleccioná una imagen de hasta 5 MiB.',
      })
    }

    const extension = getImageExtension(body.contentType)

    if (!extension) {
      return response.status(400).json({
        error: 'Los formatos permitidos son JPG, PNG y WebP.',
      })
    }

    const key = `products/${randomUUID()}.${extension}`

    const upload = await createPresignedPost(getS3Client(), {
      Bucket: getS3Bucket(),
      Key: key,
      Expires: 60,
      Fields: {
        'Content-Type': body.contentType,
        success_action_status: '204',
      },
      Conditions: [
        ['content-length-range', 1, MAX_FILE_SIZE],
        ['eq', '$Content-Type', body.contentType],
        ['eq', '$success_action_status', '204'],
      ],
    })

    return response.status(200).json({
      url: upload.url,
      fields: upload.fields,
      key,
    })
  } catch {
    return response.status(500).json({
      error: 'No pudimos preparar la subida. Intentá nuevamente.',
    })
  }
}