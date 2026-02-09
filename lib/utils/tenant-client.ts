/**
 * Tenant Utilities (Client-side)
 * Helper functions for multi-tenant operations in client components
 */

import { createClient } from '@/lib/supabase/client'
import { cache, CACHE_KEYS } from './cache'

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
 * Get the current user's tenant (client-side, with cache)
 */
export async function getCurrentTenantClient(): Promise<Tenant | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get tenant_id from profile (with cache)
  const profileCacheKey = CACHE_KEYS.profile(user.id)
  const cachedProfile = cache.get<{ tenant_id: string | null }>(profileCacheKey)

  let tenantId: string | null = null

  if (cachedProfile?.tenant_id) {
    tenantId = cachedProfile.tenant_id
  } else {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('[getCurrentTenantClient] Error fetching profile:', {
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code
      })
      return null
    }

    if (!profile || !profile.tenant_id) {
      return null
    }

    tenantId = profile.tenant_id
    // Cache profile
    cache.set(profileCacheKey, { tenant_id: tenantId })
  }

  if (!tenantId) {
    return null
  }

  // Try cache for tenant
  const tenantCacheKey = CACHE_KEYS.tenant(tenantId)
  const cachedTenant = cache.get<Tenant>(tenantCacheKey)
  
  if (cachedTenant) {
    return cachedTenant
  }

  // Fetch from database
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .maybeSingle()

  // Silently handle errors (expected if tenant doesn't exist or RLS blocks)
  if (tenantError && process.env.NODE_ENV === 'development') {
    console.warn('[getCurrentTenantClient] Tenant query error (handled gracefully):', tenantError.message)
  }

  if (!tenant) {
    return null
  }

  // Cache tenant
  cache.set(tenantCacheKey, tenant as Tenant)

  return tenant as Tenant
}

/**
 * Get tenant_id for current user (client-side, with cache)
 */
export async function getCurrentTenantIdClient(): Promise<string | null> {
  const tenant = await getCurrentTenantClient()
  return tenant?.id || null
}

