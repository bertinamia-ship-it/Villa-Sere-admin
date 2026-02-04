import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-medium text-[#0F172A] mb-1.5">
            {label}
            {props.required && <span className="text-[#EF4444] ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`
            w-full px-3.5 sm:px-3 py-3 sm:py-2.5
            text-base sm:text-sm text-slate-900
            bg-white border border-slate-200/60 rounded-lg sm:rounded-md
            transition-all duration-150 ease-out
            focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:shadow-sm
            hover:border-slate-300/60
            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
            autofill:!text-slate-900 autofill:!bg-white
            min-h-[44px] sm:min-h-0
            ${error ? 'border-red-500 focus:ring-red-500/30' : ''}
            ${className}
          `}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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

Select.displayName = 'Select'
