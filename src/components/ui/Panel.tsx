import type { ComponentPropsWithoutRef } from 'react'

type PanelProps = ComponentPropsWithoutRef<'div'> & {
  padding?: 'normal' | 'none'
}

function Panel({
  children,
  padding = 'normal',
  className = '',
  ...props
}: PanelProps) {
  const paddingClass =
    padding === 'normal' ? 'p-6 sm:p-8' : ''

  return (
    <div
      {...props}
      className={`store-panel ${paddingClass} ${className}`}
    >
      {children}
    </div>
  )
}

export default Panel