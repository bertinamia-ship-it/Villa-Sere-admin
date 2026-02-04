/**
 * Centralized date calculation helpers for recurrent items
 * Avoids duplication and ensures consistency
 */

/**
 * Calculate next due date for tasks based on cadence
 */
export function calculateNextDueDate(
  cadence: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly',
  startDate: string,
  lastCompletedDate: string | null = null
): string {
  const baseDate = lastCompletedDate ? new Date(lastCompletedDate) : new Date(startDate)
  const next = new Date(baseDate)

  switch (cadence) {
    case 'once':
      return startDate // For once, just return the due date
    case 'daily':
      next.setDate(baseDate.getDate() + 1)
      break
    case 'weekly':
      next.setDate(baseDate.getDate() + 7)
      break
    case 'monthly':
      next.setMonth(baseDate.getMonth() + 1)
      break
    case 'yearly':
      next.setFullYear(baseDate.getFullYear() + 1)
      break
  }

  return next.toISOString().split('T')[0]
}

/**
 * Calculate next run date for maintenance plans based on frequency
 */
export function calculateNextRunDate(
  frequencyUnit: 'day' | 'week' | 'month' | 'year' | null,
  frequencyInterval: number | null,
  startDate: string,
  lastCompletedDate: string | null = null
): string {
  if (!frequencyUnit || !frequencyInterval || frequencyInterval <= 0) {
    return startDate // If not recurrent, return start date
  }

  const baseDate = lastCompletedDate ? new Date(lastCompletedDate) : new Date(startDate)
  const next = new Date(baseDate)

  switch (frequencyUnit) {
    case 'day':
      next.setDate(baseDate.getDate() + frequencyInterval)
      break
    case 'week':
      next.setDate(baseDate.getDate() + (frequencyInterval * 7))
      break
    case 'month':
      next.setMonth(baseDate.getMonth() + frequencyInterval)
      break
    case 'year':
      next.setFullYear(baseDate.getFullYear() + frequencyInterval)
      break
  }

  return next.toISOString().split('T')[0]
}

