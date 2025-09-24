const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://parriuibqsfakwlmbdac.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcnJpdWlicXNmYWt3bG1iZGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMTIxMjksImV4cCI6MjA2ODc4ODEyOX0.PHfq49BUm2SFisBzlJl5mt33PODz22-7NoJ_JMXERM4'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcnJpdWlicXNmYWt3bG1iZGFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzIxMjEyOSwiZXhwIjoyMDY4Nzg4MTI5fQ.PND9kJQ4mc1UVJmpDZ27w6AoT85mdFKY0kNZT20vVi8'

// Client for user authentication
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client with service role key (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testAdminLogin() {
  console.log('Testing admin login with service role...\n')
  
  try {
    // Step 1: Try to login with anon key (for authentication)
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@drivedash.co.uk',
      password: 'newpassword123'
    })

    if (authError) {
      console.error('❌ Login failed:', authError.message)
      return
    }

    console.log('✅ Login successful!')
    console.log('User ID:', user.id)
    console.log('User Email:', user.email)

    // Step 2: Check admin status using SERVICE ROLE (bypasses RLS)
    console.log('\nChecking admin status with service role...')
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('❌ Error checking admin status:', profileError.message)
      console.error('Error details:', profileError)
    } else {
      console.log('✅ Profile data:', profile)
      console.log('Is admin:', profile?.role === 'admin')
    }

    // Step 3: Access profiles table using SERVICE ROLE (bypasses RLS)
    console.log('\nTesting profiles table access with service role...')
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role')
      .eq('role', 'instructor')
      .limit(3)

    if (profilesError) {
      console.error('❌ Error accessing profiles:', profilesError.message)
    } else {
      console.log('✅ Profiles accessible:', profiles?.length || 0, 'records')
      console.log('Sample profiles:', profiles)
    }

    // Step 4: Test instructor_profiles table
    console.log('\nTesting instructor_profiles table access...')
    const { data: instructorProfiles, error: instructorError } = await supabaseAdmin
      .from('instructor_profiles')
      .select('id, full_name')
      .limit(2)

    if (instructorError) {
      console.error('❌ Error accessing instructor_profiles:', instructorError.message)
    } else {
      console.log('✅ Instructor profiles accessible:', instructorProfiles?.length || 0, 'records')
      console.log('Sample instructor profiles:', instructorProfiles)
    }

    // Step 5: Test verification_status table
    console.log('\nTesting verification_status table access...')
    const { data: verificationStatus, error: verificationError } = await supabaseAdmin
      .from('verification_status')
      .select('id, status')
      .limit(2)

    if (verificationError) {
      console.error('❌ Error accessing verification_status:', verificationError.message)
    } else {
      console.log('✅ Verification status accessible:', verificationStatus?.length || 0, 'records')
      console.log('Sample verification status:', verificationStatus)
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

testAdminLogin().catch(console.error)
