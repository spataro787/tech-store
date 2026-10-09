import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import type { ProductInput } from '../../types/product'
import { validateProduct } from '../../utils/productValidation'
import { uploadProductImage } from '../../services/imageService'
import ProductImage from './ProductImage'

type ProductFormProps = {
  initialValues?: ProductInput
  submitLabel: string
  onSubmit: (product: ProductInput) => Promise<void>
}

function ProductForm({
  initialValues,
  submitLabel,
  onSubmit,
}: ProductFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [description, setDescription] = useState(
    initialValues?.description ?? '',
  )
  const [category, setCategory] = useState(
    initialValues?.category ?? '',
  )
  const [price, setPrice] = useState(
    initialValues ? String(initialValues.price) : '',
  )
  const [stock, setStock] = useState(
    initialValues ? String(initialValues.stock) : '',
  )
  const [imageUrl, setImageUrl] = useState(
    initialValues?.imageUrl ?? '',
  )

  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] =
    useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const busyRef = useRef(false)

  async function handleImageChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.currentTarget.files?.[0]

    // Permite seleccionar otra vez el mismo archivo.
    event.currentTarget.value = ''

    if (!file || busyRef.current) {
      return
    }

    busyRef.current = true
    setUploading(true)
    setError(null)
    setUploadMessage(null)

    try {
      const uploadedUrl = await uploadProductImage(file)

      setImageUrl(uploadedUrl)
      setUploadMessage(
        'Imagen subida. Guardá el producto para asociarla al catálogo.',
      )
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'No pudimos subir la imagen. Intentá nuevamente.',
      )
    } finally {
      busyRef.current = false
      setUploading(false)
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (busyRef.current) {
      return
    }

    setError(null)

    let product: ProductInput

    try {
      if (!price.trim() || !stock.trim()) {
        throw new Error('Completá el precio y el stock.')
      }

      product = validateProduct({
        name,
        description,
        category,
        price: Number(price),
        stock: Number(stock),
        imageUrl,
      })

      const priceCents = Math.round(product.price * 100)

      if (
        priceCents < 1 ||
        Math.abs(product.price * 100 - priceCents) > 0.000001
      ) {
        throw new Error(
          'El precio debe ser de al menos $0,01 y tener como máximo dos decimales.',
        )
      }
    } catch (validationError) {
      setError(
        validationError instanceof Error
          ? validationError.message
          : 'Revisá los datos del producto.',
      )
      return
    }

    busyRef.current = true
    setSubmitting(true)

    try {
      await onSubmit(product)
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'No pudimos guardar el producto.',
      )
    } finally {
      busyRef.current = false
      setSubmitting(false)
    }
  }

  const busy = submitting || uploading

  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={busy}
      className="space-y-5"
    >
      {error && (
        <p role="alert" className="store-error">
          {error}
        </p>
      )}

      <fieldset
        disabled={busy}
        className="min-w-0 space-y-5"
      >
        <Input
          id="product-name"
          label="Nombre del producto"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={120}
        />

        <div>
          <label
            htmlFor="product-description"
            className="store-label"
          >
            Descripción
          </label>

          <textarea
            id="product-description"
            name="description"
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            required
            maxLength={2000}
            rows={4}
            className="store-input resize-y"
          />
        </div>

        <Input
          id="product-category"
          label="Categoría"
          value={category}
          onChange={(event) =>
            setCategory(event.target.value)
          }
          placeholder="Por ejemplo: Periféricos"
          required
          maxLength={60}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            id="product-price"
            label="Precio en pesos"
            type="number"
            min="0.01"
            max="1000000000"
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            required
          />

          <Input
            id="product-stock"
            label="Stock disponible"
            type="number"
            min="0"
            max="1000000"
            step="1"
            value={stock}
            onChange={(event) => setStock(event.target.value)}
            required
          />
        </div>

        <div>
          <label
            htmlFor="product-image-file"
            className="store-label"
          >
            Subir imagen del producto
          </label>

          <input
            id="product-image-file"
            name="imageFile"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-describedby="product-image-help"
            onChange={(event) => {
              void handleImageChange(event)
            }}
            className="store-input"
          />

          <p
            id="product-image-help"
            className="mt-2 text-sm text-muted"
          >
            JPG, PNG o WebP. Tamaño máximo: 5 MiB.
            La subida comienza al seleccionar el archivo.
          </p>
        </div>

        <Input
          id="product-image"
          label="Dirección de la imagen"
          type="text"
          value={imageUrl}
          onChange={(event) => {
            setImageUrl(event.target.value)
            setUploadMessage(null)
          }}
          placeholder="https://..."
          maxLength={2048}
          hint="Se completa al subir una imagen. También podés ingresar una dirección HTTPS."
        />

        {imageUrl && (
          <div className="space-y-3">
            <div className="flex h-48 items-center justify-center overflow-hidden rounded-panel border border-accent/20 bg-surface-deep p-4">
              <ProductImage
                src={imageUrl}
                alt="Vista previa del producto"
                className="h-full w-full object-contain"
                loading="eager"
              />
            </div>

            <Button
              variant="secondary"
              onClick={() => {
                setImageUrl('')
                setUploadMessage(null)
              }}
            >
              Quitar imagen del producto
            </Button>
          </div>
        )}

        <Button type="submit" className="w-full sm:w-auto">
          {uploading
            ? 'Subiendo imagen…'
            : submitting
              ? 'Guardando producto…'
              : submitLabel}
        </Button>
      </fieldset>

      {uploading && (
        <p role="status" className="store-status">
          Subiendo imagen a S3…
        </p>
      )}

      {uploadMessage && (
        <p role="status" className="store-status">
          {uploadMessage}
        </p>
      )}

      {submitting && (
        <p role="status" className="store-status">
          Guardando los cambios…
        </p>
      )}
    </form>
  )
}

export default ProductForm