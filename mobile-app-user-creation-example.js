// ========================================
// MOBILE APP: User Creation with Pending Status
// ========================================

import { supabase } from './lib/supabase' // Your Supabase client

/**
 * Create a new user with proper pending status
 * This should be used in your mobile app when a user completes registration
 */
export async function createUserWithPendingStatus(userData) {
  try {
    console.log('🚀 Creating new user with pending status...')
    
    // 1. Create the user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userData.id, // User ID from auth
        full_name: userData.full_name,
        email: userData.email,
        phone: userData.phone,
        role: 'instructor', // or 'student' depending on your app
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      console.error('❌ Error creating profile:', profileError)
      throw profileError
    }

    // 2. Create instructor profile (if applicable)
    let instructorProfile = null
    if (userData.role === 'instructor') {
      const { data: instructor, error: instructorError } = await supabase
        .from('instructor_profiles')
        .insert({
          user_id: userData.id,
          bio: userData.bio || '',
          experience_years: userData.experience_years || 0,
          expertise: userData.expertise || [],
          manual_price_min: userData.manual_price_min || 0,
          manual_price_max: userData.manual_price_max || 0,
          automatic_price_min: userData.automatic_price_min || 0,
          automatic_price_max: userData.automatic_price_max || 0,
          car_details: userData.car_details || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (instructorError) {
        console.error('❌ Error creating instructor profile:', instructorError)
        throw instructorError
      }
      
      instructorProfile = instructor
    }

    // 3. Create verification status with PENDING state
    const { data: verification, error: verificationError } = await supabase
      .from('verification_status')
      .insert({
        id: userData.id, // Same as user ID
        phone_verified: false, // Will be updated when phone is verified
        phone_verified_at: null,
        kyc_status: 'pending', // Will be updated when KYC is submitted
        kyc_submitted_at: null,
        kyc_approved_at: null,
        kyc_photo_id_path: null,
        kyc_instructor_id_path: null,
        profile_completed: false, // Will be updated when profile is completed
        profile_approved: null, // 🔑 KEY: Set to null for pending state
        profile_submitted_at: null,
        profile_approved_at: null, // Will be set when admin approves/rejects
        profile_approved_by: null, // Will be set when admin approves/rejects
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (verificationError) {
      console.error('❌ Error creating verification status:', verificationError)
      throw verificationError
    }

    console.log('✅ User created successfully with pending status!')
    
    return {
      profile,
      instructorProfile,
      verification,
      success: true
    }

  } catch (error) {
    console.error('❌ Error creating user:', error)
    throw error
  }
}

/**
 * Update verification status when user completes different steps
 */
export async function updateVerificationStep(userId, step, data = {}) {
  try {
    const updates = {
      updated_at: new Date().toISOString()
    }

    switch (step) {
      case 'phone_verified':
        updates.phone_verified = true
        updates.phone_verified_at = new Date().toISOString()
        break
        
      case 'kyc_submitted':
        updates.kyc_status = 'submitted'
        updates.kyc_submitted_at = new Date().toISOString()
        updates.kyc_photo_id_path = data.photo_id_path
        updates.kyc_instructor_id_path = data.instructor_id_path
        break
        
      case 'profile_completed':
        updates.profile_completed = true
        updates.profile_submitted_at = new Date().toISOString()
        // Keep profile_approved as null (pending admin review)
        break
        
      default:
        throw new Error(`Unknown verification step: ${step}`)
    }

    const { data, error } = await supabase
      .from('verification_status')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error(`❌ Error updating verification step ${step}:`, error)
      throw error
    }

    console.log(`✅ Verification step ${step} updated successfully`)
    return data

  } catch (error) {
    console.error('❌ Error updating verification step:', error)
    throw error
  }
}

// ========================================
// USAGE EXAMPLES
// ========================================

/**
 * Example: Complete user registration flow
 */
export async function completeUserRegistration(userData) {
  try {
    // Step 1: Create user with pending status
    const user = await createUserWithPendingStatus(userData)
    
    // Step 2: Update phone verification (when phone is verified)
    await updateVerificationStep(userData.id, 'phone_verified')
    
    // Step 3: Update KYC submission (when documents are uploaded)
    await updateVerificationStep(userData.id, 'kyc_submitted', {
      photo_id_path: userData.photo_id_path,
      instructor_id_path: userData.instructor_id_path
    })
    
    // Step 4: Mark profile as completed (when all steps are done)
    await updateVerificationStep(userData.id, 'profile_completed')
    
    console.log('🎉 User registration completed! Status: Pending Admin Review')
    
    return {
      success: true,
      message: 'Registration completed. Your application is pending admin review.',
      status: 'pending'
    }
    
  } catch (error) {
    console.error('❌ Registration failed:', error)
    throw error
  }
}

/**
 * Example: Check user status
 */
export async function getUserStatus(userId) {
  try {
    const { data, error } = await supabase
      .from('verification_status')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('❌ Error fetching user status:', error)
      throw error
    }

    // Determine status based on profile_approved value
    let status = 'pending'
    if (data.profile_approved === true) {
      status = 'approved'
    } else if (data.profile_approved === false && data.profile_approved_at) {
      status = 'rejected'
    }

    return {
      ...data,
      status,
      canEdit: status === 'pending' // User can edit if still pending
    }

  } catch (error) {
    console.error('❌ Error getting user status:', error)
    throw error
  }
}
