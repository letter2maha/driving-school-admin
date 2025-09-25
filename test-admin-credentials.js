const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://parriuibqsfakwlmbdac.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcnJpdWlicXNmYWt3bG1iZGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMTIxMjksImV4cCI6MjA2ODc4ODEyOX0.PHfq49BUm2SFisBzlJl5mt33PODz22-7NoJ_JMXERM4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAdminCredentials() {
  console.log('🔍 Testing admin credentials and Supabase configuration...\n');
  
  try {
    // Test 1: Check if we can connect to Supabase at all
    console.log('1. Testing Supabase connection...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Cannot connect to Supabase:', sessionError.message);
      return;
    }
    
    console.log('✅ Supabase connection successful');
    console.log('Current session:', session ? 'Active' : 'None');
    
    // Test 2: Try to login with admin credentials
    console.log('\n2. Testing admin login...');
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@drivedash.co.uk',
      password: 'newpassword123'
    });

    if (authError) {
      console.log('❌ Admin login failed:', authError.message);
      console.log('Error details:', {
        status: authError.status,
        statusText: authError.statusText,
        code: authError.code
      });
      
      // Test 3: Try to create a test user to see if auth works at all
      console.log('\n3. Testing if authentication works at all...');
      try {
        const { data: testData, error: testError } = await supabase.auth.signUp({
          email: 'test@example.com',
          password: 'testpassword123'
        });
        
        if (testError) {
          console.log('❌ Cannot create test user:', testError.message);
          console.log('This suggests a fundamental Supabase auth issue');
        } else {
          console.log('✅ Authentication system is working');
          console.log('The issue is specifically with admin credentials');
        }
      } catch (err) {
        console.log('❌ Test user creation failed:', err.message);
      }
      
    } else {
      console.log('✅ Admin login successful!');
      console.log('User ID:', user.id);
      console.log('User Email:', user.email);
    }

    // Test 4: Check if the admin user exists in the database
    console.log('\n4. Checking if admin user exists in database...');
    try {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('email', 'admin@drivedash.co.uk');
        
      if (profileError) {
        console.log('❌ Cannot query profiles:', profileError.message);
      } else {
        console.log('✅ Profiles query successful');
        console.log('Admin profiles found:', profiles?.length || 0);
        if (profiles && profiles.length > 0) {
          console.log('Admin profile:', profiles[0]);
        } else {
          console.log('⚠️  No admin profile found in database!');
        }
      }
    } catch (err) {
      console.log('❌ Profile query failed:', err.message);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testAdminCredentials();
