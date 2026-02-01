import { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="mb-4 text-slate-400 transition-transform duration-200">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900 mb-1.5">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-slate-600 mb-6 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  )
}
