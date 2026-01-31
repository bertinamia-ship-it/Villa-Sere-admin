'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from './ui/Button'

interface TenantErrorProps {
  message?: string
  onRetry?: () => void
}

export default function TenantError({ 
  message = 'Your account is missing tenant information. Please contact support.',
  onRetry 
}: TenantErrorProps) {
  return (
    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center max-w-2xl mx-auto my-8">
      <div className="flex items-center justify-center mb-4">
        <AlertTriangle className="h-8 w-8 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-red-900 mb-2">
        Account Configuration Error
      </h3>
      <p className="text-red-700 mb-4">
        {message}
      </p>
      <p className="text-sm text-red-600 mb-4">
        This usually happens when your account was created before the tenant system was set up.
        Please contact support or refresh the page after your account has been updated.
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary">
          Retry
        </Button>
      )}
    </div>
  )
}

