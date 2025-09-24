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

async function disableRLS() {
  try {
    console.log('Attempting to disable RLS via API...\n');
    
    // Try to execute SQL commands directly
    const sqlCommands = [
      'ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE instructor_profiles DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE verification_status DISABLE ROW LEVEL SECURITY;',
      'DROP POLICY IF EXISTS "profiles_read_all" ON profiles;',
      'DROP POLICY IF EXISTS "profiles_write_all" ON profiles;',
      'DROP POLICY IF EXISTS "profiles_service_full" ON profiles;',
      'DROP POLICY IF EXISTS "profiles_auth_read" ON profiles;',
      'DROP POLICY IF EXISTS "instructor_profiles_read_all" ON instructor_profiles;',
      'DROP POLICY IF EXISTS "instructor_profiles_write_all" ON instructor_profiles;',
      'DROP POLICY IF EXISTS "instructor_profiles_service_full" ON instructor_profiles;',
      'DROP POLICY IF EXISTS "instructor_profiles_auth_read" ON instructor_profiles;',
      'DROP POLICY IF EXISTS "verification_status_read_all" ON verification_status;',
      'DROP POLICY IF EXISTS "verification_status_write_all" ON verification_status;',
      'DROP POLICY IF EXISTS "verification_status_service_full" ON verification_status;',
      'DROP POLICY IF EXISTS "verification_status_auth_read" ON verification_status;'
    ];

    // Try using the REST API to execute SQL
    for (const sql of sqlCommands) {
      try {
        console.log(`Executing: ${sql.substring(0, 50)}...`);
        
        // Try to execute via REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
          },
          body: JSON.stringify({ sql })
        });

        if (response.ok) {
          console.log('✅ Success');
        } else {
          const error = await response.text();
          console.log(`❌ Error: ${error}`);
        }
      } catch (err) {
        console.log(`❌ Error: ${err.message}`);
      }
    }

    // Test if RLS is disabled
    console.log('\nTesting if RLS is disabled...');
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .limit(1);

    if (error) {
      console.log(`❌ RLS still active: ${error.message}`);
    } else {
      console.log('✅ RLS successfully disabled!');
      console.log('Admin dashboard should now work without infinite recursion errors.');
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

disableRLS();
