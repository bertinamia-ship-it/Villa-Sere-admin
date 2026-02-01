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
            w-full px-3 py-2 
            text-[#0F172A] placeholder-[#64748B]
            bg-white border border-[#E2E8F0] rounded-md
            transition-all duration-150 ease-out
            focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] focus:shadow-sm
            hover:border-[#CBD5E1]
            disabled:bg-[#F8FAFC] disabled:text-[#64748B] disabled:cursor-not-allowed
            autofill:!text-[#0F172A] autofill:!bg-white
            ${error ? 'border-[#EF4444] focus:ring-[#EF4444]/30' : ''}
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
