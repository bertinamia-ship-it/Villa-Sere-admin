import { ButtonHTMLAttributes, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variants = {
  primary: 'bg-gradient-to-r from-slate-900 to-slate-800 text-white hover:from-slate-800 hover:to-slate-700 active:scale-[0.97] shadow-lg hover:shadow-xl transition-all duration-300 ease-out',
  secondary: 'bg-white/90 backdrop-blur-sm text-slate-900 border border-slate-200/60 hover:bg-white hover:border-slate-300/60 hover:shadow-md active:scale-[0.97] transition-all duration-300 ease-out',
  danger: 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white active:scale-[0.97] shadow-lg hover:shadow-xl transition-all duration-300 ease-out',
  ghost: 'bg-transparent hover:bg-slate-100/80 text-slate-600 hover:text-slate-900 active:scale-[0.97] border border-transparent hover:border-slate-200/60 transition-all duration-300 ease-out',
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
