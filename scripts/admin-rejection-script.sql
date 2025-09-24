-- Complete rejection script for admin dashboard
-- This script handles rejection of user applications with proper status updates

BEGIN;

-- Function to reject a user application
-- Parameters: user_id, admin_id, rejection_reason
CREATE OR REPLACE FUNCTION reject_user_application(
  p_user_id UUID,
  p_admin_id UUID,
  p_rejection_reason TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get user role
  SELECT role INTO user_role FROM profiles WHERE id = p_user_id;
  
  IF user_role IS NULL THEN
    RAISE EXCEPTION 'User with ID % not found', p_user_id;
  END IF;

  -- 1. Update verification status
  UPDATE verification_status 
  SET 
    kyc_status = 'pending',
    profile_completed = false,
    profile_approved = false,
    profile_approved_at = NOW(),
    profile_approved_by = p_admin_id,
    profile_rejection_reason = p_rejection_reason,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- 2. Update main profile
  UPDATE profiles 
  SET 
    updated_at = NOW()
  WHERE id = p_user_id;

  -- 3. Update instructor profile (if user is instructor)
  IF user_role = 'instructor' THEN
    UPDATE instructor_profiles 
    SET 
      updated_at = NOW()
    WHERE id = p_user_id;
  END IF;

  -- 4. Update student profile (if user is student)
  IF user_role = 'student' THEN
    UPDATE student_profiles 
    SET 
      updated_at = NOW()
    WHERE id = p_user_id;
  END IF;

  -- 5. Insert notification record (if notifications table exists)
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    created_at
  ) VALUES (
    p_user_id,
    'application_rejected',
    'Application Rejected',
    'Your application has been rejected. Reason: ' || p_rejection_reason,
    NOW()
  ) ON CONFLICT DO NOTHING; -- Ignore if notifications table doesn't exist

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT reject_user_application(
--   'user-uuid-here'::UUID,
--   'admin-uuid-here'::UUID,
--   'Incomplete KYC documents. Please resubmit with clear photos.'
-- );

COMMIT;
