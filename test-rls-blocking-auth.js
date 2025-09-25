const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://parriuibqsfakwlmbdac.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcnJpdWlicXNmYWt3bG1iZGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMTIxMjksImV4cCI6MjA2ODc4ODEyOX0.PHfq49BUm2SFisBzlJl5mt33PODz22-7NoJ_JMXERM4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthBlocking() {
  console.log('🔍 Testing if RLS is blocking authentication...\n');
  
  try {
    // Test 1: Try to login (this is what's failing with 401)
    console.log('1. Testing login with anon key...');
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@drivedash.co.uk',
      password: 'newpassword123'
    });

    if (authError) {
      console.log('❌ Login failed:', authError.message);
      console.log('Error code:', authError.status);
      
      if (authError.status === 401) {
        console.log('\n🔍 DIAGNOSIS: 401 Unauthorized means:');
        console.log('- Either the email/password is wrong');
        console.log('- OR RLS policies are blocking the authentication process');
        console.log('- OR the anon key is invalid');
        
        // Test if the anon key is valid by trying a simple query
        console.log('\n2. Testing anon key validity...');
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('count')
            .limit(1);
            
          if (error) {
            console.log('❌ Anon key blocked by RLS:', error.message);
            console.log('This confirms RLS policies are active and blocking access');
          } else {
            console.log('✅ Anon key is valid, issue is likely wrong credentials');
          }
        } catch (err) {
          console.log('❌ Anon key test failed:', err.message);
        }
      }
    } else {
      console.log('✅ Login successful!');
      console.log('User ID:', user.id);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testAuthBlocking();
