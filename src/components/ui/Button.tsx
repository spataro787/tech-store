import type { ComponentPropsWithoutRef } from 'react'

type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: 'primary' | 'secondary'
}

function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const variantStyles = {
    primary: 'store-button-primary',
    secondary: 'store-button-secondary',
  }

  return (
    <button
      {...props}
      type={type}
      className={`store-button ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export default Button