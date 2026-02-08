/**
 * Centralized error handling and reporting
 * Ensures consistent error logging and user-friendly messages
 * 
 * Note: getUserFriendlyError accepts an optional translation function
 * to support i18n. If not provided, defaults to Spanish.
 */

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
 * Format error for console logging (only in development)
 */
export function logError(context: string, error: any): void {
  // Only log in development
  if (process.env.NODE_ENV === 'development') {
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
}

// Dynamic import to avoid circular dependencies
let defaultT: ((key: string) => string) | null = null

function getDefaultT(): (key: string) => string {
  if (!defaultT) {
    try {
      const { t } = require('@/lib/i18n/es')
      defaultT = t
    } catch {
      defaultT = (key: string) => key
    }
  }
  return defaultT
}

/**
 * Get user-friendly error message
 * @param error - The error object
 * @param t - Translation function (optional, defaults to Spanish)
 */
export function getUserFriendlyError(error: any, t?: (key: string) => string): string {
  const details = extractErrorDetails(error)
  
  // Use provided translation function or get default
  const translate = t || getDefaultT()
  
  // Common error codes with specific messages
  if (details.code) {
    switch (details.code) {
      case 'PGRST116':
        return translate('errors.notFound')
      case '23505':
        return translate('errors.duplicateEntry')
      case '23503':
        return translate('errors.foreignKeyViolation')
      case '42501':
        return translate('errors.permissionDenied')
      case '42P01':
        return translate('errors.tableNotFound')
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
  return translate('errors.unknownError')
}
