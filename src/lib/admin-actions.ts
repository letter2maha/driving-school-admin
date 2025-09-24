import { supabaseAdmin } from './supabase'

/**
 * Admin action utilities for managing user applications
 */

export interface RejectionDetails {
  isRejected: boolean
  rejectedAt?: string
  rejectedBy?: string
  rejectionReason?: string
  user?: {
    full_name: string
    email: string
  }
}

/**
 * Reject a user application with detailed reason
 * @param userId - The user ID to reject
 * @param adminId - The admin user ID making the rejection
 * @param rejectionReason - Detailed reason for rejection
 * @returns Promise<boolean> - Success status
 */
export async function rejectUserApplication(
  userId: string, 
  adminId: string, 
  rejectionReason: string
): Promise<boolean> {
  try {
    console.log(`🚫 Rejecting application for user: ${userId}`)
    console.log(`👤 Admin: ${adminId}`)
    console.log(`📝 Reason: ${rejectionReason}`)

    // Get user role first
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('❌ Error fetching user profile:', profileError)
      throw new Error(`User with ID ${userId} not found`)
    }

    // Update verification status
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

    // Update main profile
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

    // Update instructor profile if applicable
    if (userProfile.role === 'instructor') {
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

    // Create notification (optional - don't fail if table doesn't exist)
    try {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'application_rejected',
          title: 'Application Rejected',
          message: `Your application has been rejected. Reason: ${rejectionReason}`,
          created_at: new Date().toISOString()
        })
    } catch (notificationError) {
      console.log('⚠️  Notification creation failed (table may not exist)')
    }

    console.log('✅ Application rejected successfully!')
    return true

  } catch (error) {
    console.error('❌ Error rejecting application:', error)
    throw error
  }
}

/**
 * Approve a user application
 * @param userId - The user ID to approve
 * @param adminId - The admin user ID making the approval
 * @returns Promise<boolean> - Success status
 */
export async function approveUserApplication(
  userId: string, 
  adminId: string
): Promise<boolean> {
  try {
    console.log(`✅ Approving application for user: ${userId}`)
    console.log(`👤 Admin: ${adminId}`)

    // Update verification status
    const { error: verificationError } = await supabaseAdmin
      .from('verification_status')
      .update({
        profile_approved: true,
        profile_approved_at: new Date().toISOString(),
        profile_approved_by: adminId,
        profile_rejection_reason: null, // Clear any previous rejection reason
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (verificationError) {
      console.error('❌ Error updating verification status:', verificationError)
      throw verificationError
    }

    // Update main profile
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

    // Create notification (optional)
    try {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'application_approved',
          title: 'Application Approved',
          message: 'Congratulations! Your application has been approved.',
          created_at: new Date().toISOString()
        })
    } catch (notificationError) {
      console.log('⚠️  Notification creation failed (table may not exist)')
    }

    console.log('✅ Application approved successfully!')
    return true

  } catch (error) {
    console.error('❌ Error approving application:', error)
    throw error
  }
}

/**
 * Get rejection details for a user
 * @param userId - The user ID
 * @returns Promise<RejectionDetails> - Rejection details
 */
export async function getRejectionDetails(userId: string): Promise<RejectionDetails> {
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
      user: data.profiles?.[0] || { full_name: '', email: '' }
    }

  } catch (error) {
    console.error('❌ Error getting rejection details:', error)
    throw error
  }
}

/**
 * Get application status for a user
 * @param userId - The user ID
 * @returns Promise<Object> - Application status
 */
export async function getApplicationStatus(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('verification_status')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('❌ Error fetching application status:', error)
      throw error
    }

    return {
      phoneVerified: data.phone_verified,
      kycStatus: data.kyc_status,
      profileCompleted: data.profile_completed,
      profileApproved: data.profile_approved,
      profileApprovedAt: data.profile_approved_at,
      profileApprovedBy: data.profile_approved_by,
      rejectionReason: data.profile_rejection_reason,
      status: data.profile_approved === null ? 'pending' : 
              data.profile_approved === true ? 'approved' : 'rejected'
    }

  } catch (error) {
    console.error('❌ Error getting application status:', error)
    throw error
  }
}

/**
 * Soft delete a user (marks as deleted but keeps data)
 * @param userId - The user ID to soft delete
 * @param adminId - The admin user ID making the deletion
 * @param reason - Optional reason for deletion
 * @returns Promise<boolean> - Success status
 */
export async function softDeleteUser(
  userId: string, 
  adminId: string, 
  reason?: string
): Promise<boolean> {
  try {
    console.log(`🗑️  Soft deleting user: ${userId}`)
    console.log(`👤 Admin: ${adminId}`)
    console.log(`📝 Reason: ${reason || 'No reason provided'}`)

    const now = new Date().toISOString()

    // Update profiles table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        updated_at: now
      })
      .eq('id', userId)

    if (profileError) {
      console.error('❌ Error updating profiles:', profileError)
      throw profileError
    }

    // Update verification_status table
    const { error: verificationError } = await supabaseAdmin
      .from('verification_status')
      .update({
        updated_at: now
      })
      .eq('id', userId)

    if (verificationError) {
      console.error('❌ Error updating verification_status:', verificationError)
      throw verificationError
    }

    // Update instructor_profiles table if exists
    const { error: instructorError } = await supabaseAdmin
      .from('instructor_profiles')
      .update({
        updated_at: now
      })
      .eq('id', userId)

    if (instructorError && !instructorError.message.includes('No rows found')) {
      console.error('❌ Error updating instructor_profiles:', instructorError)
      throw instructorError
    }

    // Update student_profiles table if exists
    const { error: studentError } = await supabaseAdmin
      .from('student_profiles')
      .update({
        updated_at: now
      })
      .eq('id', userId)

    if (studentError && !studentError.message.includes('No rows found')) {
      console.error('❌ Error updating student_profiles:', studentError)
      throw studentError
    }

    console.log('✅ User soft deleted successfully!')
    return true

  } catch (error) {
    console.error('❌ Error in softDeleteUser:', error)
    throw error
  }
}

/**
 * Hard delete a user (completely removes all data)
 * @param userId - The user ID to hard delete
 * @param adminId - The admin user ID making the deletion
 * @param reason - Optional reason for deletion
 * @returns Promise<boolean> - Success status
 */
export async function hardDeleteUser(
  userId: string, 
  adminId: string, 
  reason?: string
): Promise<boolean> {
  try {
    console.log(`💥 Hard deleting user: ${userId}`)
    console.log(`👤 Admin: ${adminId}`)
    console.log(`📝 Reason: ${reason || 'No reason provided'}`)

    // Delete from notifications first (if table exists)
    try {
      await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('user_id', userId)
    } catch (error) {
      console.log('⚠️  Notifications table may not exist, skipping...')
    }

    // Delete from lessons (if table exists)
    try {
      await supabaseAdmin
        .from('lessons')
        .delete()
        .or(`instructor_id.eq.${userId},student_id.eq.${userId}`)
    } catch (error) {
      console.log('⚠️  Lessons table may not exist, skipping...')
    }

    // Delete from working_hours (if table exists)
    try {
      await supabaseAdmin
        .from('working_hours')
        .delete()
        .eq('instructor_id', userId)
    } catch (error) {
      console.log('⚠️  Working_hours table may not exist, skipping...')
    }

    // Delete from date_overrides (if table exists)
    try {
      await supabaseAdmin
        .from('date_overrides')
        .delete()
        .eq('instructor_id', userId)
    } catch (error) {
      console.log('⚠️  Date_overrides table may not exist, skipping...')
    }

    // Delete from verification_status
    const { error: verificationError } = await supabaseAdmin
      .from('verification_status')
      .delete()
      .eq('id', userId)

    if (verificationError) {
      console.error('❌ Error deleting verification_status:', verificationError)
      throw verificationError
    }

    // Delete from instructor_profiles (if exists)
    const { error: instructorError } = await supabaseAdmin
      .from('instructor_profiles')
      .delete()
      .eq('id', userId)

    if (instructorError && !instructorError.message.includes('No rows found')) {
      console.error('❌ Error deleting instructor_profiles:', instructorError)
      throw instructorError
    }

    // Delete from student_profiles (if exists)
    const { error: studentError } = await supabaseAdmin
      .from('student_profiles')
      .delete()
      .eq('id', userId)

    if (studentError && !studentError.message.includes('No rows found')) {
      console.error('❌ Error deleting student_profiles:', studentError)
      throw studentError
    }

    // Delete from profiles (main table)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('❌ Error deleting profiles:', profileError)
      throw profileError
    }

    console.log('✅ User hard deleted successfully!')
    return true

  } catch (error) {
    console.error('❌ Error in hardDeleteUser:', error)
    throw error
  }
}

/**
 * Restore a soft deleted user
 * @param userId - The user ID to restore
 * @param adminId - The admin user ID making the restoration
 * @returns Promise<boolean> - Success status
 */
export async function restoreSoftDeletedUser(
  userId: string, 
  adminId: string
): Promise<boolean> {
  try {
    console.log(`🔄 Restoring soft deleted user: ${userId}`)
    console.log(`👤 Admin: ${adminId}`)

    const now = new Date().toISOString()

    // Update profiles table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        updated_at: now
      })
      .eq('id', userId)

    if (profileError) {
      console.error('❌ Error updating profiles:', profileError)
      throw profileError
    }

    // Update verification_status table
    const { error: verificationError } = await supabaseAdmin
      .from('verification_status')
      .update({
        updated_at: now
      })
      .eq('id', userId)

    if (verificationError) {
      console.error('❌ Error updating verification_status:', verificationError)
      throw verificationError
    }

    // Update instructor_profiles table if exists
    const { error: instructorError } = await supabaseAdmin
      .from('instructor_profiles')
      .update({
        updated_at: now
      })
      .eq('id', userId)

    if (instructorError && !instructorError.message.includes('No rows found')) {
      console.error('❌ Error updating instructor_profiles:', instructorError)
      throw instructorError
    }

    // Update student_profiles table if exists
    const { error: studentError } = await supabaseAdmin
      .from('student_profiles')
      .update({
        updated_at: now
      })
      .eq('id', userId)

    if (studentError && !studentError.message.includes('No rows found')) {
      console.error('❌ Error updating student_profiles:', studentError)
      throw studentError
    }

    console.log('✅ User restored successfully!')
    return true

  } catch (error) {
    console.error('❌ Error in restoreSoftDeletedUser:', error)
    throw error
  }
}
