'use client'

import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  rightSlot?: ReactNode
  className?: string
}

/**
 * Unified page header component for consistent styling across all modules
 * Mobile-first design with premium feel
 */
export function PageHeader({ title, subtitle, rightSlot, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 ${className}`}>
      <div className="flex-1 min-w-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {rightSlot && (
        <div className="flex-shrink-0">
          {rightSlot}
        </div>
      )}
    </div>
  )
}

