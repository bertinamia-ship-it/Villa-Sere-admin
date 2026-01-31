import { Loader2 } from 'lucide-react'

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }
  
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className={`${sizes[size]} animate-spin text-blue-600`} />
    </div>
  )
}

export function LoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-[80]">
      <LoadingSpinner size="lg" />
    </div>
  )
}
