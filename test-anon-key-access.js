const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://parriuibqsfakwlmbdac.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcnJpdWlicXNmYWt3bG1iZGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMTIxMjksImV4cCI6MjA2ODc4ODEyOX0.PHfq49BUm2SFisBzlJl5mt33PODz22-7NoJ_JMXERM4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAnonKeyAccess() {
  console.log('🧪 Testing anon key access (what the deployed app uses for auth)...\n');
  
  try {
    // Step 1: Test login with anon key
    console.log('1. Testing login with anon key...');
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@drivedash.co.uk',
      password: 'newpassword123'
    });

    if (authError) {
      console.log('❌ Login failed:', authError.message);
      return;
    }

    console.log('✅ Login successful with anon key');
    console.log('User ID:', user.id);

    // Step 2: Test accessing profiles with anon key (this is what fails)
    console.log('\n2. Testing profiles access with anon key...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.log('❌ Profiles access failed:', profileError.message);
      console.log('This is likely the "Invalid API key" error you\'re seeing!');
      
      if (profileError.message.includes('infinite recursion')) {
        console.log('\n🔍 DIAGNOSIS: RLS policies are still active and causing infinite recursion');
        console.log('The anon key is subject to RLS policies, but the service role key bypasses them.');
      }
    } else {
      console.log('✅ Profiles access successful with anon key');
      console.log('Profile data:', profile);
    }

    // Step 3: Test other tables with anon key
    console.log('\n3. Testing other tables with anon key...');
    const tables = ['instructor_profiles', 'verification_status'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
          
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: Access successful`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testAnonKeyAccess();
