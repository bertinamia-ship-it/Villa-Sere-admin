/**
 * Centralized formatters for dates, currency, and status badges
 * Avoids duplication across modules
 */

/**
 * Format date to Spanish locale
 */
export function formatDate(date: string | Date, options?: {
  day?: 'numeric' | '2-digit'
  month?: 'short' | 'long' | 'numeric' | '2-digit'
  year?: 'numeric' | '2-digit'
}): string {
  const dateObj = typeof date === 'string' ? new Date(date + 'T00:00:00') : date
  const defaultOptions = {
    day: 'numeric' as const,
    month: 'short' as const,
    year: 'numeric' as const,
    ...options
  }
  return dateObj.toLocaleDateString('es-ES', defaultOptions)
}

/**
 * Format currency to USD
 */
export function formatCurrency(amount: number | string | null | undefined, decimals: number = 2): string {
  if (amount === null || amount === undefined) return '$0.00'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '$0.00'
  return `$${num.toFixed(decimals)}`
}

/**
 * Format currency without decimals (for display)
 */
export function formatCurrencyShort(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '$0'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '$0'
  return `$${Math.round(num)}`
}

/**
 * Get status badge classes for bookings
 */
export function getBookingStatusColor(status: string): string {
  switch (status) {
    case 'confirmed':
      return 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20'
    case 'completed':
      return 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20'
    case 'cancelled':
      return 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20'
    case 'pending':
      return 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

/**
 * Get priority badge classes
 */
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent':
      return 'text-[#EF4444] bg-[#EF4444]/10'
    case 'high':
      return 'text-[#F59E0B] bg-[#F59E0B]/10'
    case 'medium':
      return 'text-[#2563EB] bg-[#2563EB]/10'
    case 'low':
      return 'text-[#10B981] bg-[#10B981]/10'
    default:
      return 'text-slate-600 bg-slate-50'
  }
}

/**
 * Get status badge classes for maintenance tickets
 */
export function getMaintenanceStatusColor(status: string): string {
  switch (status) {
    case 'done':
      return 'text-[#10B981] bg-[#10B981]/10'
    case 'in_progress':
      return 'text-[#2563EB] bg-[#2563EB]/10'
    case 'open':
      return 'text-slate-600 bg-slate-50'
    default:
      return 'text-slate-600 bg-slate-50'
  }
}

/**
 * Get status badge classes for tasks
 */
export function getTaskStatusColor(status: string): string {
  switch (status) {
    case 'done':
      return 'text-[#10B981] bg-[#10B981]/10'
    case 'in_progress':
      return 'text-[#2563EB] bg-[#2563EB]/10'
    case 'pending':
      return 'text-slate-600 bg-slate-50'
    default:
      return 'text-slate-600 bg-slate-50'
  }
}


