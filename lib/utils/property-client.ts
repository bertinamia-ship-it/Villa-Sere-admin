/**
 * Property Utilities (Client-side)
 * Helper functions for multi-property operations in client components
 */

import { createClient } from '@/lib/supabase/client'
import { cache, CACHE_KEYS } from './cache'

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

  // Fallback: get from profile (with cache)
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Try cache first
  const cacheKey = CACHE_KEYS.profile(user.id)
  const cachedProfile = cache.get<{ preferred_property_id: string | null; tenant_id: string | null }>(cacheKey)
  
  if (cachedProfile) {
    if (cachedProfile.preferred_property_id) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('activePropertyId', cachedProfile.preferred_property_id)
      }
      return cachedProfile.preferred_property_id
    }
    
    // Fallback: get first property from cache
    if (cachedProfile.tenant_id) {
      const propertiesCacheKey = CACHE_KEYS.properties(cachedProfile.tenant_id)
      const cachedProperties = cache.get<Property[]>(propertiesCacheKey)
      
      if (cachedProperties && cachedProperties.length > 0) {
        const firstId = cachedProperties[0].id
        if (typeof window !== 'undefined') {
          localStorage.setItem('activePropertyId', firstId)
        }
        return firstId
      }
    }
  }

  // Fetch from database
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('preferred_property_id, tenant_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    // Only log in dev
    if (process.env.NODE_ENV === 'development') {
      console.error('[getActivePropertyIdClient] Error fetching profile:', {
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code
      })
    }
    return null
  }

  // Cache profile
  if (profile) {
    cache.set(cacheKey, { preferred_property_id: profile.preferred_property_id, tenant_id: profile.tenant_id })
  }

  if (profile?.preferred_property_id) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('activePropertyId', profile.preferred_property_id)
    }
    return profile.preferred_property_id
  }

  // Fallback: get first property
  if (profile?.tenant_id) {
    // Try cache for properties
    const propertiesCacheKey = CACHE_KEYS.properties(profile.tenant_id)
    const cachedProperties = cache.get<Property[]>(propertiesCacheKey)
    
    if (cachedProperties && cachedProperties.length > 0) {
      const firstId = cachedProperties[0].id
      if (typeof window !== 'undefined') {
        localStorage.setItem('activePropertyId', firstId)
      }
      return firstId
    }

    // Fetch from database
    const { data: properties } = await supabase
      .from('properties')
      .select('id, name, location')
      .eq('tenant_id', profile.tenant_id)
      .order('name')
      .limit(1)

    if (properties && properties.length > 0) {
      const firstId = properties[0].id
      // Cache the property
      cache.set(CACHE_KEYS.property(firstId), { id: firstId, name: properties[0].name, location: properties[0].location })
      if (typeof window !== 'undefined') {
        localStorage.setItem('activePropertyId', firstId)
      }
      return firstId
    }
  }

  return null
}

/**
 * Get active property object (with cache)
 */
export async function getActiveProperty(): Promise<Property | null> {
  const propertyId = await getActivePropertyId()
  if (!propertyId) {
    return null
  }

  // Try cache first
  const cacheKey = CACHE_KEYS.property(propertyId)
  const cached = cache.get<Property>(cacheKey)
  
  if (cached) {
    return cached
  }

  // Fetch from database
  const supabase = createClient()
  const { data: property, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .maybeSingle()

  if (error) {
    // Only log in dev
    if (process.env.NODE_ENV === 'development') {
      console.error('[getActiveProperty] Error fetching property:', error)
    }
    return null
  }

  if (property) {
    // Cache the property
    cache.set(cacheKey, property)
    return property
  }

  return null
}
