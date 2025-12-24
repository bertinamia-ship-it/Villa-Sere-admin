const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    envVars[key] = value;
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  console.log('🔧 Creating admin user account...\n');

  // Use a professional email for the admin account
  const adminEmail = 'admin@villasere.com';
  
  try {
    // Step 1: Create user in Supabase Auth
    console.log('📧 Creating user in Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: 'Villa Sere Administrator',
        role: 'admin'
      }
    });

    if (authError) {
      console.error('❌ Auth error:', authError.message);
      process.exit(1);
    }

    console.log('✅ User created in Auth');
    console.log(`   User ID: ${authData.user.id}`);
    console.log(`   Email: ${authData.user.email}`);

    // Step 2: Create profile record
    console.log('\n👤 Creating profile record...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: adminEmail,
        full_name: 'Villa Sere Administrator',
        role: 'admin',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Profile error:', profileError.message);
      // Continue anyway, the trigger might have created it
    } else {
      console.log('✅ Profile created with admin role');
    }

    // Step 3: Generate password reset link
    console.log('\n🔑 Generating secure login link...');
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: adminEmail,
    });

    if (resetError) {
      console.error('❌ Reset link error:', resetError.message);
    } else {
      console.log('✅ Magic link generated');
      console.log('\n' + '='.repeat(80));
      console.log('🎯 ADMIN ACCOUNT CREATED SUCCESSFULLY');
      console.log('='.repeat(80));
      console.log('\n📧 Admin Email: ' + adminEmail);
      console.log('🔑 User ID: ' + authData.user.id);
      console.log('👑 Role: admin');
      console.log('\n🔐 ONE-TIME LOGIN LINK (expires in 1 hour):');
      console.log('\n' + resetData.properties.action_link);
      console.log('\n' + '='.repeat(80));
      console.log('\n📋 INSTRUCTIONS:');
      console.log('1. Click the link above to access your account');
      console.log('2. You will be automatically logged in');
      console.log('3. Go to your profile to set a permanent password');
      console.log('\nℹ️  The link expires in 1 hour. After that, use "Forgot Password"');
      console.log('   on the login page with email: ' + adminEmail);
      console.log('\n✅ Ready to log in!\n');
    }

    // Verify the profile
    console.log('\n🔍 Verifying admin profile...');
    const { data: verifyProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (verifyError) {
      console.error('❌ Could not verify profile:', verifyError.message);
    } else {
      console.log('✅ Profile verified:');
      console.log('   Email:', verifyProfile.email);
      console.log('   Full Name:', verifyProfile.full_name);
      console.log('   Role:', verifyProfile.role);
      console.log('   Created:', verifyProfile.created_at);
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

createAdminUser();
