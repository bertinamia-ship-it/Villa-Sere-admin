/**
 * Tenant Utilities
 * Helper functions for multi-tenant operations
 */

import { createClient } from '@/lib/supabase/server'

export interface Tenant {
  id: string
  name: string
  slug: string
  owner_id: string
  subscription_status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired'
  subscription_plan: 'free' | 'basic' | 'premium'
  trial_ends_at: string | null
  settings: Record<string, any>
  created_at: string
  updated_at: string
}

/**
 * Get the current user's tenant
 * Returns null if user has no tenant (shouldn't happen after signup)
 */
export async function getCurrentTenant(): Promise<Tenant | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get tenant from profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('[getCurrentTenant] Error fetching profile:', {
      message: profileError.message,
      details: profileError.details,
      hint: profileError.hint,
      code: profileError.code
    })
    return null
  }

  if (!profile || !profile.tenant_id) {
    console.error('[getCurrentTenant] CRITICAL: No profile or tenant_id found for user:', {
      user_id: user.id,
      profile_exists: !!profile,
      tenant_id: profile?.tenant_id,
      error: 'User account is missing tenant_id. This should never happen after signup. Run backfill: UPDATE profiles SET tenant_id = (SELECT id FROM tenants WHERE owner_id = profiles.id) WHERE tenant_id IS NULL;'
    })
    return null
  }

  // Get tenant details
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', profile.tenant_id)
    .single()

  return tenant as Tenant | null
}

/**
 * Get tenant_id for current user
 * Used in queries to filter by tenant
 */
export async function getCurrentTenantId(): Promise<string | null> {
  const tenant = await getCurrentTenant()
  return tenant?.id || null
}

/**
 * Check if current user is owner of their tenant
 */
export async function isTenantOwner(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return false
  }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('owner_id')
    .eq('owner_id', user.id)
    .single()

  return !!tenant
}

/**
 * Check if tenant subscription is active (active status or valid trial)
 */
export async function isTenantActive(): Promise<boolean> {
  const tenant = await getCurrentTenant()
  if (!tenant) {
    return false
  }

  // Active subscription
  if (tenant.subscription_status === 'active') {
    return true
  }

  // Trial: check if not expired
  if (tenant.subscription_status === 'trial') {
    if (!tenant.trial_ends_at) {
      return true // No expiration set, assume active
    }
    return new Date(tenant.trial_ends_at) > new Date()
  }

  // All other statuses are inactive
  return false
}

/**
 * Get subscription limits for current tenant
 */
export async function getSubscriptionLimits(): Promise<{
  maxProperties: number
  maxUsers: number
}> {
  const tenant = await getCurrentTenant()
  if (!tenant) {
    return { maxProperties: 0, maxUsers: 0 }
  }

  // Check if admin account (bypass limits)
  const supabase = await import('@/lib/supabase/server').then(m => m.createClient())
  const { data: { user } } = await supabase.auth.getUser()
  const isAdminAccount = user?.email === 'condecorporation@gmail.com'
  
  if (isAdminAccount) {
    return { maxProperties: Infinity, maxUsers: Infinity }
  }

  // Free/trial: 1 property, 1 user
  if (tenant.subscription_plan === 'free' || tenant.subscription_status === 'trial') {
    return { maxProperties: 1, maxUsers: 1 }
  }

  // Paid plans: unlimited (for now)
  return { maxProperties: Infinity, maxUsers: Infinity }
}

