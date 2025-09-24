const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client with service role key
const supabaseUrl = 'https://parriuibqsfakwlmbdac.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcnJpdWlicXNmYWt3bG1iZGFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzIxMjEyOSwiZXhwIjoyMDY4Nzg4MTI5fQ.PND9kJQ4mc1UVJmpDZ27w6AoT85mdFKY0kNZT20vVi8'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testSimpleDelete() {
  console.log('🧪 Testing Simple Delete Functions...\n')

  try {
    // Get admin user ID
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', 'admin@drivedash.co.uk')
      .single()

    if (adminError || !adminUser) {
      console.error('❌ Could not find admin user:', adminError)
      return
    }

    const adminId = adminUser.id
    console.log('✅ Admin user found:', adminId)

    // Get a test user to delete (not admin)
    const { data: testUsers, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .neq('id', adminId)
      .limit(1)

    if (usersError || !testUsers || testUsers.length === 0) {
      console.error('❌ Could not find test user:', usersError)
      return
    }

    const testUser = testUsers[0]
    console.log('✅ Test user found:', testUser.full_name, '(' + testUser.email + ')')

    // Test 1: Soft Delete (just update timestamp)
    console.log('\n🗑️  Testing Soft Delete...')
    const now = new Date().toISOString()
    
    // Update profiles table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ updated_at: now })
      .eq('id', testUser.id)

    if (profileError) {
      console.error('❌ Error updating profiles:', profileError)
    } else {
      console.log('✅ Profiles table updated successfully')
    }

    // Update verification_status table
    const { error: verificationError } = await supabaseAdmin
      .from('verification_status')
      .update({ updated_at: now })
      .eq('id', testUser.id)

    if (verificationError) {
      console.error('❌ Error updating verification_status:', verificationError)
    } else {
      console.log('✅ Verification_status table updated successfully')
    }

    // Update instructor_profiles table if exists
    const { error: instructorError } = await supabaseAdmin
      .from('instructor_profiles')
      .update({ updated_at: now })
      .eq('id', testUser.id)

    if (instructorError && !instructorError.message.includes('No rows found')) {
      console.error('❌ Error updating instructor_profiles:', instructorError)
    } else {
      console.log('✅ Instructor_profiles table updated successfully (or no rows found)')
    }

    // Update student_profiles table if exists
    const { error: studentError } = await supabaseAdmin
      .from('student_profiles')
      .update({ updated_at: now })
      .eq('id', testUser.id)

    if (studentError && !studentError.message.includes('No rows found')) {
      console.error('❌ Error updating student_profiles:', studentError)
    } else {
      console.log('✅ Student_profiles table updated successfully (or no rows found)')
    }

    console.log('\n✅ Soft delete test completed successfully!')
    console.log('Note: This is a simplified version that just updates timestamps.')
    console.log('For full soft delete functionality, you would need to add deleted_at columns to the database.')

    // Test 2: Hard Delete (WARNING: This will permanently delete the user!)
    console.log('\n💥 Testing Hard Delete (WARNING: This will permanently delete the user!)...')
    
    // Ask for confirmation
    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const answer = await new Promise((resolve) => {
      rl.question('Are you sure you want to permanently delete this user? (yes/no): ', resolve)
    })
    rl.close()

    if (answer.toLowerCase() === 'yes') {
      console.log('🗑️  Proceeding with hard delete...')
      
      // Delete from verification_status
      const { error: verificationDeleteError } = await supabaseAdmin
        .from('verification_status')
        .delete()
        .eq('id', testUser.id)

      if (verificationDeleteError) {
        console.error('❌ Error deleting verification_status:', verificationDeleteError)
      } else {
        console.log('✅ Verification_status deleted successfully')
      }

      // Delete from instructor_profiles (if exists)
      const { error: instructorDeleteError } = await supabaseAdmin
        .from('instructor_profiles')
        .delete()
        .eq('id', testUser.id)

      if (instructorDeleteError && !instructorDeleteError.message.includes('No rows found')) {
        console.error('❌ Error deleting instructor_profiles:', instructorDeleteError)
      } else {
        console.log('✅ Instructor_profiles deleted successfully (or no rows found)')
      }

      // Delete from student_profiles (if exists)
      const { error: studentDeleteError } = await supabaseAdmin
        .from('student_profiles')
        .delete()
        .eq('id', testUser.id)

      if (studentDeleteError && !studentDeleteError.message.includes('No rows found')) {
        console.error('❌ Error deleting student_profiles:', studentDeleteError)
      } else {
        console.log('✅ Student_profiles deleted successfully (or no rows found)')
      }

      // Delete from profiles (main table)
      const { error: profileDeleteError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', testUser.id)

      if (profileDeleteError) {
        console.error('❌ Error deleting profiles:', profileDeleteError)
      } else {
        console.log('✅ Profiles deleted successfully')
        console.log('⚠️  User has been permanently deleted!')
      }
    } else {
      console.log('⏭️  Skipping hard delete test')
    }

    console.log('\n🎉 Simple delete function tests completed!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testSimpleDelete()
