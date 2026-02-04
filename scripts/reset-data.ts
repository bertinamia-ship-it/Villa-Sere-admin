#!/usr/bin/env tsx
/**
 * Reset Data Script - Villa Sere Admin
 * 
 * ⚠️  DANGER: Elimina TODOS los datos de las tablas de negocio
 * 
 * Tablas eliminadas (en orden):
 * 1. expenses (FK: vendors, maintenance_tickets)
 * 2. maintenance_tickets (FK: vendors)
 * 3. bookings (FK: auth.users - no bloquea)
 * 4. purchase_items (FK: auth.users - no bloquea)
 * 5. inventory_items (FK: auth.users - no bloquea)
 * 6. vendors (FK: auth.users - no bloquea)
 * 
 * Storage limpiado:
 * - attachments/receipts/
 * - attachments/maintenance/
 * - attachments/inventory/
 * 
 * NO se elimina:
 * - profiles (usuarios)
 * - auth.users (cuentas)
 * - Schema, RLS, triggers, funciones
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as readline from 'readline'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing required environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  console.error('Add SUPABASE_SERVICE_ROLE_KEY to .env.local')
  console.error('Get it from: Supabase Dashboard > Settings > API > service_role key')
  process.exit(1)
}

// Create admin client with service role key
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Create readline interface for confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

async function verifyAccess(): Promise<boolean> {
  console.log('\n🔐 Verifying service role access...')
  
  const { error } = await supabaseAdmin.from('profiles').select('id').limit(1)
  
  if (error) {
    console.error('❌ Error: Invalid service role key or no access')
    console.error('Error:', error.message)
    return false
  }
  
  console.log('✅ Service role key verified')
  return true
}

async function getConfirmation(): Promise<boolean> {
  console.log('\n⚠️  ⚠️  ⚠️  WARNING: DATA RESET ⚠️  ⚠️  ⚠️')
  console.log('\nThis will DELETE ALL DATA from:')
  console.log('  📊 expenses')
  console.log('  🔧 maintenance_tickets')
  console.log('  📅 bookings')
  console.log('  🛒 purchase_items')
  console.log('  📦 inventory_items')
  console.log('  🏢 vendors')
  console.log('  📁 All files in storage bucket "attachments"')
  console.log('\nThis will NOT delete:')
  console.log('  ✅ User accounts (profiles, auth.users)')
  console.log('  ✅ Database schema')
  console.log('  ✅ RLS policies')
  console.log('\n⚠️  This action CANNOT be undone! ⚠️')
  
  const confirmation = await question('\nType "RESET" (all caps) to confirm: ')
  
  if (confirmation !== 'RESET') {
    console.log('❌ Confirmation failed. Reset cancelled.')
    return false
  }
  
  const doubleCheck = await question('\nAre you absolutely sure? Type "YES" to proceed: ')
  
  if (doubleCheck !== 'YES') {
    console.log('❌ Double confirmation failed. Reset cancelled.')
    return false
  }
  
  return true
}

async function deleteTableData(tableName: string): Promise<number> {
  console.log(`  🗑️  Deleting from ${tableName}...`)
  
  // Count rows before deletion
  const { count: beforeCount } = await supabaseAdmin
    .from(tableName)
    .select('*', { count: 'exact', head: true })
  
  const rowCount = beforeCount || 0
  
  if (rowCount === 0) {
    console.log(`  ✅ ${tableName}: Already empty`)
    return 0
  }
  
  // Delete all rows using a condition that's always false (deletes all)
  const { error } = await supabaseAdmin
    .from(tableName)
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
  
  if (error) {
    console.error(`  ❌ Error deleting ${tableName}:`, error.message)
    throw error
  }
  
  console.log(`  ✅ ${tableName}: Deleted ${rowCount} row(s)`)
  return rowCount
}

async function cleanStorageBucket(): Promise<void> {
  console.log('\n🗑️  Cleaning storage bucket "attachments"...')
  
  const folders = ['receipts', 'maintenance', 'inventory']
  let totalDeleted = 0
  
  for (const folder of folders) {
    try {
      // List all files in folder
      const { data: files, error: listError } = await supabaseAdmin.storage
        .from('attachments')
        .list(folder)
      
      if (listError) {
        // Folder might not exist, that's ok
        if (listError.message.includes('not found') || listError.message.includes('does not exist')) {
          console.log(`  ✅ ${folder}/: Folder doesn't exist (skipping)`)
        } else {
          console.log(`  ⚠️  Could not list files in ${folder}/:`, listError.message)
        }
        continue
      }
      
      if (!files || files.length === 0) {
        console.log(`  ✅ ${folder}/: No files to delete`)
        continue
      }
      
      // Delete all files
      const filePaths = files.map(file => `${folder}/${file.name}`)
      const { error: deleteError } = await supabaseAdmin.storage
        .from('attachments')
        .remove(filePaths)
      
      if (deleteError) {
        console.log(`  ⚠️  Error deleting files in ${folder}/:`, deleteError.message)
      } else {
        console.log(`  ✅ ${folder}/: Deleted ${files.length} file(s)`)
        totalDeleted += files.length
      }
    } catch (error) {
      console.log(`  ⚠️  Error processing ${folder}/:`, error)
    }
  }
  
  console.log(`\n✅ Storage cleanup complete: ${totalDeleted} file(s) deleted`)
}

async function resetDatabase(): Promise<void> {
  console.log('\n🗑️  Starting database reset...')
  console.log('Deleting tables in order (respecting foreign keys)...\n')
  
  // Order matters due to foreign key constraints
  // See TABLES_ANALYSIS.md for detailed dependency graph
  const tables = [
    { name: 'expenses', reason: 'FK: vendors, maintenance_tickets' },
    { name: 'maintenance_tickets', reason: 'FK: vendors' },
    { name: 'bookings', reason: 'FK: auth.users (independent)' },
    { name: 'purchase_items', reason: 'FK: auth.users (independent)' },
    { name: 'inventory_items', reason: 'FK: auth.users (independent)' },
    { name: 'vendors', reason: 'FK: auth.users (no active references)' }
  ]
  
  let totalDeleted = 0
  
  for (const table of tables) {
    try {
      const count = await deleteTableData(table.name)
      totalDeleted += count
    } catch (error) {
      console.error(`❌ Failed to delete ${table.name}`)
      throw error
    }
  }
  
  console.log(`\n✅ Database reset complete (${totalDeleted} total rows deleted)`)
}

async function main() {
  console.log('========================================')
  console.log('🏭 Reset Data - Villa Sere Admin')
  console.log('========================================\n')
  
  try {
    // Step 1: Verify access
    const hasAccess = await verifyAccess()
    if (!hasAccess) {
      process.exit(1)
    }
    
    // Step 2: Get confirmation
    const confirmed = await getConfirmation()
    if (!confirmed) {
      rl.close()
      process.exit(0)
    }
    
    // Step 3: Reset database
    await resetDatabase()
    
    // Step 4: Clean storage
    await cleanStorageBucket()
    
    console.log('\n========================================')
    console.log('✅ Reset Complete!')
    console.log('========================================')
    console.log('\nAll data has been deleted.')
    console.log('User accounts and schema remain intact.')
    console.log('\nRun "npm run seed:data" to add sample data.')
    
  } catch (error) {
    console.error('\n❌ Error during reset:', error)
    process.exit(1)
  } finally {
    rl.close()
  }
}

// Run the script
main()


