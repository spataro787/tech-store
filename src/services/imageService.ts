import { auth } from './firebase'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const IMAGE_KEY_PATTERN =
  /^products\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(jpg|png|webp)$/

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

type UploadAuthorization = {
  url: string
  fields: Record<string, string>
  key: string
}

function validateAuthorization(
  value: unknown,
): UploadAuthorization {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('url' in value) ||
    typeof value.url !== 'string' ||
    !('key' in value) ||
    typeof value.key !== 'string' ||
    !IMAGE_KEY_PATTERN.test(value.key) ||
    !('fields' in value) ||
    typeof value.fields !== 'object' ||
    value.fields === null ||
    Array.isArray(value.fields)
  ) {
    throw new Error('La autorización de subida es inválida.')
  }

  const url = new URL(value.url)

  if (
    url.protocol !== 'https:' ||
    !url.hostname.endsWith('.amazonaws.com') ||
    url.username ||
    url.password
  ) {
    throw new Error('La dirección de subida es inválida.')
  }

  const fields: Record<string, string> = {}

  for (const [name, field] of Object.entries(value.fields)) {
    if (typeof field !== 'string') {
      throw new Error('Los campos de autorización son inválidos.')
    }

    fields[name] = field
  }

  if (fields.key !== value.key) {
    throw new Error('El identificador de la imagen es inválido.')
  }

  return {
    url: value.url,
    fields,
    key: value.key,
  }
}

function getResponseError(value: unknown): string {
  if (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof value.error === 'string'
  ) {
    return value.error
  }

  return 'No pudimos autorizar la subida.'
}

export async function uploadProductImage(
  file: File,
): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Seleccioná una imagen JPG, PNG o WebP.')
  }

  if (file.size < 1 || file.size > MAX_FILE_SIZE) {
    throw new Error('La imagen debe pesar entre 1 byte y 5 MiB.')
  }

  const user = auth.currentUser

  if (!user) {
    throw new Error('Iniciá sesión para subir imágenes.')
  }

  const token = await user.getIdToken()

  const authorizationResponse = await fetch('/api/upload-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      contentType: file.type,
      size: file.size,
    }),
  })

  const body: unknown = await authorizationResponse.json()

  if (!authorizationResponse.ok) {
    throw new Error(getResponseError(body))
  }

  const authorization = validateAuthorization(body)
  const formData = new FormData()

  for (const [name, value] of Object.entries(
    authorization.fields,
  )) {
    formData.append(name, value)
  }

  // S3 requiere que el archivo sea el último campo.
  formData.append('file', file)

  const uploadResponse = await fetch(authorization.url, {
    method: 'POST',
    body: formData,
  })

  if (!uploadResponse.ok) {
    throw new Error(
      'S3 rechazó la subida. Revisá CORS, los permisos y el tamaño de la imagen.',
    )
  }

  return `/api/product-image?key=${encodeURIComponent(authorization.key)}`
}

export function getProductImageSource(imageUrl: string): string {
  if (imageUrl.startsWith('/api/product-image?key=')) {
    return imageUrl
  }

  let url: URL

  try {
    url = new URL(imageUrl)
  } catch {
    return imageUrl
  }

  const isVirtualHostedS3 =
    /^.+\.s3(?:[.-][a-z0-9-]+)?\.amazonaws\.com$/i.test(
      url.hostname,
    )
  const isPathStyleS3 =
    /^s3(?:[.-][a-z0-9-]+)?\.amazonaws\.com$/i.test(
      url.hostname,
    )

  if (!isVirtualHostedS3 && !isPathStyleS3) {
    return imageUrl
  }

  const pathSegments = url.pathname.split('/').filter(Boolean)
  const key = (
    isPathStyleS3 ? pathSegments.slice(1) : pathSegments
  ).join('/')

  if (!IMAGE_KEY_PATTERN.test(key)) {
    return imageUrl
  }

  return `/api/product-image?key=${encodeURIComponent(key)}`
}