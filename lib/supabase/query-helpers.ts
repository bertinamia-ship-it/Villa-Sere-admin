/**
 * Query Helpers - Multi-Tenant + Multi-Property Support
 * 
 * Wrapper functions that automatically include tenant_id and property_id in all queries
 * Ensures data isolation per tenant/organization and property
 */

import { createClient } from '@/lib/supabase/server'
import { getCurrentTenantId } from '@/lib/utils/tenant'
import { getActivePropertyId } from '@/lib/utils/property'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Get tenant-scoped Supabase client
 * All queries through this client are automatically filtered by tenant_id
 */
export async function getTenantClient(): Promise<{
  client: SupabaseClient
  tenantId: string | null
}> {
  const client = await createClient()
  const tenantId = await getCurrentTenantId()
  return { client, tenantId }
}

/**
 * Select with automatic tenant filtering
 */
export async function selectWithTenant<T = any>(
  table: string,
  select: string = '*',
  additionalFilters?: Record<string, any>
): Promise<{ data: T[] | null; error: any }> {
  const { client, tenantId } = await getTenantClient()
  
  if (!tenantId) {
    return { data: null, error: { message: 'No tenant found' } }
  }

  let query = client
    .from(table)
    .select(select)
    .eq('tenant_id', tenantId)

  // Apply additional filters
  if (additionalFilters) {
    Object.entries(additionalFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value)
      }
    })
  }

  const result = await query
  return { data: result.data as T[] | null, error: result.error }
}

/**
 * Insert with automatic tenant_id
 */
export async function insertWithTenant<T = any>(
  table: string,
  data: Omit<T, 'tenant_id' | 'id' | 'created_at' | 'updated_at'>
): Promise<{ data: T | null; error: any }> {
  const { client, tenantId } = await getTenantClient()
  
  if (!tenantId) {
    return { data: null, error: { message: 'No tenant found' } }
  }

  const result = await client
    .from(table)
    .insert({ ...data, tenant_id: tenantId } as any)
    .select()
    .single()

  return result
}

/**
 * Insert multiple with automatic tenant_id
 */
export async function insertManyWithTenant<T = any>(
  table: string,
  data: Array<Omit<T, 'tenant_id' | 'id' | 'created_at' | 'updated_at'>>
): Promise<{ data: T[] | null; error: any }> {
  const { client, tenantId } = await getTenantClient()
  
  if (!tenantId) {
    return { data: null, error: { message: 'No tenant found' } }
  }

  const dataWithTenant = data.map(item => ({ ...item, tenant_id: tenantId }))
  
  const result = await client
    .from(table)
    .insert(dataWithTenant as any)
    .select()

  return result
}

/**
 * Update with automatic tenant filtering
 */
export async function updateWithTenant<T = any>(
  table: string,
  id: string,
  data: Partial<Omit<T, 'tenant_id' | 'id' | 'created_at'>>
): Promise<{ data: T | null; error: any }> {
  const { client, tenantId } = await getTenantClient()
  
  if (!tenantId) {
    return { data: null, error: { message: 'No tenant found' } }
  }

  const result = await client
    .from(table)
    .update(data as any)
    .eq('id', id)
    .eq('tenant_id', tenantId) // Ensure tenant isolation
    .select()
    .single()

  return result
}

/**
 * Delete with automatic tenant filtering
 */
export async function deleteWithTenant(
  table: string,
  id: string
): Promise<{ error: any }> {
  const { client, tenantId } = await getTenantClient()
  
  if (!tenantId) {
    return { error: { message: 'No tenant found' } }
  }

  const result = await client
    .from(table)
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId) // Ensure tenant isolation

  return result
}

/**
 * Upsert with automatic tenant_id
 */
export async function upsertWithTenant<T = any>(
  table: string,
  data: Omit<T, 'tenant_id' | 'created_at' | 'updated_at'>,
  conflictColumns: string[] = ['id']
): Promise<{ data: T | null; error: any }> {
  const { client, tenantId } = await getTenantClient()
  
  if (!tenantId) {
    return { data: null, error: { message: 'No tenant found' } }
  }

  const result = await client
    .from(table)
    .upsert({ ...data, tenant_id: tenantId } as any, {
      onConflict: conflictColumns.join(',')
    })
    .select()
    .single()

  return result
}

/**
 * Count with automatic tenant filtering
 */
export async function countWithTenant(
  table: string,
  additionalFilters?: Record<string, any>
): Promise<{ count: number | null; error: any }> {
  const { client, tenantId } = await getTenantClient()
  
  if (!tenantId) {
    return { count: null, error: { message: 'No tenant found' } }
  }
  
  let query = client
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)

  // Apply additional filters
  if (additionalFilters) {
    Object.entries(additionalFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value)
      }
    })
  }

  const result = await query
  return { count: result.count, error: result.error }
}

// ============================================================
// Property-scoped helpers (tenant_id + property_id)
// Use these for business tables: expenses, maintenance_tickets,
// bookings, purchase_items, inventory_items
// ============================================================

/**
 * Get property-scoped Supabase client
 * All queries through this client are automatically filtered by tenant_id + property_id
 */
export async function getPropertyClient(): Promise<{
  client: SupabaseClient
  tenantId: string | null
  propertyId: string | null
}> {
  const client = await createClient()
  const tenantId = await getCurrentTenantId()
  const propertyId = await getActivePropertyId()
  return { client, tenantId, propertyId }
}

/**
 * Select with automatic tenant + property filtering
 * Use for: expenses, maintenance_tickets, bookings, purchase_items, inventory_items
 */
export async function selectWithProperty<T = any>(
  table: string,
  select: string = '*',
  additionalFilters?: Record<string, any>
): Promise<{ data: T[] | null; error: any }> {
  const { client, tenantId, propertyId } = await getPropertyClient()
  
  if (!tenantId || !propertyId) {
    return { data: null, error: { message: 'No tenant or property found' } }
  }

  let query = client
    .from(table)
    .select(select)
    .eq('tenant_id', tenantId)
    .eq('property_id', propertyId)

  // Apply additional filters
  if (additionalFilters) {
    Object.entries(additionalFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value)
      }
    })
  }

  const result = await query
  return { data: result.data as T[] | null, error: result.error }
}

/**
 * Insert with automatic tenant_id + property_id
 * Use for: expenses, maintenance_tickets, bookings, purchase_items, inventory_items
 */
export async function insertWithProperty<T = any>(
  table: string,
  data: Omit<T, 'tenant_id' | 'property_id' | 'id' | 'created_at' | 'updated_at'>
): Promise<{ data: T | null; error: any }> {
  const { client, tenantId, propertyId } = await getPropertyClient()
  
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
 * Insert multiple with automatic tenant_id + property_id
 */
export async function insertManyWithProperty<T = any>(
  table: string,
  data: Array<Omit<T, 'tenant_id' | 'property_id' | 'id' | 'created_at' | 'updated_at'>>
): Promise<{ data: T[] | null; error: any }> {
  const { client, tenantId, propertyId } = await getPropertyClient()
  
  if (!tenantId || !propertyId) {
    return { data: null, error: { message: 'No tenant or property found' } }
  }

  const dataWithIds = data.map(item => ({ ...item, tenant_id: tenantId, property_id: propertyId }))
  
  const result = await client
    .from(table)
    .insert(dataWithIds as any)
    .select()

  return result
}

/**
 * Update with automatic tenant + property filtering
 * Use for: expenses, maintenance_tickets, bookings, purchase_items, inventory_items
 */
export async function updateWithProperty<T = any>(
  table: string,
  id: string,
  data: Partial<Omit<T, 'tenant_id' | 'property_id' | 'id' | 'created_at'>>
): Promise<{ data: T | null; error: any }> {
  const { client, tenantId, propertyId } = await getPropertyClient()
  
  if (!tenantId || !propertyId) {
    return { data: null, error: { message: 'No tenant or property found' } }
  }

  const result = await client
    .from(table)
    .update(data as any)
    .eq('id', id)
    .eq('tenant_id', tenantId) // Ensure tenant isolation
    .eq('property_id', propertyId) // Ensure property isolation
    .select()
    .single()

  return result
}

/**
 * Delete with automatic tenant + property filtering
 * Use for: expenses, maintenance_tickets, bookings, purchase_items, inventory_items
 */
export async function deleteWithProperty(
  table: string,
  id: string
): Promise<{ error: any }> {
  const { client, tenantId, propertyId } = await getPropertyClient()
  
  if (!tenantId || !propertyId) {
    return { error: { message: 'No tenant or property found' } }
  }

  const result = await client
    .from(table)
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId) // Ensure tenant isolation
    .eq('property_id', propertyId) // Ensure property isolation

  return result
}

/**
 * Upsert with automatic tenant_id + property_id
 * Use for: expenses, maintenance_tickets, bookings, purchase_items, inventory_items
 */
export async function upsertWithProperty<T = any>(
  table: string,
  data: Omit<T, 'tenant_id' | 'property_id' | 'created_at' | 'updated_at'>,
  conflictColumns: string[] = ['id']
): Promise<{ data: T | null; error: any }> {
  const { client, tenantId, propertyId } = await getPropertyClient()
  
  if (!tenantId || !propertyId) {
    return { data: null, error: { message: 'No tenant or property found' } }
  }

  const result = await client
    .from(table)
    .upsert({ ...data, tenant_id: tenantId, property_id: propertyId } as any, {
      onConflict: conflictColumns.join(',')
    })
    .select()
    .single()

  return result
}

/**
 * Count with automatic tenant + property filtering
 * Use for: expenses, maintenance_tickets, bookings, purchase_items, inventory_items
 */
export async function countWithProperty(
  table: string,
  additionalFilters?: Record<string, any>
): Promise<{ count: number | null; error: any }> {
  const { client, tenantId, propertyId } = await getPropertyClient()
  
  if (!tenantId || !propertyId) {
    return { count: null, error: { message: 'No tenant or property found' } }
  }
  
  let query = client
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('property_id', propertyId)

  // Apply additional filters
  if (additionalFilters) {
    Object.entries(additionalFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value)
      }
    })
  }

  const result = await query
  return { count: result.count, error: result.error }
}

