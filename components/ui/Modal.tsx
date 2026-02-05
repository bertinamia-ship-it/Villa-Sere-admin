'use client'

import { useEffect, useRef, ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'
import { Portal } from './Portal'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string | ReactNode
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  className?: string
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-full',
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = '',
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Focus trap
  useEffect(() => {
    if (!isOpen) return

    // Store previous focus
    previousFocusRef.current = document.activeElement as HTMLElement

    // Focus modal
    const modal = modalRef.current
    if (modal) {
      const focusableElements = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0]
      if (firstElement) {
        firstElement.focus()
      }
    }

    // Return focus on close
    return () => {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }
  }, [isOpen])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === overlayRef.current) {
      onClose()
    }
  }

  return (
    <Portal>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ease-out safe-area-y"
        onClick={handleOverlayClick}
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        role="dialog"
      >
        <div
          ref={modalRef}
          className={`
            bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border-t sm:border border-slate-200/60
            w-full ${size === 'full' ? 'max-w-full' : sizes[size]}
            ${size === 'full' ? 'h-[95vh]' : 'h-[95vh] sm:h-auto sm:max-h-[90vh]'} overflow-hidden
            transform transition-all duration-300 ease-out
            flex flex-col
            ${className}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between px-4 py-3 sm:p-6 border-b border-slate-200/60 shrink-0 safe-area-top safe-area-x">
              {title && (
                <h2 id="modal-title" className="text-lg sm:text-xl font-semibold text-slate-900">
                  {typeof title === 'string' ? title : title}
                </h2>
              )}
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="ml-auto -mr-2 min-w-[44px] min-h-[44px]"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
          )}
          <div className={`flex-1 overflow-y-auto ${title || showCloseButton ? 'px-4 py-4 sm:p-6' : 'p-4 sm:p-6'} safe-area-x safe-area-bottom`}>
            {children}
          </div>
        </div>
      </div>
    </Portal>
  )
}

