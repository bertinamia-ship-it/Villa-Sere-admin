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
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  className?: string
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
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
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
        onClick={handleOverlayClick}
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        role="dialog"
      >
        <div
          ref={modalRef}
          className={`
            bg-white rounded-lg shadow-xl
            w-full ${sizes[size]}
            max-h-[90vh] overflow-y-auto
            transform transition-all duration-200 ease-out
            ${className}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200/60">
              {title && (
                <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
                  {typeof title === 'string' ? title : title}
                </h2>
              )}
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="ml-auto -mr-2"
                  aria-label="Close modal"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
          <div className={title || showCloseButton ? 'p-6' : 'p-6'}>
            {children}
          </div>
        </div>
      </div>
    </Portal>
  )
}

