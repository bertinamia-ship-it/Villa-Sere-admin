import { ButtonHTMLAttributes, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-sm',
  secondary: 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 active:scale-[0.98] shadow-sm',
  danger: 'bg-red-600 hover:bg-red-700 text-white active:scale-[0.98] shadow-sm',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 active:scale-[0.98] border border-transparent',
}

const sizes = {
  sm: 'h-9 px-3.5 text-sm rounded-lg',
  md: 'h-10 px-4 text-sm rounded-lg',
  lg: 'h-11 px-6 text-base rounded-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    loading = false, 
    children, 
    className = '', 
    disabled,
    ...props 
  }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-2 font-semibold
          transition-all duration-200 ease-out transform
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500/30
          disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none
          ${variants[variant]}
          ${sizes[size]}
          ${className}
        `}
        aria-busy={loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
