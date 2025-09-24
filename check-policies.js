const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPolicies() {
  try {
    console.log('Checking existing RLS policies...\n');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies 
        WHERE schemaname = 'public' 
        ORDER BY tablename, policyname;
      `
    });

    if (error) {
      console.error('Error checking policies:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('Found existing policies:');
      data.forEach(policy => {
        console.log(`\nTable: ${policy.tablename}`);
        console.log(`Policy: ${policyname}`);
        console.log(`Command: ${policy.cmd}`);
        console.log(`Roles: ${policy.roles}`);
        console.log(`Using: ${policy.qual}`);
        console.log(`With Check: ${policy.with_check}`);
        console.log('---');
      });
    } else {
      console.log('No policies found.');
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkPolicies();
