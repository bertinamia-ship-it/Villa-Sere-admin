#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://euxgrvunyghbpenkcgwh.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1eGdydnVueWdoYnBlbmtjZ3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0Njk3MTYsImV4cCI6MjA4MjA0NTcxNn0.cpb17DvRzHlEdqCyOdmporKVZzxpetOTnB9jFYQgp-k'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const TEST_USER = {
  email: 'admin@example.com',
  password: 'TestPassword123!',
  full_name: 'Test Admin'
}

let testUserId = null
let testVendorId = null
let testInventoryId = null
let testTicketId = null
let testExpenseId = null

async function log(section, message, status = 'info') {
  const symbols = { pass: '✅', fail: '❌', info: '🔍', warn: '⚠️' }
  console.log(`${symbols[status]} [${section}] ${message}`)
}

async function cleanup() {
  log('CLEANUP', 'Removing test data...', 'info')
  
  if (testExpenseId) await supabase.from('expenses').delete().eq('id', testExpenseId)
  if (testTicketId) await supabase.from('maintenance_tickets').delete().eq('id', testTicketId)
  if (testInventoryId) await supabase.from('inventory_items').delete().eq('id', testInventoryId)
  if (testVendorId) await supabase.from('vendors').delete().eq('id', testVendorId)
  if (testUserId) {
    await supabase.from('profiles').delete().eq('id', testUserId)
    // Note: Can't delete auth user with anon key
  }
}

async function test1_Auth() {
  log('AUTH', 'Testing authentication...', 'info')
  
  // Try to sign up
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: TEST_USER.email,
    password: TEST_USER.password,
    options: {
      data: { full_name: TEST_USER.full_name },
      emailRedirectTo: undefined
    }
  })
  
  if (signUpError && !signUpError.message.includes('already registered')) {
    log('AUTH', `Signup failed: ${signUpError.message}`, 'fail')
    return false
  }
  
  if (signUpData.user) {
    testUserId = signUpData.user.id
    log('AUTH', `User created: ${TEST_USER.email}`, 'pass')
  } else {
    log('AUTH', 'User already exists, trying login...', 'info')
  }
  
  // Sign in
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: TEST_USER.email,
    password: TEST_USER.password
  })
  
  if (signInError) {
    log('AUTH', `Login failed: ${signInError.message}`, 'fail')
    return false
  }
  
  testUserId = signInData.user.id
  log('AUTH', 'Login successful', 'pass')
  
  // Check profile exists
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', testUserId)
    .single()
  
  if (profileError || !profile) {
    log('AUTH', 'Profile not found - trigger may not be working', 'fail')
    return false
  }
  
  log('AUTH', `Profile exists with role: ${profile.role}`, 'pass')
  
  // Upgrade to admin if needed
  if (profile.role !== 'admin') {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', testUserId)
    
    if (updateError) {
      log('AUTH', `Could not upgrade to admin: ${updateError.message}`, 'warn')
    } else {
      log('AUTH', 'Upgraded user to admin', 'pass')
    }
  }
  
  // Test session persistence
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    log('AUTH', 'Session persists correctly', 'pass')
  } else {
    log('AUTH', 'Session not found', 'fail')
    return false
  }
  
  return true
}

async function test2_Vendors() {
  log('VENDORS', 'Testing vendor CRUD...', 'info')
  
  // Create
  const { data: vendor, error: createError } = await supabase
    .from('vendors')
    .insert({
      company_name: 'Test Vendor Co',
      specialty: 'Plumbing',
      phone: '+52-123-456-7890',
      whatsapp: '+521234567890',
      email: 'test@vendor.com',
      notes: 'Test vendor for E2E testing'
    })
    .select()
    .single()
  
  if (createError) {
    log('VENDORS', `Create failed: ${createError.message}`, 'fail')
    return false
  }
  
  testVendorId = vendor.id
  log('VENDORS', 'Vendor created', 'pass')
  
  // Read
  const { data: readVendor, error: readError } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', testVendorId)
    .single()
  
  if (readError || !readVendor) {
    log('VENDORS', 'Read failed', 'fail')
    return false
  }
  log('VENDORS', 'Vendor read successfully', 'pass')
  
  // Update
  const { error: updateError } = await supabase
    .from('vendors')
    .update({ specialty: 'Electrical & Plumbing' })
    .eq('id', testVendorId)
  
  if (updateError) {
    log('VENDORS', `Update failed: ${updateError.message}`, 'fail')
    return false
  }
  log('VENDORS', 'Vendor updated', 'pass')
  
  return true
}

async function test3_Inventory() {
  log('INVENTORY', 'Testing inventory CRUD...', 'info')
  
  // Create
  const { data: item, error: createError } = await supabase
    .from('inventory_items')
    .insert({
      name: 'Test Cleaning Supply',
      category: 'Cleaning Supplies',
      location: 'Storage',
      quantity: 10,
      min_threshold: 5,
      notes: 'Test item for E2E'
    })
    .select()
    .single()
  
  if (createError) {
    log('INVENTORY', `Create failed: ${createError.message}`, 'fail')
    return false
  }
  
  testInventoryId = item.id
  log('INVENTORY', 'Inventory item created', 'pass')
  
  // Update quantity
  const { error: updateError } = await supabase
    .from('inventory_items')
    .update({ quantity: 15, notes: 'Updated quantity' })
    .eq('id', testInventoryId)
  
  if (updateError) {
    log('INVENTORY', `Update failed: ${updateError.message}`, 'fail')
    return false
  }
  log('INVENTORY', 'Inventory updated', 'pass')
  
  // Read back
  const { data: readItem } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('id', testInventoryId)
    .single()
  
  if (readItem && readItem.quantity === 15) {
    log('INVENTORY', 'Quantity update verified', 'pass')
  } else {
    log('INVENTORY', 'Quantity update verification failed', 'fail')
    return false
  }
  
  return true
}

async function test4_Maintenance() {
  log('MAINTENANCE', 'Testing maintenance tickets...', 'info')
  
  // Create
  const { data: ticket, error: createError } = await supabase
    .from('maintenance_tickets')
    .insert({
      title: 'Test Repair - Pool Filter',
      room: 'Pool Area',
      priority: 'high',
      status: 'open',
      vendor_id: testVendorId,
      notes: 'Test maintenance ticket',
      cost: 150.00
    })
    .select()
    .single()
  
  if (createError) {
    log('MAINTENANCE', `Create failed: ${createError.message}`, 'fail')
    return false
  }
  
  testTicketId = ticket.id
  log('MAINTENANCE', 'Ticket created', 'pass')
  
  // Update status
  const { error: updateError } = await supabase
    .from('maintenance_tickets')
    .update({ status: 'in_progress' })
    .eq('id', testTicketId)
  
  if (updateError) {
    log('MAINTENANCE', `Status update failed: ${updateError.message}`, 'fail')
    return false
  }
  log('MAINTENANCE', 'Status updated to in_progress', 'pass')
  
  // Complete ticket
  const { error: completeError } = await supabase
    .from('maintenance_tickets')
    .update({ status: 'done' })
    .eq('id', testTicketId)
  
  if (completeError) {
    log('MAINTENANCE', `Complete failed: ${completeError.message}`, 'fail')
    return false
  }
  log('MAINTENANCE', 'Ticket completed', 'pass')
  
  return true
}

async function test5_Expenses() {
  log('EXPENSES', 'Testing expense tracking...', 'info')
  
  // Create
  const { data: expense, error: createError } = await supabase
    .from('expenses')
    .insert({
      date: new Date().toISOString().split('T')[0],
      amount: 150.00,
      category: 'Maintenance',
      vendor_id: testVendorId,
      ticket_id: testTicketId,
      notes: 'Test expense linked to ticket'
    })
    .select()
    .single()
  
  if (createError) {
    log('EXPENSES', `Create failed: ${createError.message}`, 'fail')
    return false
  }
  
  testExpenseId = expense.id
  log('EXPENSES', 'Expense created', 'pass')
  
  // Verify links
  const { data: readExpense } = await supabase
    .from('expenses')
    .select(`
      *,
      vendors (company_name),
      maintenance_tickets (title)
    `)
    .eq('id', testExpenseId)
    .single()
  
  if (readExpense && readExpense.vendors && readExpense.maintenance_tickets) {
    log('EXPENSES', 'Vendor and ticket links verified', 'pass')
  } else {
    log('EXPENSES', 'Links verification failed', 'fail')
    return false
  }
  
  // Test monthly calculation
  const currentMonth = new Date().toISOString().slice(0, 7)
  const { data: monthlyExpenses } = await supabase
    .from('expenses')
    .select('amount')
    .gte('date', `${currentMonth}-01`)
    .lte('date', `${currentMonth}-31`)
  
  if (monthlyExpenses) {
    const total = monthlyExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)
    log('EXPENSES', `Monthly total calculated: $${total.toFixed(2)}`, 'pass')
  }
  
  return true
}

async function test6_Storage() {
  log('STORAGE', 'Testing storage bucket...', 'info')
  
  const { data: buckets } = await supabase.storage.listBuckets()
  
  const attachmentsBucket = buckets?.find(b => b.name === 'attachments')
  
  if (attachmentsBucket) {
    log('STORAGE', 'Bucket "attachments" exists', 'pass')
  } else {
    log('STORAGE', 'Bucket "attachments" not found - needs manual creation', 'warn')
    return false
  }
  
  return true
}

async function runAllTests() {
  console.log('\n' + '='.repeat(50))
  console.log('🏡 Villa Sere - End-to-End Testing')
  console.log('='.repeat(50) + '\n')
  
  const results = {
    auth: false,
    vendors: false,
    inventory: false,
    maintenance: false,
    expenses: false,
    storage: false
  }
  
  try {
    results.auth = await test1_Auth()
    if (results.auth) {
      results.vendors = await test2_Vendors()
      results.inventory = await test3_Inventory()
      results.maintenance = await test4_Maintenance()
      results.expenses = await test5_Expenses()
    }
    results.storage = await test6_Storage()
    
  } catch (error) {
    console.error('\n❌ Test suite error:', error.message)
  } finally {
    // await cleanup()
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('📊 Test Summary')
  console.log('='.repeat(50))
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test.toUpperCase()}: ${passed ? 'PASSED' : 'FAILED'}`)
  })
  
  const allPassed = Object.values(results).every(r => r === true)
  
  console.log('\n' + '='.repeat(50))
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED - App is ready!')
  } else {
    console.log('⚠️  Some tests failed - check output above')
  }
  console.log('='.repeat(50) + '\n')
  
  process.exit(allPassed ? 0 : 1)
}

runAllTests()
