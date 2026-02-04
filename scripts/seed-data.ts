#!/usr/bin/env tsx
/**
 * Seed Data Script - Villa Sere Admin
 * 
 * Creates sample data for testing and development
 * 
 * What it creates:
 * - Sample vendors
 * - Sample inventory items
 * - Sample maintenance tickets
 * - Sample bookings
 * - Sample expenses
 * - Sample purchase items
 * 
 * Requirements:
 * - Must be run after factory reset (or on empty database)
 * - Uses service role key for admin operations
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing required environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create admin client with service role key
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function getFirstUserId(): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .limit(1)
    .single()
  
  if (error || !data) {
    console.log('⚠️  No users found. Seed will use null for created_by')
    return null
  }
  
  return data.id
}

async function seedVendors(userId: string | null) {
  console.log('\n📦 Seeding vendors...')
  
  const vendors = [
    { company_name: 'Cabo Cleaning Services', specialty: 'Housekeeping', phone: '+52 624 123 4567', email: 'info@cabocleaning.com' },
    { company_name: 'Pacific Pool Maintenance', specialty: 'Pool Service', phone: '+52 624 234 5678', whatsapp: '+52 624 234 5678' },
    { company_name: 'Baja Gardeners', specialty: 'Landscaping', phone: '+52 624 345 6789', email: 'contact@bajagardeners.mx' },
    { company_name: 'Cabo Electric', specialty: 'Electrical', phone: '+52 624 456 7890' },
    { company_name: 'Villa Supplies Co', specialty: 'General Supplies', email: 'orders@villasupplies.com' }
  ]
  
  const { data, error } = await supabaseAdmin
    .from('vendors')
    .insert(vendors.map(v => ({ ...v, created_by: userId })))
    .select()
  
  if (error) {
    console.error('❌ Error seeding vendors:', error.message)
    throw error
  }
  
  console.log(`✅ Created ${data.length} vendor(s)`)
  return data
}

async function seedInventory(userId: string | null) {
  console.log('\n📦 Seeding inventory items...')
  
  const items = [
    { name: 'Bath Towels', category: 'Linens', location: 'Master Bedroom', quantity: 12, min_threshold: 8 },
    { name: 'Beach Towels', category: 'Linens', location: 'Storage', quantity: 8, min_threshold: 6 },
    { name: 'Coffee Maker', category: 'Appliances', location: 'Kitchen', quantity: 1, min_threshold: 1 },
    { name: 'Dish Soap', category: 'Cleaning Supplies', location: 'Kitchen', quantity: 3, min_threshold: 2 },
    { name: 'Toilet Paper', category: 'Bathroom Supplies', location: 'Storage', quantity: 24, min_threshold: 12 },
    { name: 'Pool Towels', category: 'Linens', location: 'Pool Area', quantity: 6, min_threshold: 4 },
    { name: 'Trash Bags', category: 'Cleaning Supplies', location: 'Kitchen', quantity: 50, min_threshold: 20 },
    { name: 'Shampoo', category: 'Bathroom Supplies', location: 'Master Bathroom', quantity: 4, min_threshold: 2 },
    { name: 'Paper Towels', category: 'Cleaning Supplies', location: 'Kitchen', quantity: 8, min_threshold: 4 },
    { name: 'Hand Soap', category: 'Bathroom Supplies', location: 'Guest Bathroom', quantity: 2, min_threshold: 1 }
  ]
  
  const { data, error } = await supabaseAdmin
    .from('inventory_items')
    .insert(items.map(item => ({ ...item, created_by: userId })))
    .select()
  
  if (error) {
    console.error('❌ Error seeding inventory:', error.message)
    throw error
  }
  
  console.log(`✅ Created ${data.length} inventory item(s)`)
  return data
}

async function seedMaintenanceTickets(vendors: any[], userId: string | null) {
  console.log('\n🔧 Seeding maintenance tickets...')
  
  const tickets = [
    { title: 'Pool cleaning needed', room: 'Pool Area', priority: 'medium', status: 'open', date: new Date().toISOString().split('T')[0] },
    { title: 'AC unit not cooling', room: 'Master Bedroom', priority: 'urgent', status: 'in_progress', vendor_id: vendors[3]?.id, date: new Date().toISOString().split('T')[0] },
    { title: 'Garden maintenance', room: 'Garden', priority: 'low', status: 'open', vendor_id: vendors[2]?.id, date: new Date().toISOString().split('T')[0] },
    { title: 'Leaky faucet', room: 'Guest Bathroom', priority: 'high', status: 'open', date: new Date().toISOString().split('T')[0] }
  ]
  
  const { data, error } = await supabaseAdmin
    .from('maintenance_tickets')
    .insert(tickets.map(ticket => ({ ...ticket, created_by: userId })))
    .select()
  
  if (error) {
    console.error('❌ Error seeding maintenance tickets:', error.message)
    throw error
  }
  
  console.log(`✅ Created ${data.length} maintenance ticket(s)`)
  return data
}

async function seedBookings(userId: string | null) {
  console.log('\n📅 Seeding bookings...')
  
  const today = new Date()
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  const twoWeeks = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
  const threeWeeks = new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000)
  
  const bookings = [
    {
      guest_name: 'John & Sarah Smith',
      platform: 'Airbnb',
      check_in: nextWeek.toISOString().split('T')[0],
      check_out: new Date(nextWeek.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      nightly_rate: 250,
      total_amount: 1000,
      cleaning_fee: 150,
      status: 'confirmed'
    },
    {
      guest_name: 'Maria Rodriguez',
      platform: 'Booking.com',
      check_in: twoWeeks.toISOString().split('T')[0],
      check_out: new Date(twoWeeks.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      nightly_rate: 275,
      total_amount: 825,
      cleaning_fee: 150,
      status: 'confirmed'
    },
    {
      guest_name: 'Corporate Retreat',
      platform: 'Direct',
      check_in: threeWeeks.toISOString().split('T')[0],
      check_out: new Date(threeWeeks.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      nightly_rate: 300,
      total_amount: 1500,
      cleaning_fee: 200,
      status: 'confirmed'
    }
  ]
  
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .insert(bookings.map(booking => ({ ...booking, created_by: userId })))
    .select()
  
  if (error) {
    console.error('❌ Error seeding bookings:', error.message)
    throw error
  }
  
  console.log(`✅ Created ${data.length} booking(s)`)
  return data
}

async function seedExpenses(vendors: any[], tickets: any[], userId: string | null) {
  console.log('\n💰 Seeding expenses...')
  
  const today = new Date()
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  
  const expenses = [
    { date: lastWeek.toISOString().split('T')[0], amount: 150, category: 'Cleaning', vendor_id: vendors[0]?.id, notes: 'Weekly deep clean' },
    { date: yesterday.toISOString().split('T')[0], amount: 85, category: 'Maintenance', ticket_id: tickets[1]?.id, notes: 'AC repair parts' },
    { date: today.toISOString().split('T')[0], amount: 45, category: 'Supplies', vendor_id: vendors[4]?.id, notes: 'Cleaning supplies' },
    { date: today.toISOString().split('T')[0], amount: 120, category: 'Pool Service', vendor_id: vendors[1]?.id, notes: 'Monthly pool maintenance' }
  ]
  
  const { data, error } = await supabaseAdmin
    .from('expenses')
    .insert(expenses.map(expense => ({ ...expense, created_by: userId })))
    .select()
  
  if (error) {
    console.error('❌ Error seeding expenses:', error.message)
    throw error
  }
  
  console.log(`✅ Created ${data.length} expense(s)`)
  return data
}

async function seedPurchaseItems(userId: string | null) {
  console.log('\n🛒 Seeding purchase items...')
  
  const items = [
    { area: 'Kitchen', item: 'New coffee maker', quantity: 1, est_cost: 89.99, status: 'to_buy' },
    { area: 'Bathroom', item: 'Bath towels (set of 6)', quantity: 2, est_cost: 45.00, status: 'to_buy' },
    { area: 'Pool', item: 'Pool cleaning supplies', quantity: 1, est_cost: 75.00, status: 'ordered' },
    { area: 'Garden', item: 'Garden tools set', quantity: 1, est_cost: 120.00, status: 'to_buy' }
  ]
  
  const { data, error } = await supabaseAdmin
    .from('purchase_items')
    .insert(items.map(item => ({ ...item, created_by: userId })))
    .select()
  
  if (error) {
    console.error('❌ Error seeding purchase items:', error.message)
    throw error
  }
  
  console.log(`✅ Created ${data.length} purchase item(s)`)
  return data
}

async function main() {
  console.log('========================================')
  console.log('🌱 Seed Data - Villa Sere Admin')
  console.log('========================================\n')
  
  try {
    // Get first user ID for created_by fields
    const userId = await getFirstUserId()
    
    // Seed in order (respecting dependencies)
    const vendors = await seedVendors(userId)
    const inventory = await seedInventory(userId)
    const tickets = await seedMaintenanceTickets(vendors, userId)
    const bookings = await seedBookings(userId)
    const expenses = await seedExpenses(vendors, tickets, userId)
    const purchaseItems = await seedPurchaseItems(userId)
    
    console.log('\n========================================')
    console.log('✅ Seed Complete!')
    console.log('========================================')
    console.log('\nCreated:')
    console.log(`  - ${vendors.length} vendor(s)`)
    console.log(`  - ${inventory.length} inventory item(s)`)
    console.log(`  - ${tickets.length} maintenance ticket(s)`)
    console.log(`  - ${bookings.length} booking(s)`)
    console.log(`  - ${expenses.length} expense(s)`)
    console.log(`  - ${purchaseItems.length} purchase item(s)`)
    console.log('\nYou can now test the application with sample data!')
    
  } catch (error) {
    console.error('\n❌ Error during seed:', error)
    process.exit(1)
  }
}

// Run the script
main()


