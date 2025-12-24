import { ButtonHTMLAttributes, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variants = {
  primary: 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-200 hover:from-indigo-500 hover:to-indigo-400 active:scale-[0.99]',
  secondary: 'bg-white text-gray-900 border border-gray-300 shadow-md hover:border-gray-400 hover:shadow-lg active:scale-[0.99]',
  danger: 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-200 active:scale-[0.99]',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 active:scale-[0.99] border border-transparent hover:border-gray-200',
}

const sizes = {
  sm: 'px-3.5 py-2 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-xl',
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
          transition-all duration-200 ease-out
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
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
