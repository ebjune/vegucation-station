import { ButtonHTMLAttributes, ReactNode } from 'react'

interface TouchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  children: ReactNode
}

export default function TouchButton({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  disabled,
  ...props
}: TouchButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center gap-3 rounded-touch font-semibold
    transition-all duration-150 ease-in-out
    active:scale-95 active:brightness-90
    disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
  `

  const variantStyles = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600',
    secondary: 'bg-secondary-500 text-white hover:bg-secondary-600',
    outline: 'bg-transparent border-2 border-primary-500 text-primary-700 hover:bg-primary-50',
    ghost: 'bg-transparent text-earth-800 hover:bg-earth-800/10',
  }

  const sizeStyles = {
    sm: 'min-h-touch-min px-4 py-2 text-touch-sm',
    md: 'min-h-touch px-6 py-4 text-touch-base',
    lg: 'min-h-[80px] px-8 py-5 text-touch-lg',
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="text-2xl">{icon}</span>}
      {children}
    </button>
  )
}
