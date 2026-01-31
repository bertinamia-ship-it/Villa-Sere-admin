/**
 * Property Utilities (Client-side)
 * Helper functions for multi-property operations in client components
 */

import { createClient } from '@/lib/supabase/client'

export interface Property {
  id: string
  tenant_id: string
  name: string
  location: string | null
  photo_url: string | null
  settings: Record<string, any>
  created_at: string
  updated_at: string
}

/**
 * Get active property ID from localStorage or fetch from profile
 */
export async function getActivePropertyId(): Promise<string | null> {
  // Try localStorage first (fast)
  const cachedId = typeof window !== 'undefined' ? localStorage.getItem('activePropertyId') : null
  if (cachedId) {
    return cachedId
  }

  // Fallback: get from profile
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('preferred_property_id, tenant_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('[getActivePropertyIdClient] Error fetching profile:', {
      message: profileError.message,
      details: profileError.details,
      hint: profileError.hint,
      code: profileError.code
    })
    return null
  }

  if (profile?.preferred_property_id) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('activePropertyId', profile.preferred_property_id)
    }
    return profile.preferred_property_id
  }

  // Fallback: get first property
  if (profile?.tenant_id) {
    const { data: properties } = await supabase
      .from('properties')
      .select('id')
      .eq('tenant_id', profile.tenant_id)
      .order('name')
      .limit(1)

    if (properties && properties.length > 0) {
      const firstId = properties[0].id
      if (typeof window !== 'undefined') {
        localStorage.setItem('activePropertyId', firstId)
      }
      return firstId
    }
  }

  return null
}

