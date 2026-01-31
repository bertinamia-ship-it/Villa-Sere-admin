/**
 * Property Utilities
 * Helper functions for multi-property operations
 */

import { createClient } from '@/lib/supabase/server'
import { getCurrentTenantId } from './tenant'

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
 * Get all properties for the current user's tenant
 */
export async function getUserProperties(): Promise<Property[]> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return []
  }

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name')

  if (error) {
    console.error('Error fetching properties:', error)
    return []
  }

  return (data || []) as Property[]
}

/**
 * Get preferred property ID from user's profile
 */
export async function getPreferredPropertyId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('preferred_property_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('[getPreferredPropertyId] Error fetching profile:', {
      message: profileError.message,
      details: profileError.details,
      hint: profileError.hint,
      code: profileError.code
    })
    return null
  }

  return profile?.preferred_property_id || null
}

/**
 * Set preferred property ID in user's profile
 */
export async function setPreferredPropertyId(propertyId: string | null): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return false
  }

  const { error } = await supabase
    .from('profiles')
    .update({ preferred_property_id: propertyId })
    .eq('id', user.id)

  if (error) {
    console.error('Error setting preferred property:', error)
    return false
  }

  return true
}

/**
 * Get active property ID
 * Fallback: preferred_property_id → first property → null
 */
export async function getActivePropertyId(): Promise<string | null> {
  // Try preferred property first
  const preferredId = await getPreferredPropertyId()
  if (preferredId) {
    return preferredId
  }

  // Fallback to first property
  const properties = await getUserProperties()
  if (properties.length > 0) {
    return properties[0].id
  }

  return null
}

/**
 * Get active property object
 */
export async function getActiveProperty(): Promise<Property | null> {
  const propertyId = await getActivePropertyId()
  if (!propertyId) {
    return null
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single()

  if (error || !data) {
    return null
  }

  return data as Property
}

/**
 * Create a new property
 */
export async function createProperty(data: {
  name: string
  location?: string
  photo_url?: string
}): Promise<Property | null> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return null
  }

  const { data: property, error } = await supabase
    .from('properties')
    .insert({
      tenant_id: tenantId,
      name: data.name,
      location: data.location || null,
      photo_url: data.photo_url || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating property:', error)
    return null
  }

  return property as Property
}

