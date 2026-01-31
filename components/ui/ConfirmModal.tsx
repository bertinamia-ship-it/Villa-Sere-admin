'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'
import { Modal } from './Modal'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning'
  loading?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false
}: ConfirmModalProps) {
  const variantStyles = {
    danger: 'border-red-200 bg-red-50',
    warning: 'border-yellow-200 bg-yellow-50'
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <AlertTriangle className={`h-5 w-5 ${variant === 'danger' ? 'text-red-600' : 'text-yellow-600'}`} />
          <span>{title}</span>
        </div>
      }
      size="md"
      closeOnOverlayClick={!loading}
    >
      <div className="space-y-4">
        <p className="text-gray-700">{message}</p>
        
        <div className={`border rounded-lg p-3 ${variantStyles[variant]}`}>
          <p className="text-sm font-medium text-gray-900">
            This action cannot be undone.
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'warning' ? 'primary' : variant}
            onClick={onConfirm}
            disabled={loading}
            loading={loading}
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

