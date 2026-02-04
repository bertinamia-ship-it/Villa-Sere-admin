/**
 * Centralized error handling and reporting
 * Ensures consistent error logging and user-friendly messages
 */

import { t } from '@/lib/i18n/es'

export interface SupabaseError {
  message?: string
  details?: string
  hint?: string
  code?: string
  status?: number
}

/**
 * Extract error details from Supabase error
 */
export function extractErrorDetails(error: any): SupabaseError {
  return {
    message: error?.message || error?.error_description || 'Error desconocido',
    details: error?.details,
    hint: error?.hint,
    code: error?.code,
    status: error?.status || error?.statusCode,
  }
}

/**
 * Format error for console logging
 */
export function logError(context: string, error: any): void {
  const details = extractErrorDetails(error)
  console.error(`[${context}] Error:`, {
    message: details.message,
    details: details.details,
    hint: details.hint,
    code: details.code,
    status: details.status,
    fullError: error,
  })
}

/**
 * Get user-friendly error message (in Spanish)
 */
export function getUserFriendlyError(error: any): string {
  const details = extractErrorDetails(error)
  
  // Common error codes with specific messages
  if (details.code) {
    switch (details.code) {
      case 'PGRST116':
        return t('errors.notFound')
      case '23505':
        return t('errors.duplicateEntry')
      case '23503':
        return t('errors.foreignKeyViolation')
      case '42501':
        return t('errors.permissionDenied')
      case '42P01':
        return t('errors.tableNotFound')
    }
  }

  // Use hint if available (usually more helpful)
  if (details.hint) {
    return details.hint
  }

  // Use message
  if (details.message) {
    return details.message
  }

  // Fallback
  return t('errors.unknownError')
}

