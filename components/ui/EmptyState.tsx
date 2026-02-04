import { ReactNode } from 'react'
import { Button } from './Button'
import { t } from '@/lib/i18n/es'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  actionLabel,
  onAction 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="mb-6 text-[#CBD5E1] transition-transform duration-200">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-[#0F172A] mb-2 tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[#64748B] mb-8 max-w-md leading-relaxed">
          {description}
        </p>
      )}
      {(action || (onAction && actionLabel)) && (
        <div className="mt-2">
          {action || (
            <Button onClick={onAction} size="md">
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
