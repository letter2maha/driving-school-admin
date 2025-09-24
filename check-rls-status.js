const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://parriuibqsfakwlmbdac.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcnJpdWlicXNmYWt3bG1iZGFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzIxMjEyOSwiZXhwIjoyMDY4Nzg4MTI5fQ.PND9kJQ4mc1UVJmpDZ27w6AoT85mdFKY0kNZT20vVi8';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkRLSStatus() {
  console.log('🔍 Checking RLS status on your Supabase database...\n');
  
  try {
    // Test each table to see if RLS is blocking access
    const tables = ['profiles', 'instructor_profiles', 'verification_status'];
    
    for (const table of tables) {
      console.log(`Testing ${table} table...`);
      
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(1);
          
        if (error) {
          if (error.message.includes('infinite recursion')) {
            console.log(`❌ ${table}: RLS policies are ACTIVE and causing infinite recursion`);
          } else {
            console.log(`⚠️  ${table}: Error - ${error.message}`);
          }
        } else {
          console.log(`✅ ${table}: RLS is DISABLED or working correctly`);
        }
      } catch (err) {
        console.log(`❌ ${table}: Unexpected error - ${err.message}`);
      }
    }
    
    console.log('\n📋 MANUAL STEPS TO FIX:');
    console.log('1. Go to: https://supabase.com/dashboard');
    console.log('2. Select your project: parriuibqsfakwlmbdac');
    console.log('3. Go to: Database > Tables');
    console.log('4. For each table (profiles, instructor_profiles, verification_status):');
    console.log('   - Click on the table name');
    console.log('   - Look for "Row Level Security" toggle');
    console.log('   - Turn it OFF');
    console.log('   - Save changes');
    console.log('\n5. After disabling RLS on all tables, test your admin login again.');
    
    console.log('\n🔗 Direct links:');
    console.log('Dashboard: https://supabase.com/dashboard/project/parriuibqsfakwlmbdac');
    console.log('Tables: https://supabase.com/dashboard/project/parriuibqsfakwlmbdac/editor');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkRLSStatus();
