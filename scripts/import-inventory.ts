#!/usr/bin/env node
/**
 * Import inventory, purchase items, and maintenance tickets from Excel file
 * Usage: npm run import:inventory
 */

import * as XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials')
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Excel file path
const EXCEL_FILE_PATH = path.resolve(__dirname, '../data/inventory_villa_serena.xlsx')

interface ImportStats {
  inserted: number
  updated: number
  skipped: number
  errors: number
}

/**
 * Parse Sheet 1: DINNER WARE INVENTOR → inventory_items
 */
async function importInventoryItems(worksheet: XLSX.WorkSheet): Promise<ImportStats> {
  const stats: ImportStats = { inserted: 0, updated: 0, skipped: 0, errors: 0 }
  
  console.log('\n📦 Importing Inventory Items...')
  
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
  
  for (const row of rows as any[]) {
    try {
      const name = row['ITEM']?.toString().trim()
      const quantity = parseInt(row['AMOUNT']?.toString() || '0')
      const location = row['LOCATION']?.toString().trim() || null
      
      if (!name || quantity === 0) {
        stats.skipped++
        continue
      }
      
      // Check if item already exists to avoid duplicates
      const { data: existing } = await supabase
        .from('inventory_items')
        .select('id')
        .eq('name', name)
        .eq('location', location || '')
        .eq('category', 'Dinnerware')
        .maybeSingle()
      
      if (existing) {
        stats.skipped++
        continue
      }
      
      // Insert new item
      const { data, error } = await supabase
        .from('inventory_items')
        .insert({
          name,
          quantity,
          location,
          category: 'Dinnerware',
          min_threshold: Math.max(1, Math.floor(quantity * 0.2)),
        })
        .select()
      
      if (error) {
        console.error(`  ⚠️  Error importing "${name}":`, error.message)
        stats.errors++
      } else {
        stats.inserted++
      }
    } catch (err) {
      stats.errors++
      console.error(`  ⚠️  Unexpected error:`, err)
    }
  }
  
  console.log(`  ✓ Inventory: ${stats.inserted} inserted, ${stats.skipped} skipped, ${stats.errors} errors`)
  return stats
}

/**
 * Parse Sheet 2: TOBUY → purchase_items
 */
async function importPurchaseItems(worksheet: XLSX.WorkSheet): Promise<ImportStats> {
  const stats: ImportStats = { inserted: 0, updated: 0, skipped: 0, errors: 0 }
  
  console.log('\n🛒 Importing To-Buy Items...')
  
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][]
  
  let currentArea: string | null = null
  
  for (let i = 0; i < rows.length; i++) {
    try {
      const row = rows[i]
      
      // Skip empty rows
      if (!row || row.length === 0 || !row[0]) {
        continue
      }
      
      const firstCell = row[0]?.toString().trim().toUpperCase()
      
      // Detect area headers (MASTER, KITCHEN, etc.)
      if (firstCell && row.length === 1 && !firstCell.match(/^\d/)) {
        currentArea = firstCell
        continue
      }
      
      // Skip total rows
      if (firstCell.includes('TOTAL')) {
        continue
      }
      
      // Parse item row
      const item = row[0]?.toString().trim()
      const quantity = parseInt(row[1]?.toString() || '1')
      const estCost = parseFloat(row[2]?.toString().replace(/[^\d.]/g, '') || '0')
      const link = row[3]?.toString().trim() || null
      
      if (!item || quantity === 0) {
        stats.skipped++
        continue
      }
      
      // Check if item already exists to avoid duplicates
      const { data: existing } = await supabase
        .from('purchase_items')
        .select('id')
        .eq('area', currentArea || '')
        .eq('item', item)
        .maybeSingle()
      
      if (existing) {
        stats.skipped++
        continue
      }
      
      // Insert new purchase item
      const { data, error } = await supabase
        .from('purchase_items')
        .insert({
          area: currentArea,
          item,
          quantity,
          est_cost: estCost > 0 ? estCost : null,
          link: link && link.startsWith('http') ? link : null,
          status: 'to_buy',
        })
        .select()
      
      if (error) {
        console.error(`  ⚠️  Error importing "${item}":`, error.message)
        stats.errors++
      } else {
        stats.inserted++
      }
    } catch (err) {
      stats.errors++
      console.error(`  ⚠️  Unexpected error at row ${i}:`, err)
    }
  }
  
  console.log(`  ✓ To-Buy: ${stats.inserted} inserted, ${stats.skipped} skipped, ${stats.errors} errors`)
  return stats
}

/**
 * Parse Sheet 3: CAMBIOS Y REPARACIONES → maintenance_tickets
 */
async function importMaintenanceTickets(worksheet: XLSX.WorkSheet): Promise<ImportStats> {
  const stats: ImportStats = { inserted: 0, updated: 0, skipped: 0, errors: 0 }
  
  console.log('\n🔧 Importing Maintenance Tickets...')
  
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][]
  
  let currentRoom: string | null = null
  
  for (let i = 0; i < rows.length; i++) {
    try {
      const row = rows[i]
      
      // Skip empty rows
      if (!row || row.length === 0 || !row[0]) {
        continue
      }
      
      const firstCell = row[0]?.toString().trim()
      
      // Detect room headers (single column with text)
      if (firstCell && row.length === 1 && !firstCell.match(/^\d/)) {
        currentRoom = firstCell
        continue
      }
      
      // Parse ticket row
      const title = row[0]?.toString().trim()
      const description = row[1]?.toString().trim() || null
      
      if (!title) {
        stats.skipped++
        continue
      }
      
      // Check if ticket already exists (avoid duplicates)
      const { data: existing } = await supabase
        .from('maintenance_tickets')
        .select('id')
        .eq('title', title)
        .eq('room', currentRoom || 'General')
        .maybeSingle()
      
      if (existing) {
        stats.skipped++
        continue
      }
      
      // Insert new ticket
      const { error } = await supabase
        .from('maintenance_tickets')
        .insert({
          title,
          description,
          room: currentRoom || 'General',
          status: 'open',
          priority: 'medium',
        })
      
      if (error) {
        console.error(`  ⚠️  Error importing "${title}":`, error.message)
        stats.errors++
      } else {
        stats.inserted++
      }
    } catch (err) {
      stats.errors++
      console.error(`  ⚠️  Unexpected error at row ${i}:`, err)
    }
  }
  
  console.log(`  ✓ Maintenance: ${stats.inserted} inserted, ${stats.skipped} skipped (duplicates), ${stats.errors} errors`)
  return stats
}

/**
 * Main import function
 */
async function main() {
  console.log('🚀 Starting Excel Import...')
  console.log(`📄 File: ${EXCEL_FILE_PATH}`)
  
  // Check if file exists
  if (!fs.existsSync(EXCEL_FILE_PATH)) {
    console.error(`❌ Error: Excel file not found at ${EXCEL_FILE_PATH}`)
    process.exit(1)
  }
  
  // Read Excel file
  console.log('\n📖 Reading Excel file...')
  const workbook = XLSX.readFile(EXCEL_FILE_PATH)
  
  console.log(`  Found ${workbook.SheetNames.length} sheets:`, workbook.SheetNames.join(', '))
  
  // Import each sheet
  const sheet1 = workbook.Sheets['DINNER WARE INVENTOR']
  const sheet2 = workbook.Sheets['TOBUY']
  const sheet3 = workbook.Sheets['CAMBIOS Y REPARACIONES']
  
  if (!sheet1) console.warn('  ⚠️  Sheet "DINNER WARE INVENTOR" not found')
  if (!sheet2) console.warn('  ⚠️  Sheet "TOBUY" not found')
  if (!sheet3) console.warn('  ⚠️  Sheet "CAMBIOS Y REPARACIONES" not found')
  
  const results = {
    inventory: sheet1 ? await importInventoryItems(sheet1) : null,
    purchases: sheet2 ? await importPurchaseItems(sheet2) : null,
    maintenance: sheet3 ? await importMaintenanceTickets(sheet3) : null,
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('✅ Import Complete!')
  console.log('='.repeat(60))
  
  if (results.inventory) {
    console.log(`📦 Inventory Items: ${results.inventory.inserted} inserted`)
  }
  if (results.purchases) {
    console.log(`🛒 Purchase Items: ${results.purchases.inserted} inserted`)
  }
  if (results.maintenance) {
    console.log(`🔧 Maintenance Tickets: ${results.maintenance.inserted} inserted`)
  }
  
  const totalErrors = (results.inventory?.errors || 0) + 
                       (results.purchases?.errors || 0) + 
                       (results.maintenance?.errors || 0)
  
  if (totalErrors > 0) {
    console.log(`\n⚠️  Total errors: ${totalErrors}`)
  }
  
  console.log('\n💡 View imported data in the admin dashboard at http://localhost:3000')
}

main().catch(err => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
