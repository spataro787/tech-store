import { useState } from 'react'
import { getProductImageSource } from '../../services/imageService'

type ProductImageProps = {
  src: string
  alt: string
  className?: string
  loading?: 'eager' | 'lazy'
  width?: number
  height?: number
}

function ProductImage({
  src,
  alt,
  className,
  loading = 'lazy',
  width,
  height,
}: ProductImageProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null)
  const imageSource = getProductImageSource(src)

  if (failedSource === imageSource) {
    return (
      <span
        role="img"
        aria-label={`${alt}: no se pudo cargar la imagen`}
        className={`flex h-full w-full items-center justify-center text-xs text-subtle ${className ?? ''}`}
      >
        Imagen no disponible
      </span>
    )
  }

 return (
  <img
    src={imageSource}
    alt={alt}
    loading={loading}
    width={width}
    height={height}
    className={className}
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      objectPosition: 'center',
      display: 'block',
    }}
    onError={() => setFailedSource(imageSource)}
  />
)
}

export default ProductImage
