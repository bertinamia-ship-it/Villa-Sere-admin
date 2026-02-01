import { ButtonHTMLAttributes, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variants = {
  primary: 'bg-[#0F172A] text-white hover:bg-[#1E293B] active:scale-[0.99] shadow-sm transition-all',
  secondary: 'bg-white text-[#0F172A] border border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] active:scale-[0.99] shadow-sm transition-all',
  danger: 'bg-[#EF4444] hover:bg-[#DC2626] text-white active:scale-[0.99] shadow-sm transition-all',
  ghost: 'bg-transparent hover:bg-[#F8FAFC] text-[#64748B] active:scale-[0.99] border border-transparent hover:border-[#E2E8F0] transition-all',
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
          transition-all duration-150 ease-out transform
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2563EB]/30 focus:ring-offset-white
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
