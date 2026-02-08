import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  // Mobile: lighter effects, desktop: full effects
  return (
    <div className={`
      bg-white/90 
      sm:backdrop-blur-sm 
      rounded-xl 
      border border-slate-200/60 
      shadow-sm sm:shadow-md 
      transition-all duration-300 ease-out 
      hover:shadow-md sm:hover:shadow-lg 
      hover:scale-[1.01] 
      hover:border-slate-300/60 
      ${paddings[padding]} 
      ${className}
    `}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`pb-4 mb-6 border-b border-[#E2E8F0] ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`text-base font-semibold text-[#0F172A] tracking-tight ${className}`}>
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
