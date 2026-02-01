import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-medium text-[#0F172A] mb-1.5">
            {label}
            {props.required && <span className="text-[#EF4444] ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-3 py-2 
            text-[#0F172A] placeholder-[#64748B]
            bg-white border border-gray-200/60 rounded-md
            transition-all duration-200 ease-out
            focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] focus:shadow-sm
            hover:border-gray-300/60
            disabled:bg-[#F8FAFC] disabled:text-[#64748B] disabled:cursor-not-allowed
            autofill:!text-[#0F172A] autofill:!bg-white
            ${error ? 'border-[#EF4444] focus:ring-[#EF4444]/30' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-[#EF4444]">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-xs text-[#64748B]">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
