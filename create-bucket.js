const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://euxgrvunyghbpenkcgwh.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1eGdydnVueWdoYnBlbmtjZ3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0Njk3MTYsImV4cCI6MjA4MjA0NTcxNn0.cpb17DvRzHlEdqCyOdmporKVZzxpetOTnB9jFYQgp-k'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function createBucket() {
  console.log('🪣 Attempting to create storage bucket...')
  
  // Check if bucket exists
  const { data: buckets } = await supabase.storage.listBuckets()
  const exists = buckets?.some(b => b.name === 'attachments')
  
  if (exists) {
    console.log('✅ Bucket "attachments" already exists')
    return true
  }
  
  // Try to create
  const { data, error } = await supabase.storage.createBucket('attachments', {
    public: false,
    fileSizeLimit: 10485760
  })
  
  if (error) {
    console.log('❌ Could not create bucket:', error.message)
    console.log('\n📋 Manual creation required:')
    console.log('1. Go to: https://supabase.com/dashboard/project/euxgrvunyghbpenkcgwh/storage/buckets')
    console.log('2. Click "New bucket"')
    console.log('3. Name: attachments')
    console.log('4. Public: OFF')
    console.log('5. Add policy: Allow all for authenticated users')
    return false
  }
  
  console.log('✅ Bucket created successfully')
  return true
}

createBucket()
