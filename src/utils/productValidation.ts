import type { ProductInput } from '../types/product.js'

function readText(
  value: unknown,
  label: string,
  maxLength: number,
): string {
  if (typeof value !== 'string') {
    throw new Error(`${label} debe ser un texto.`)
  }

  const text = value.trim()

  if (!text || text.length > maxLength) {
    throw new Error(
      `${label} debe tener entre 1 y ${maxLength} caracteres.`,
    )
  }

  return text
}

export function validateProduct(
  value: unknown,
): ProductInput {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new Error('El producto tiene un formato inválido.')
  }

  if (
    !('name' in value) ||
    !('description' in value) ||
    !('price' in value) ||
    !('category' in value) ||
    !('stock' in value) ||
    !('imageUrl' in value)
  ) {
    throw new Error('El producto tiene campos faltantes.')
  }

  const name = readText(value.name, 'El nombre', 120)

  const description = readText(
    value.description,
    'La descripción',
    2000,
  )

  const category = readText(
    value.category,
    'La categoría',
    60,
  )

  const price = value.price

  if (
    typeof price !== 'number' ||
    !Number.isFinite(price) ||
    price <= 0 ||
    price > 1_000_000_000
  ) {
    throw new Error(
      'El precio debe ser mayor que cero y no superar 1.000.000.000.',
    )
  }

  const stock = value.stock

  if (
    typeof stock !== 'number' ||
    !Number.isSafeInteger(stock) ||
    stock < 0 ||
    stock > 1_000_000
  ) {
    throw new Error(
      'El stock debe ser un número entero entre 0 y 1.000.000.',
    )
  }

  if (typeof value.imageUrl !== 'string') {
    throw new Error('La dirección de la imagen debe ser un texto.')
  }

  const imageUrl = value.imageUrl.trim()

  if (imageUrl.length > 2048) {
    throw new Error('La dirección de la imagen es demasiado larga.')
  }

  if (imageUrl) {
    if (
      /^\/api\/product-image\?key=products%2F[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(jpg|png|webp)$/i.test(
        imageUrl,
      )
    ) {
      return {
        name,
        description,
        price,
        category,
        stock,
        imageUrl,
      }
    }

    let url: URL

    try {
      url = new URL(imageUrl)
    } catch {
      throw new Error('La dirección de la imagen no es válida.')
    }

    if (
      url.protocol !== 'https:' ||
      !url.hostname ||
      url.username ||
      url.password
    ) {
      throw new Error(
        'La imagen debe tener una dirección HTTPS sin credenciales.',
      )
    }
  }

  return {
    name,
    description,
    price,
    category,
    stock,
    imageUrl,
  }
}