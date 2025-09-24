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

async function testDeleteFunctions() {
  console.log('🧪 Testing Delete Functions...\n')

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
      .is('deleted_at', null)
      .limit(1)

    if (usersError || !testUsers || testUsers.length === 0) {
      console.error('❌ Could not find test user:', usersError)
      return
    }

    const testUser = testUsers[0]
    console.log('✅ Test user found:', testUser.full_name, '(' + testUser.email + ')')

    // Test 1: Soft Delete
    console.log('\n🗑️  Testing Soft Delete...')
    const { data: softDeleteResult, error: softDeleteError } = await supabaseAdmin
      .rpc('soft_delete_user', {
        user_id: testUser.id,
        admin_id: adminId,
        reason: 'Test soft delete from script'
      })

    if (softDeleteError) {
      console.error('❌ Soft delete failed:', softDeleteError)
    } else {
      console.log('✅ Soft delete successful:', softDeleteResult)
    }

    // Verify soft delete worked
    const { data: softDeletedUser, error: softCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, deleted_at, deletion_reason')
      .eq('id', testUser.id)
      .single()

    if (softCheckError) {
      console.error('❌ Could not verify soft delete:', softCheckError)
    } else {
      console.log('✅ Soft delete verified:', softDeletedUser)
    }

    // Test 2: Restore Soft Deleted User
    console.log('\n🔄 Testing Restore...')
    const { data: restoreResult, error: restoreError } = await supabaseAdmin
      .rpc('restore_soft_deleted_user', {
        user_id: testUser.id,
        admin_id: adminId
      })

    if (restoreError) {
      console.error('❌ Restore failed:', restoreError)
    } else {
      console.log('✅ Restore successful:', restoreResult)
    }

    // Verify restore worked
    const { data: restoredUser, error: restoreCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, deleted_at')
      .eq('id', testUser.id)
      .single()

    if (restoreCheckError) {
      console.error('❌ Could not verify restore:', restoreCheckError)
    } else {
      console.log('✅ Restore verified:', restoredUser)
    }

    // Test 3: Hard Delete (WARNING: This will permanently delete the user!)
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
      const { data: hardDeleteResult, error: hardDeleteError } = await supabaseAdmin
        .rpc('hard_delete_user', {
          user_id: testUser.id,
          admin_id: adminId,
          reason: 'Test hard delete from script'
        })

      if (hardDeleteError) {
        console.error('❌ Hard delete failed:', hardDeleteError)
      } else {
        console.log('✅ Hard delete successful:', hardDeleteResult)
      }

      // Verify hard delete worked (user should not exist)
      const { data: hardDeletedUser, error: hardCheckError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name')
        .eq('id', testUser.id)
        .single()

      if (hardCheckError && hardCheckError.code === 'PGRST116') {
        console.log('✅ Hard delete verified: User no longer exists in database')
      } else {
        console.log('⚠️  Hard delete verification: User still exists:', hardDeletedUser)
      }
    } else {
      console.log('⏭️  Skipping hard delete test')
    }

    console.log('\n🎉 Delete function tests completed!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testDeleteFunctions()
