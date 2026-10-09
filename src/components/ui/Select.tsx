import { useId } from 'react'
import type { ComponentPropsWithoutRef } from 'react'

type SelectProps = ComponentPropsWithoutRef<'select'> & {
  label: string
  hint?: string
  error?: string
}

function Select({
  label,
  hint,
  error,
  id,
  children,
  className = '',
  'aria-describedby': describedBy,
  'aria-invalid': invalid,
  ...props
}: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId

  const hintId = `${selectId}-hint`
  const errorId = `${selectId}-error`

  const descriptionIds = [
    describedBy,
    hint ? hintId : undefined,
    error ? errorId : undefined,
  ]
    .filter(Boolean)
    .join(' ') || undefined

  return (
    <div className="min-w-0">
      <label htmlFor={selectId} className="store-label">
        {label}
      </label>

      <select
        {...props}
        id={selectId}
        aria-describedby={descriptionIds}
        aria-invalid={error ? true : invalid}
        className={`store-input ${className}`}
      >
        {children}
      </select>

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

export default Select