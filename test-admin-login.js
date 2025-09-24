const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://parriuibqsfakwlmbdac.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcnJpdWlicXNmYWt3bG1iZGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMTIxMjksImV4cCI6MjA2ODc4ODEyOX0.PHfq49BUm2SFisBzlJl5mt33PODz22-7NoJ_JMXERM4'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAdminLogin() {
  console.log('Testing admin login...\n')
  
  try {
    // Step 1: Try to login
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@drivedash.co.uk',
      password: 'newpassword123'  // Use your actual password
    })

    if (authError) {
      console.error('❌ Login failed:', authError.message)
      return
    }

    console.log('✅ Login successful!')
    console.log('User ID:', user.id)
    console.log('User Email:', user.email)

    // Step 2: Try to check admin status
    console.log('\nChecking admin status...')
    const { data: profile, error: profileError } = await supabase
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

    // Step 3: Try to access profiles table
    console.log('\nTesting profiles table access...')
    const { data: profiles, error: profilesError } = await supabase
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

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

testAdminLogin().catch(console.error)
