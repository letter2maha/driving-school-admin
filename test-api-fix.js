const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://parriuibqsfakwlmbdac.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcnJpdWlicXNmYWt3bG1iZGFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzIxMjEyOSwiZXhwIjoyMDY4Nzg4MTI5fQ.PND9kJQ4mc1UVJmpDZ27w6AoT85mdFKY0kNZT20vVi8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFixedAPI() {
  console.log('=== TESTING FIXED API QUERY ===\n');
  
  try {
    // Test the fixed approach: First get approved IDs, then get profiles
    console.log('1. Getting approved instructor IDs from verification_status:');
    const { data: approvedIds, error: verificationError } = await supabase
      .from('verification_status')
      .select('id')
      .eq('profile_approved', true);

    if (verificationError) {
      console.error('Error fetching approved instructor IDs:', verificationError);
      return;
    }

    console.log(`Found ${approvedIds?.length || 0} approved instructor IDs:`);
    approvedIds?.forEach(item => {
      console.log(`  - ${item.id}`);
    });

    if (!approvedIds || approvedIds.length === 0) {
      console.log('No approved instructors found!');
      return;
    }

    console.log('\n2. Getting instructor profiles for approved IDs:');
    const instructorIds = approvedIds.map(item => item.id);
    
    const { data: instructors, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        phone,
        created_at
      `)
      .eq('role', 'instructor')
      .in('id', instructorIds)
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error fetching instructor profiles:', profilesError);
      return;
    }

    console.log(`Found ${instructors?.length || 0} approved instructors:`);
    instructors?.forEach(instructor => {
      console.log(`  - ${instructor.full_name} (${instructor.email}) - ID: ${instructor.id.slice(0, 8)}...`);
    });

    console.log('\n✅ API fix should work now!');

  } catch (error) {
    console.error('Error in test:', error);
  }
}

testFixedAPI().catch(console.error);
