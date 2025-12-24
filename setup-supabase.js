const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabaseUrl = 'https://euxgrvunyghbpenkcgwh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1eGdydnVueWdoYnBlbmtjZ3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0Njk3MTYsImV4cCI6MjA4MjA0NTcxNn0.cpb17DvRzHlEdqCyOdmporKVZzxpetOTnB9jFYQgp-k'

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupDatabase() {
  console.log('🔍 Checking Supabase connection...')
  
  // Test connection
  const { data, error } = await supabase.from('profiles').select('count').limit(1)
  
  if (error) {
    console.log('❌ Cannot query profiles table - schema may not be deployed yet')
    console.log('Error:', error.message)
    console.log('\n📋 Please deploy the schema manually:')
    console.log('1. Go to: https://supabase.com/dashboard/project/euxgrvunyghbpenkcgwh/sql')
    console.log('2. Copy contents of supabase-schema.sql')
    console.log('3. Paste and click RUN')
    return false
  }
  
  console.log('✅ Database connection successful!')
  return true
}

async function setupStorage() {
  console.log('\n🪣 Setting up Storage bucket...')
  
  // List existing buckets
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  
  if (listError) {
    console.log('❌ Error listing buckets:', listError.message)
    return false
  }
  
  const bucketExists = buckets?.some(b => b.name === 'attachments')
  
  if (bucketExists) {
    console.log('✅ Bucket "attachments" already exists')
    return true
  }
  
  // Create bucket
  const { data, error } = await supabase.storage.createBucket('attachments', {
    public: false,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
  })
  
  if (error) {
    console.log('⚠️  Could not create bucket:', error.message)
    console.log('Please create it manually in Supabase Dashboard > Storage')
    return false
  }
  
  console.log('✅ Created storage bucket "attachments"')
  return true
}

async function main() {
  console.log('========================================')
  console.log('Villa Sere - Supabase Setup')
  console.log('========================================\n')
  
  const dbReady = await setupDatabase()
  const storageReady = await setupStorage()
  
  console.log('\n========================================')
  console.log('Setup Summary')
  console.log('========================================')
  console.log('Database:', dbReady ? '✅ Ready' : '❌ Needs manual setup')
  console.log('Storage:', storageReady ? '✅ Ready' : '⚠️  Needs manual setup')
  console.log('\nProject URL: https://supabase.com/dashboard/project/euxgrvunyghbpenkcgwh')
}

main()
