const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://parriuibqsfakwlmbdac.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcnJpdWlicXNmYWt3bG1iZGFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzIxMjEyOSwiZXhwIjoyMDY4Nzg4MTI5fQ.PND9kJQ4mc1UVJmpDZ27w6AoT85mdFKY0kNZT20vVi8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyStudentStatus() {
  console.log('=== VERIFYING STUDENT STATUS VALUES ===\n');
  
  const instructorId = '210fba25-13c8-4521-ad54-08777f832b17'; // inst1@gmail.com
  
  console.log(`Checking instructor: inst1@gmail.com (${instructorId})\n`);
  
  // 1. Check what status values exist in student_instructor_relationships
  console.log('1. Status values in student_instructor_relationships:');
  const { data: statusCounts, error: statusError } = await supabase
    .from('student_instructor_relationships')
    .select('status')
    .eq('instructor_id', instructorId);
    
  if (statusError) {
    console.error('Error fetching status counts:', statusError);
  } else {
    const statusGroups = {};
    statusCounts?.forEach(item => {
      statusGroups[item.status] = (statusGroups[item.status] || 0) + 1;
    });
    
    console.log('Status distribution:');
    Object.entries(statusGroups).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count} students`);
    });
  }
  
  // 2. Check student_invitations table
  console.log('\n2. Status values in student_invitations:');
  const { data: invitationStatuses, error: invitationError } = await supabase
    .from('student_invitations')
    .select('status')
    .eq('instructor_id', instructorId);
    
  if (invitationError) {
    console.error('Error fetching invitation statuses:', invitationError);
  } else {
    const invitationGroups = {};
    invitationStatuses?.forEach(item => {
      invitationGroups[item.status] = (invitationGroups[item.status] || 0) + 1;
    });
    
    console.log('Invitation status distribution:');
    Object.entries(invitationGroups).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count} invitations`);
    });
  }
  
  // 3. Test the fixed API query
  console.log('\n3. Testing fixed API query for enrolled students:');
  const { data: enrolledStudents, error: enrolledError } = await supabase
    .from('student_instructor_relationships')
    .select(`
      *,
      profiles:student_id (
        id,
        full_name,
        phone,
        email,
        created_at
      )
    `)
    .eq('instructor_id', instructorId)
    .eq('status', 'accepted')
    .order('created_at', { ascending: false });
    
  if (enrolledError) {
    console.error('Error fetching enrolled students:', enrolledError);
  } else {
    console.log(`Found ${enrolledStudents?.length || 0} enrolled students with status = 'accepted':`);
    enrolledStudents?.forEach(student => {
      console.log(`  - ${student.profiles?.full_name || 'Unknown'} (${student.profiles?.email || 'No email'})`);
    });
  }
  
  // 4. Test invited students query
  console.log('\n4. Testing invited students query:');
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
  
  console.log('\n✅ Verification complete!');
}

verifyStudentStatus().catch(console.error);
