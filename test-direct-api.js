const { createClient } = require('@supabase/supabase-js');

// Use the hardcoded keys from supabase.ts
const supabaseUrl = 'https://parriuibqsfakwlmbdac.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcnJpdWlicXNmYWt3bG1iZGFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzIxMjEyOSwiZXhwIjoyMDY4Nzg4MTI5fQ.PND9kJQ4mc1UVJmpDZ27w6AoT85mdFKY0kNZT20vVi8';

async function testDirectAPI() {
  try {
    console.log('Testing direct REST API access...\n');
    
    // Test 1: Direct REST API call to profiles table
    console.log('1. Testing direct REST API call to profiles...');
    const response = await fetch(`${supabaseUrl}/rest/v1/profiles?select=id,full_name,role&limit=3`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Direct API access successful: ${data.length} records`);
      console.log('Sample:', data);
    } else {
      const error = await response.text();
      console.log(`❌ Direct API error: ${error}`);
    }

    // Test 2: Test admin profile specifically
    console.log('\n2. Testing admin profile access...');
    const adminResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.7e538aad-0075-47a4-8c81-1f1354da4563&select=role`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      }
    });

    if (adminResponse.ok) {
      const adminData = await adminResponse.json();
      console.log(`✅ Admin profile access successful: ${adminData[0]?.role}`);
    } else {
      const error = await adminResponse.text();
      console.log(`❌ Admin profile error: ${error}`);
    }

    // Test 3: Test with Supabase client
    console.log('\n3. Testing with Supabase client...');
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { data: clientData, error: clientError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .limit(1);

    if (clientError) {
      console.log(`❌ Supabase client error: ${clientError.message}`);
    } else {
      console.log(`✅ Supabase client access successful: ${clientData?.length} records`);
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

testDirectAPI();
