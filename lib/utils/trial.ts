/**
 * Trial Utilities
 * Helper functions for trial management
 */

import { createClient } from '@/lib/supabase/server'
import { getCurrentTenant } from './tenant'

export interface TrialInfo {
  isActive: boolean
  isExpired: boolean
  daysRemaining: number | null
  trialEndsAt: string | null
  trialStartsAt: string | null
}

/**
 * Check if trial is currently active (not expired)
 */
export async function isTrialActive(): Promise<boolean> {
  const tenant = await getCurrentTenant()
  if (!tenant) {
    return false
  }

  // Only check if status is trial
  if (tenant.subscription_status !== 'trial') {
    return false
  }

  // If no trial_ends_at, assume active
  if (!tenant.trial_ends_at) {
    return true
  }

  // Check if trial hasn't expired
  return new Date(tenant.trial_ends_at) > new Date()
}

/**
 * Get trial information (active, expired, days remaining)
 */
export async function getTrialInfo(): Promise<TrialInfo> {
  const tenant = await getCurrentTenant()
  if (!tenant || tenant.subscription_status !== 'trial') {
    return {
      isActive: false,
      isExpired: false,
      daysRemaining: null,
      trialEndsAt: null,
      trialStartsAt: null,
    }
  }

  const trialEndsAt = tenant.trial_ends_at
  const trialStartsAt = (tenant as any).trial_start_at || tenant.created_at

  if (!trialEndsAt) {
    return {
      isActive: true,
      isExpired: false,
      daysRemaining: null,
      trialEndsAt: null,
      trialStartsAt,
    }
  }

  const now = new Date()
  const endsAt = new Date(trialEndsAt)
  const isExpired = endsAt <= now
  const isActive = !isExpired

  // Calculate days remaining
  const diffTime = endsAt.getTime() - now.getTime()
  const daysRemaining = isActive ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0

  return {
    isActive,
    isExpired,
    daysRemaining: isActive ? daysRemaining : null,
    trialEndsAt,
    trialStartsAt,
  }
}

/**
 * Initialize trial for a new tenant (7 days from now)
 */
export async function initializeTrial(tenantId: string): Promise<{ error: any }> {
  const supabase = await createClient()
  const now = new Date()
  const trialEndsAt = new Date(now)
  trialEndsAt.setDate(trialEndsAt.getDate() + 7) // 7 days from now

  const { error } = await supabase
    .from('tenants')
    .update({
      subscription_status: 'trial',
      trial_start_at: now.toISOString(),
      trial_ends_at: trialEndsAt.toISOString(),
    })
    .eq('id', tenantId)

  return { error }
}

