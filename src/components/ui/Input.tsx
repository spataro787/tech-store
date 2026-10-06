import { useId } from 'react'
import type { ComponentPropsWithoutRef } from 'react'

type InputProps = ComponentPropsWithoutRef<'input'> & {
  label: string
  hint?: string
  error?: string
}

function Input({
  label,
  hint,
  error,
  id,
  className = '',
  'aria-describedby': describedBy,
  'aria-invalid': invalid,
  ...props
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`

  const descriptionIds = [
    describedBy,
    hint ? hintId : undefined,
    error ? errorId : undefined,
  ]
    .filter(Boolean)
    .join(' ') || undefined

  return (
    <div className="min-w-0">
      <label htmlFor={inputId} className="store-label">
        {label}
      </label>

      <input
        {...props}
        id={inputId}
        aria-describedby={descriptionIds}
        aria-invalid={error ? true : invalid}
        className={`store-input ${className}`}
      />

      {hint && (
        <p id={hintId} className="mt-2 text-sm text-muted">
          {hint}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-2 text-sm text-danger-content"
        >
          {error}
        </p>
      )}
    </div>
  )
}

export default Input