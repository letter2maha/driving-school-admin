const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://parriuibqsfakwlmbdac.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcnJpdWlicXNmYWt3bG1iZGFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzIxMjEyOSwiZXhwIjoyMDY4Nzg4MTI5fQ.PND9kJQ4mc1UVJmpDZ27w6AoT85mdFKY0kNZT20vVi8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkInstructors() {
  console.log('=== CHECKING INSTRUCTOR APPROVAL STATUS ===\n');
  
  // 1. Check all instructors in profiles
  console.log('1. All instructors in profiles table:');
  const { data: allInstructors, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('role', 'instructor');
    
  if (profilesError) {
    console.error('Error fetching instructors:', profilesError);
  } else {
    console.log(`Found ${allInstructors?.length || 0} instructors in profiles table:`);
    allInstructors?.forEach(instructor => {
      console.log(`  - ${instructor.full_name} (${instructor.email}) - ID: ${instructor.id.slice(0, 8)}...`);
    });
  }
  
  console.log('\n2. Checking verification_status for instructors:');
  
  if (allInstructors && allInstructors.length > 0) {
    const instructorIds = allInstructors.map(i => i.id);
    
    const { data: verificationData, error: verificationError } = await supabase
      .from('verification_status')
      .select('id, profile_approved, profile_approved_at')
      .in('id', instructorIds);
      
    if (verificationError) {
      console.error('Error fetching verification status:', verificationError);
    } else {
      console.log(`Found ${verificationData?.length || 0} verification records:`);
      verificationData?.forEach(verification => {
        const instructor = allInstructors.find(i => i.id === verification.id);
        console.log(`  - ${instructor?.full_name} (${instructor?.email}): profile_approved = ${verification.profile_approved}`);
      });
      
      const approvedCount = verificationData?.filter(v => v.profile_approved === true).length || 0;
      console.log(`\nTotal approved instructors: ${approvedCount}`);
    }
  }
  
  console.log('\n3. Checking if inst1@gmail.com exists:');
  const { data: inst1, error: inst1Error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('email', 'inst1@gmail.com');
    
  if (inst1Error) {
    console.error('Error checking inst1:', inst1Error);
  } else if (inst1 && inst1.length > 0) {
    console.log(`Found inst1@gmail.com: ${inst1[0].full_name} - ID: ${inst1[0].id}`);
    
    // Check their verification status
    const { data: inst1Verification, error: inst1VerError } = await supabase
      .from('verification_status')
      .select('profile_approved, profile_approved_at')
      .eq('id', inst1[0].id)
      .single();
      
    if (inst1VerError) {
      console.log('No verification status found for inst1@gmail.com');
    } else {
      console.log(`inst1 verification status: profile_approved = ${inst1Verification.profile_approved}`);
    }
  } else {
    console.log('inst1@gmail.com not found in profiles table');
  }
  
  console.log('\n4. Testing the actual API query:');
  const { data: apiTest, error: apiError } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      phone,
      created_at,
      verification_status!inner (
        profile_approved
      )
    `)
    .eq('role', 'instructor')
    .eq('verification_status.profile_approved', true);
    
  if (apiError) {
    console.error('API query error:', apiError);
  } else {
    console.log(`API query result: ${apiTest?.length || 0} approved instructors found`);
    apiTest?.forEach(instructor => {
      console.log(`  - ${instructor.full_name} (${instructor.email})`);
    });
  }
}

checkInstructors().catch(console.error);
