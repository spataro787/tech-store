import type { VercelRequest, VercelResponse } from '@vercel/node'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getS3Bucket, getS3Client } from '../server/s3'

const MAX_FILE_SIZE = 5 * 1024 * 1024

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  response.setHeader('X-Content-Type-Options', 'nosniff')

  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')

    return response.status(405).json({
      error: 'Método no permitido.',
    })
  }

  const key = request.query.key

  if (
    typeof key !== 'string' ||
    !/^products\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(jpg|png|webp)$/.test(
      key,
    )
  ) {
    return response.status(400).json({
      error: 'El identificador de la imagen es inválido.',
    })
  }

  try {
    const image = await getS3Client().send(
      new GetObjectCommand({
        Bucket: getS3Bucket(),
        Key: key,
      }),
    )

    if (
      !image.Body ||
      !image.ContentType ||
      !ALLOWED_TYPES.has(image.ContentType) ||
      image.ContentLength === undefined ||
      image.ContentLength < 1 ||
      image.ContentLength > MAX_FILE_SIZE
    ) {
      return response.status(502).json({
        error: 'La imagen almacenada tiene un formato inválido.',
      })
    }

    const bytes = await image.Body.transformToByteArray()

    if (bytes.length < 1 || bytes.length > MAX_FILE_SIZE) {
      return response.status(502).json({
        error: 'El tamaño de la imagen es inválido.',
      })
    }

    response.setHeader('Content-Type', image.ContentType)
    response.setHeader('Content-Length', bytes.length)
    response.setHeader('Cache-Control', 'public, max-age=3600')
    response.setHeader('Content-Security-Policy', "default-src 'none'")

    return response.status(200).send(Buffer.from(bytes))
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === 'NoSuchKey'
    ) {
      return response.status(404).json({
        error: 'La imagen no existe.',
      })
    }

    return response.status(500).json({
      error: 'No pudimos recuperar la imagen.',
    })
  }
}