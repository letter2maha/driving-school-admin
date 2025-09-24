const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://parriuibqsfakwlmbdac.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcnJpdWlicXNmYWt3bG1iZGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMTIxMjksImV4cCI6MjA2ODc4ODEyOX0.PHfq49BUm2SFisBzlJl5mt33PODz22-7NoJ_JMXERM4'

// Test with service role key
const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key_here',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function testServiceRole() {
  console.log('Testing service role key access...\n')
  
  console.log('Service Role Key Status:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing')
  console.log('Service Role Key Value:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set')
  
  try {
    // Test 1: Check if we can access profiles table with service role
    console.log('\n1. Testing profiles table access with service role...')
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role')
      .eq('role', 'instructor')
      .limit(3)

    if (profilesError) {
      console.error('❌ Error accessing profiles with service role:', profilesError.message)
    } else {
      console.log('✅ Profiles accessible with service role:', profiles?.length || 0, 'records')
      console.log('Sample profiles:', profiles)
    }

    // Test 2: Check admin user specifically
    console.log('\n2. Testing admin user access...')
    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role')
      .eq('email', 'admin@drivedash.co.uk')
      .single()

    if (adminError) {
      console.error('❌ Error accessing admin profile:', adminError.message)
    } else {
      console.log('✅ Admin profile accessible:', adminProfile)
    }

    // Test 3: Check instructor profiles
    console.log('\n3. Testing instructor_profiles table...')
    const { data: instructorProfiles, error: instructorError } = await supabaseAdmin
      .from('instructor_profiles')
      .select('id, bio, experience_years')
      .limit(3)

    if (instructorError) {
      console.error('❌ Error accessing instructor_profiles:', instructorError.message)
    } else {
      console.log('✅ Instructor profiles accessible:', instructorProfiles?.length || 0, 'records')
      console.log('Sample instructor profiles:', instructorProfiles)
    }

    // Test 4: Check verification status
    console.log('\n4. Testing verification_status table...')
    const { data: verificationStatus, error: verificationError } = await supabaseAdmin
      .from('verification_status')
      .select('*')
      .limit(3)

    if (verificationError) {
      console.error('❌ Error accessing verification_status:', verificationError.message)
    } else {
      console.log('✅ Verification status accessible:', verificationStatus?.length || 0, 'records')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

testServiceRole().catch(console.error)
