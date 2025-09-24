// Test script to check if the deployed Vercel app can access Supabase correctly
// This simulates what the deployed app should be doing

const { createClient } = require('@supabase/supabase-js');

// Use the same hardcoded values from your supabase.ts file
const supabaseUrl = 'https://parriuibqsfakwlmbdac.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcnJpdWlicXNmYWt3bG1iZGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMTIxMjksImV4cCI6MjA2ODc4ODEyOX0.PHfq49BUm2SFisBzlJl5mt33PODz22-7NoJ_JMXERM4';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcnJpdWlicXNmYWt3bG1iZGFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzIxMjEyOSwiZXhwIjoyMDY4Nzg4MTI5fQ.PND9kJQ4mc1UVJmpDZ27w6AoT85mdFKY0kNZT20vVi8';

console.log('🧪 Testing deployed app environment simulation...\n');

// Test 1: Check if we can create Supabase clients
console.log('1. Testing Supabase client creation...');
try {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  console.log('✅ Supabase clients created successfully');
} catch (error) {
  console.log('❌ Error creating Supabase clients:', error.message);
  process.exit(1);
}

// Test 2: Test admin login (this is what the deployed app does)
console.log('\n2. Testing admin login simulation...');
async function testAdminLogin() {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@drivedash.co.uk',
      password: 'newpassword123'
    });

    if (authError) {
      console.log('❌ Admin login failed:', authError.message);
      console.log('Error details:', authError);
      return false;
    }

    console.log('✅ Admin login successful');
    console.log('User ID:', user.id);
    console.log('User Email:', user.email);
    return true;
  } catch (error) {
    console.log('❌ Unexpected login error:', error.message);
    return false;
  }
}

// Test 3: Test admin status check with service role
console.log('\n3. Testing admin status check...');
async function testAdminStatus() {
  try {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', '7e538aad-0075-47a4-8c81-1f1354da4563')
      .single();

    if (profileError) {
      console.log('❌ Admin status check failed:', profileError.message);
      console.log('Error details:', profileError);
      return false;
    }

    console.log('✅ Admin status check successful');
    console.log('Profile data:', profile);
    console.log('Is admin:', profile?.role === 'admin');
    return true;
  } catch (error) {
    console.log('❌ Unexpected admin status error:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  const loginSuccess = await testAdminLogin();
  const adminStatusSuccess = await testAdminStatus();
  
  console.log('\n📊 Test Results:');
  console.log(`Admin Login: ${loginSuccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Admin Status: ${adminStatusSuccess ? '✅ PASS' : '❌ FAIL'}`);
  
  if (loginSuccess && adminStatusSuccess) {
    console.log('\n🎉 All tests passed! The deployed app should work correctly.');
    console.log('\nIf you\'re still getting "Invalid API key" on the deployed app,');
    console.log('the issue might be:');
    console.log('1. Browser cache - try hard refresh (Ctrl+F5)');
    console.log('2. RLS policies still active - need to disable them in Supabase dashboard');
    console.log('3. Environment variables not properly loaded in Vercel');
  } else {
    console.log('\n❌ Some tests failed. The deployed app will likely have issues.');
  }
}

runTests().catch(console.error);
