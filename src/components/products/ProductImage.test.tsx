import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ProductImage from './ProductImage'

vi.mock('../../services/imageService', () => ({
  getProductImageSource: (source: string) => source,
}))

describe('ProductImage', () => {
  it('muestra la imagen con el texto alternativo y el origen recibido', () => {
    render(
      <ProductImage
        src="/api/product-image?key=products%2F123e4567-e89b-12d3-a456-426614174000.png"
        alt="Teclado"
      />,
    )

    expect(
      screen.getByRole('img', { name: 'Teclado' }).getAttribute('src'),
    ).toBe(
      '/api/product-image?key=products%2F123e4567-e89b-12d3-a456-426614174000.png',
    )
  })

  it('presenta un fallback accesible cuando el navegador no puede cargarla', () => {
    render(<ProductImage src="/image.webp" alt="Auriculares" />)

    fireEvent.error(screen.getByRole('img', { name: 'Auriculares' }))

    expect(
      screen.getByRole('img', {
        name: 'Auriculares: no se pudo cargar la imagen',
      }),
    ).toBeTruthy()
  })
})
