import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getProductImageSource,
  uploadProductImage,
} from './imageService'

const { auth } = vi.hoisted(() => ({
  auth: {
    currentUser: {
      getIdToken: vi.fn().mockResolvedValue('firebase-token'),
    } as { getIdToken: ReturnType<typeof vi.fn> } | null,
  },
}))

vi.mock('./firebase', () => ({
  auth,
}))

afterEach(() => {
  vi.unstubAllGlobals()
  auth.currentUser = {
    getIdToken: vi.fn().mockResolvedValue('firebase-token'),
  }
})

describe('imageService', () => {
  it('sube la imagen y devuelve una URL servida por el proxy privado', async () => {
    const key = 'products/123e4567-e89b-12d3-a456-426614174000.webp'
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            url: 'https://tech-store.s3.us-east-1.amazonaws.com',
            key,
            fields: {
              key,
              'Content-Type': 'image/webp',
              policy: 'signed-policy',
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    vi.stubGlobal('fetch', fetchMock)

    const imageUrl = await uploadProductImage(
      new File(['image-content'], 'product.webp', {
        type: 'image/webp',
      }),
    )

    expect(imageUrl).toBe(
      '/api/product-image?key=products%2F123e4567-e89b-12d3-a456-426614174000.webp',
    )
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://tech-store.s3.us-east-1.amazonaws.com',
    )
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: 'POST',
    })
  })

  it('rechaza formatos no permitidos antes de iniciar una solicitud', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      uploadProductImage(
        new File(['not-image'], 'script.svg', {
          type: 'image/svg+xml',
        }),
      ),
    ).rejects.toThrow('Seleccioná una imagen JPG, PNG o WebP.')

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('no solicita autorización si no hay usuario autenticado', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    auth.currentUser = null

    await expect(
      uploadProductImage(
        new File(['image'], 'product.png', {
          type: 'image/png',
        }),
      ),
    ).rejects.toThrow('Iniciá sesión para subir imágenes.')

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('muestra un error claro si el servidor devuelve HTML con un error 500', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('<html>Internal Server Error</html>', {
          status: 500,
          headers: { 'Content-Type': 'text/html' },
        }),
      ),
    )

    await expect(
      uploadProductImage(
        new File(['image'], 'product.png', {
          type: 'image/png',
        }),
      ),
    ).rejects.toThrow(
      'No pudimos autorizar la subida. El servidor devolvió una respuesta inválida (HTTP 500).',
    )
  })

  it('muestra un error claro si el servidor devuelve texto plano con un error 500', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('Internal Server Error', {
          status: 500,
          headers: { 'Content-Type': 'text/plain' },
        }),
      ),
    )

    await expect(
      uploadProductImage(
        new File(['image'], 'product.png', {
          type: 'image/png',
        }),
      ),
    ).rejects.toThrow(
      'No pudimos autorizar la subida. El servidor devolvió una respuesta inválida (HTTP 500).',
    )
  })

  it('traduce URL antiguas de S3 a la ruta proxy y conserva URLs externas', () => {
    expect(
      getProductImageSource(
        'https://tech-store.s3.us-east-1.amazonaws.com/products/123e4567-e89b-12d3-a456-426614174000.jpg',
      ),
    ).toBe(
      '/api/product-image?key=products%2F123e4567-e89b-12d3-a456-426614174000.jpg',
    )

    expect(
      getProductImageSource('https://images.example.com/item.webp'),
    ).toBe('https://images.example.com/item.webp')
  })
})
