import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200/60 shadow-sm transition-all duration-200 ease-out hover:shadow-md hover:border-gray-300/60 ${paddings[padding]} ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`pb-4 mb-4 border-b border-gray-200/60 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`text-sm font-semibold text-[#0F172A] ${className}`}>
      {children}
    </h2>
  )
}

export function CardContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`${className}`}>
      {children}
    </div>
  )
}
