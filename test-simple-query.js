// Test simple query to isolate the infinite recursion issue
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://parriuibqsfakwlmbdac.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcnJpdWlicXNmYWt3bG1iZGFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzIxMjEyOSwiZXhwIjoyMDY4Nzg4MTI5fQ.PND9kJQ4mc1UVJmpDZ27w6AoT85mdFKY0kNZT20vVi8'

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testSimpleQuery() {
  console.log('Testing simple query with service role...\n')
  
  try {
    // Test 1: Simple count query
    console.log('1. Testing count query...')
    const { count, error: countError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('❌ Count query error:', countError.message)
    } else {
      console.log('✅ Count query successful:', count, 'records')
    }
    
    // Test 2: Simple select with limit
    console.log('\n2. Testing select with limit...')
    const { data: profiles, error: selectError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .limit(1)
    
    if (selectError) {
      console.error('❌ Select query error:', selectError.message)
    } else {
      console.log('✅ Select query successful:', profiles)
    }
    
    // Test 3: Check if auth.uid() function works
    console.log('\n3. Testing auth.uid() function...')
    const { data: uidTest, error: uidError } = await supabaseAdmin
      .rpc('auth.uid')
    
    if (uidError) {
      console.error('❌ auth.uid() error:', uidError.message)
    } else {
      console.log('✅ auth.uid() result:', uidTest)
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

testSimpleQuery().catch(console.error)
