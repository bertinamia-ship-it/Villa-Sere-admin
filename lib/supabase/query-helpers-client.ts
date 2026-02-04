/**
 * Query Helpers - Client Components Version
 * 
 * Wrapper functions for client components that automatically include tenant_id and property_id
 * Uses @/lib/supabase/client instead of server client
 */

import { createClient } from '@/lib/supabase/client'
import { getActivePropertyId } from '@/lib/utils/property-client'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Get tenant_id for current user (client-side)
 */
async function getCurrentTenantIdClient(): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .maybeSingle()

  return profile?.tenant_id || null
}

/**
 * Get property-scoped Supabase client (client-side)
 */
export async function getPropertyClientClient(): Promise<{
  client: SupabaseClient
  tenantId: string | null
  propertyId: string | null
}> {
  const client = createClient()
  const tenantId = await getCurrentTenantIdClient()
  const propertyId = await getActivePropertyId()
  return { client, tenantId, propertyId }
}

/**
 * Insert with automatic tenant_id + property_id (client-side)
 */
export async function insertWithPropertyClient<T = any>(
  table: string,
  data: Omit<T, 'tenant_id' | 'property_id' | 'id' | 'created_at' | 'updated_at'>
): Promise<{ data: T | null; error: any }> {
  const { client, tenantId, propertyId } = await getPropertyClientClient()
  
  if (!tenantId || !propertyId) {
    return { data: null, error: { message: 'No tenant or property found' } }
  }

  const result = await client
    .from(table)
    .insert({ ...data, tenant_id: tenantId, property_id: propertyId } as any)
    .select()
    .single()

  return result
}

/**
 * Update with automatic tenant + property filtering (client-side)
 */
export async function updateWithPropertyClient<T = any>(
  table: string,
  id: string,
  data: Partial<Omit<T, 'tenant_id' | 'property_id' | 'id' | 'created_at'>>
): Promise<{ data: T | null; error: any }> {
  const { client, tenantId, propertyId } = await getPropertyClientClient()
  
  if (!tenantId || !propertyId) {
    return { data: null, error: { message: 'No tenant or property found' } }
  }

  const result = await client
    .from(table)
    .update(data as any)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .eq('property_id', propertyId)
    .select()
    .single()

  return result
}

/**
 * Delete with automatic tenant + property filtering (client-side)
 */
export async function deleteWithPropertyClient<T = any>(
  table: string,
  id: string
): Promise<{ data: T | null; error: any }> {
  const { client, tenantId, propertyId } = await getPropertyClientClient()
  
  if (!tenantId || !propertyId) {
    return { data: null, error: { message: 'No tenant or property found' } }
  }

  const result = await client
    .from(table)
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .eq('property_id', propertyId)
    .select()
    .single()

  return result
}

