const { createClient } = require('@supabase/supabase-js');

// Use the hardcoded keys from supabase.ts
const supabaseUrl = 'https://parriuibqsfakwlmbdac.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcnJpdWlicXNmYWt3bG1iZGFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzIxMjEyOSwiZXhwIjoyMDY4Nzg4MTI5fQ.PND9kJQ4mc1UVJmpDZ27w6AoT85mdFKY0kNZT20vVi8';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testAccess() {
  try {
    console.log('Testing database access with service role...\n');
    
    // Test 1: Direct profiles table access
    console.log('1. Testing profiles table access...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .limit(3);
    
    if (profilesError) {
      console.log(`❌ Profiles error: ${profilesError.message}`);
    } else {
      console.log(`✅ Profiles accessible: ${profiles?.length || 0} records`);
      console.log('Sample:', profiles);
    }
    
    // Test 2: Test admin status check
    console.log('\n2. Testing admin status check...');
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', '7e538aad-0075-47a4-8c81-1f1354da4563')
      .single();
    
    if (adminError) {
      console.log(`❌ Admin check error: ${adminError.message}`);
    } else {
      console.log(`✅ Admin check successful: ${adminProfile?.role}`);
    }
    
    console.log('\n=== MANUAL RLS DISABLE INSTRUCTIONS ===');
    console.log('Since we cannot disable RLS programmatically, please:');
    console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
    console.log('2. Navigate to your project: parriuibqsfakwlmbdac');
    console.log('3. Go to Authentication > Policies');
    console.log('4. For each table (profiles, instructor_profiles, verification_status):');
    console.log('   - Click on the table name');
    console.log('   - Toggle OFF "Enable RLS"');
    console.log('5. Save the changes');
    console.log('\nThis will completely disable RLS and your admin dashboard will work!');
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testAccess();
