const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client with service role key
const supabaseAdmin = createClient(
  'https://parriuibqsfakwlmbdac.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcnJpdWlicXNmYWt3bG1iZGFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzIxMjEyOSwiZXhwIjoyMDY4Nzg4MTI5fQ.PND9kJQ4mc1UVJmpDZ27w6AoT85mdFKY0kNZT20vVi8',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * Reject a user application with detailed reason
 * @param {string} userId - The user ID to reject
 * @param {string} adminId - The admin user ID making the rejection
 * @param {string} rejectionReason - Detailed reason for rejection
 * @returns {Promise<boolean>} - Success status
 */
async function rejectUserApplication(userId, adminId, rejectionReason) {
  try {
    console.log(`🚫 Rejecting application for user: ${userId}`)
    console.log(`👤 Admin: ${adminId}`)
    console.log(`📝 Reason: ${rejectionReason}`)

    // Start transaction
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('❌ Error fetching user profile:', profileError)
      throw new Error(`User with ID ${userId} not found`)
    }

    console.log(`👤 User role: ${userProfile.role}`)

    // 1. Update verification status
    console.log('📊 Updating verification status...')
    const { error: verificationError } = await supabaseAdmin
      .from('verification_status')
      .update({
        kyc_status: 'pending',
        profile_completed: false,
        profile_approved: false,
        profile_approved_at: new Date().toISOString(),
        profile_approved_by: adminId,
        profile_rejection_reason: rejectionReason,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (verificationError) {
      console.error('❌ Error updating verification status:', verificationError)
      throw verificationError
    }

    // 2. Update main profile
    console.log('👤 Updating main profile...')
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (profileUpdateError) {
      console.error('❌ Error updating main profile:', profileUpdateError)
      throw profileUpdateError
    }

    // 3. Update instructor profile (if user is instructor)
    if (userProfile.role === 'instructor') {
      console.log('🎓 Updating instructor profile...')
      const { error: instructorError } = await supabaseAdmin
        .from('instructor_profiles')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (instructorError) {
        console.error('❌ Error updating instructor profile:', instructorError)
        throw instructorError
      }
    }

    // 4. Update student profile (if user is student)
    if (userProfile.role === 'student') {
      console.log('📚 Updating student profile...')
      const { error: studentError } = await supabaseAdmin
        .from('student_profiles')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (studentError) {
        console.error('❌ Error updating student profile:', studentError)
        throw studentError
      }
    }

    // 5. Create notification (if notifications table exists)
    console.log('🔔 Creating notification...')
    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'application_rejected',
        title: 'Application Rejected',
        message: `Your application has been rejected. Reason: ${rejectionReason}`,
        created_at: new Date().toISOString()
      })

    if (notificationError) {
      console.log('⚠️  Notification creation failed (table may not exist):', notificationError.message)
      // Don't throw error for notifications - it's optional
    }

    console.log('✅ Application rejected successfully!')
    return true

  } catch (error) {
    console.error('❌ Error rejecting application:', error)
    throw error
  }
}

/**
 * Get rejection details for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} - Rejection details
 */
async function getRejectionDetails(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('verification_status')
      .select(`
        profile_approved,
        profile_approved_at,
        profile_approved_by,
        profile_rejection_reason,
        profiles!inner(full_name, email)
      `)
      .eq('id', userId)
      .single()

    if (error) {
      console.error('❌ Error fetching rejection details:', error)
      throw error
    }

    return {
      isRejected: data.profile_approved === false,
      rejectedAt: data.profile_approved_at,
      rejectedBy: data.profile_approved_by,
      rejectionReason: data.profile_rejection_reason,
      user: data.profiles
    }

  } catch (error) {
    console.error('❌ Error getting rejection details:', error)
    throw error
  }
}

// Example usage
async function example() {
  try {
    // Example: Reject an application
    const success = await rejectUserApplication(
      'user-uuid-here',
      'admin-uuid-here',
      'Incomplete KYC documents. Please resubmit with clear photos of your ID and instructor license.'
    )
    
    if (success) {
      console.log('🎉 Rejection completed successfully!')
    }

    // Example: Get rejection details
    const details = await getRejectionDetails('user-uuid-here')
    console.log('📋 Rejection details:', details)

  } catch (error) {
    console.error('💥 Example failed:', error.message)
  }
}

// Export functions for use in other modules
module.exports = {
  rejectUserApplication,
  getRejectionDetails
}

// Run example if this file is executed directly
if (require.main === module) {
  console.log('🚀 Running rejection script example...')
  console.log('📝 To use this script:')
  console.log('1. Replace user-uuid-here with actual user ID')
  console.log('2. Replace admin-uuid-here with actual admin ID')
  console.log('3. Update rejection reason as needed')
  console.log('4. Run: node scripts/reject-application.js')
  console.log('')
  
  // Uncomment to run example:
  // example()
}
