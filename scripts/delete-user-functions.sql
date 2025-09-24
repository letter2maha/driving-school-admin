-- =====================================================
-- USER DELETION FUNCTIONS
-- =====================================================

-- 1. SOFT DELETE FUNCTION
-- Sets deleted_at timestamp but keeps all data
CREATE OR REPLACE FUNCTION soft_delete_user(
  user_id UUID,
  admin_id UUID,
  reason TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  deleted_count INTEGER := 0;
BEGIN
  -- Update profiles table with soft delete
  UPDATE profiles 
  SET 
    deleted_at = NOW(),
    deleted_by = admin_id,
    deletion_reason = reason,
    updated_at = NOW()
  WHERE id = user_id AND deleted_at IS NULL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Update verification_status table
  UPDATE verification_status 
  SET 
    deleted_at = NOW(),
    deleted_by = admin_id,
    deletion_reason = reason,
    updated_at = NOW()
  WHERE id = user_id AND deleted_at IS NULL;
  
  -- Update instructor_profiles table (if exists)
  UPDATE instructor_profiles 
  SET 
    deleted_at = NOW(),
    deleted_by = admin_id,
    deletion_reason = reason,
    updated_at = NOW()
  WHERE id = user_id AND deleted_at IS NULL;
  
  -- Update student_profiles table (if exists)
  UPDATE student_profiles 
  SET 
    deleted_at = NOW(),
    deleted_by = admin_id,
    deletion_reason = reason,
    updated_at = NOW()
  WHERE id = user_id AND deleted_at IS NULL;
  
  -- Create notification for the deletion
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    created_at
  ) VALUES (
    user_id,
    'account_deleted',
    'Account Soft Deleted',
    COALESCE('Your account has been soft deleted. Reason: ' || reason, 'Your account has been soft deleted by an administrator.'),
    NOW()
  );
  
  result := json_build_object(
    'success', true,
    'message', 'User soft deleted successfully',
    'user_id', user_id,
    'deleted_at', NOW(),
    'deleted_by', admin_id,
    'reason', reason,
    'records_updated', deleted_count
  );
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  result := json_build_object(
    'success', false,
    'message', 'Error soft deleting user: ' || SQLERRM,
    'error_code', SQLSTATE
  );
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 2. HARD DELETE FUNCTION
-- Completely removes all user data
CREATE OR REPLACE FUNCTION hard_delete_user(
  user_id UUID,
  admin_id UUID,
  reason TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  deleted_count INTEGER := 0;
  temp_count INTEGER;
BEGIN
  -- Delete from notifications first (foreign key constraint)
  DELETE FROM notifications WHERE user_id = user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Delete from lessons (if any)
  DELETE FROM lessons WHERE instructor_id = user_id OR student_id = user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Delete from working_hours (if any)
  DELETE FROM working_hours WHERE instructor_id = user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Delete from date_overrides (if any)
  DELETE FROM date_overrides WHERE instructor_id = user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Delete from verification_status
  DELETE FROM verification_status WHERE id = user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Delete from instructor_profiles (if exists)
  DELETE FROM instructor_profiles WHERE id = user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Delete from student_profiles (if exists)
  DELETE FROM student_profiles WHERE id = user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Delete from profiles (main table)
  DELETE FROM profiles WHERE id = user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Delete from auth.users (Supabase auth table)
  -- Note: This requires superuser privileges or RLS bypass
  -- DELETE FROM auth.users WHERE id = user_id;
  
  result := json_build_object(
    'success', true,
    'message', 'User hard deleted successfully',
    'user_id', user_id,
    'deleted_at', NOW(),
    'deleted_by', admin_id,
    'reason', reason,
    'records_deleted', deleted_count
  );
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  result := json_build_object(
    'success', false,
    'message', 'Error hard deleting user: ' || SQLERRM,
    'error_code', SQLSTATE
  );
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 3. RESTORE SOFT DELETED USER FUNCTION
CREATE OR REPLACE FUNCTION restore_soft_deleted_user(
  user_id UUID,
  admin_id UUID
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  restored_count INTEGER := 0;
BEGIN
  -- Restore profiles table
  UPDATE profiles 
  SET 
    deleted_at = NULL,
    deleted_by = NULL,
    deletion_reason = NULL,
    updated_at = NOW()
  WHERE id = user_id AND deleted_at IS NOT NULL;
  
  GET DIAGNOSTICS restored_count = ROW_COUNT;
  
  -- Restore verification_status table
  UPDATE verification_status 
  SET 
    deleted_at = NULL,
    deleted_by = NULL,
    deletion_reason = NULL,
    updated_at = NOW()
  WHERE id = user_id AND deleted_at IS NOT NULL;
  
  -- Restore instructor_profiles table (if exists)
  UPDATE instructor_profiles 
  SET 
    deleted_at = NULL,
    deleted_by = NULL,
    deletion_reason = NULL,
    updated_at = NOW()
  WHERE id = user_id AND deleted_at IS NOT NULL;
  
  -- Restore student_profiles table (if exists)
  UPDATE student_profiles 
  SET 
    deleted_at = NULL,
    deleted_by = NULL,
    deletion_reason = NULL,
    updated_at = NOW()
  WHERE id = user_id AND deleted_at IS NOT NULL;
  
  -- Create notification for the restoration
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    created_at
  ) VALUES (
    user_id,
    'account_restored',
    'Account Restored',
    'Your account has been restored by an administrator.',
    NOW()
  );
  
  result := json_build_object(
    'success', true,
    'message', 'User restored successfully',
    'user_id', user_id,
    'restored_at', NOW(),
    'restored_by', admin_id,
    'records_restored', restored_count
  );
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  result := json_build_object(
    'success', false,
    'message', 'Error restoring user: ' || SQLERRM,
    'error_code', SQLSTATE
  );
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ADD DELETION COLUMNS TO EXISTING TABLES
-- =====================================================

-- Add soft delete columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Add soft delete columns to verification_status table
ALTER TABLE verification_status 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Add soft delete columns to instructor_profiles table
ALTER TABLE instructor_profiles 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Add soft delete columns to student_profiles table
ALTER TABLE student_profiles 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes for soft delete queries
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at);
CREATE INDEX IF NOT EXISTS idx_verification_status_deleted_at ON verification_status(deleted_at);
CREATE INDEX IF NOT EXISTS idx_instructor_profiles_deleted_at ON instructor_profiles(deleted_at);
CREATE INDEX IF NOT EXISTS idx_student_profiles_deleted_at ON student_profiles(deleted_at);

-- =====================================================
-- UPDATE RLS POLICIES TO EXCLUDE SOFT DELETED USERS
-- =====================================================

-- Update profiles RLS policy to exclude soft deleted users
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
CREATE POLICY "Admin can view all profiles" ON profiles 
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ) AND deleted_at IS NULL
);

-- Update verification_status RLS policy
DROP POLICY IF EXISTS "Admin can view all verification status" ON verification_status;
CREATE POLICY "Admin can view all verification status" ON verification_status 
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ) AND deleted_at IS NULL
);

-- Update instructor_profiles RLS policy
DROP POLICY IF EXISTS "Admin can view all instructor profiles" ON instructor_profiles;
CREATE POLICY "Admin can view all instructor profiles" ON instructor_profiles 
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ) AND deleted_at IS NULL
);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION soft_delete_user(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION hard_delete_user(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_soft_deleted_user(UUID, UUID) TO authenticated;
