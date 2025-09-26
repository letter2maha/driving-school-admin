const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://parriuibqsfakwlmbdac.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcnJpdWlicXNmYWt3bG1iZGFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzIxMjEyOSwiZXhwIjoyMDY4Nzg4MTI5fQ.PND9kJQ4mc1UVJmpDZ27w6AoT85mdFKY0kNZT20vVi8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFinalQuery() {
  console.log('=== TESTING FINAL API QUERY ===\n');
  
  const instructorId = '210fba25-13c8-4521-ad54-08777f832b17'; // inst1@gmail.com
  
  // Test the final query that includes both 'accepted' and 'active' statuses
  console.log('Testing enrolled students query (status = accepted OR active):');
  const { data: enrolledStudents, error: enrolledError } = await supabase
    .from('student_instructor_relationships')
    .select(`
      *,
      profiles:student_id (
        id,
        full_name,
        phone,
        email,
        created_at,
        profile_image_url
      )
    `)
    .eq('instructor_id', instructorId)
    .in('status', ['accepted', 'active'])
    .order('created_at', { ascending: false });
    
  if (enrolledError) {
    console.error('Error fetching enrolled students:', enrolledError);
  } else {
    console.log(`Found ${enrolledStudents?.length || 0} enrolled students:`);
    enrolledStudents?.forEach(student => {
      console.log(`  - ${student.profiles?.full_name || 'Unknown'} (${student.profiles?.email || 'No email'}) - Status: ${student.status}`);
    });
  }
  
  // Test invited students
  console.log('\nTesting invited students query:');
  const { data: invitedStudents, error: invitedError } = await supabase
    .from('student_invitations')
    .select('*')
    .eq('instructor_id', instructorId)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });
    
  if (invitedError) {
    console.error('Error fetching invited students:', invitedError);
  } else {
    console.log(`Found ${invitedStudents?.length || 0} pending invitations:`);
    invitedStudents?.forEach(invitation => {
      console.log(`  - ${invitation.student_name} (${invitation.student_email || 'No email'})`);
    });
  }
  
  console.log(`\n📊 SUMMARY:`);
  console.log(`   Enrolled Students: ${enrolledStudents?.length || 0}`);
  console.log(`   Invited Students: ${invitedStudents?.length || 0}`);
  console.log(`   Total Students: ${(enrolledStudents?.length || 0) + (invitedStudents?.length || 0)}`);
  
  console.log('\n✅ Final query test complete!');
}

testFinalQuery().catch(console.error);
