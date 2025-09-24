-- Temporarily disable RLS to test if policies are the issue
-- This will help us determine if the problem is with RLS or something else

-- Disable RLS on all tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE verification_status DISABLE ROW LEVEL SECURITY;

-- Drop any remaining policies
DROP POLICY IF EXISTS "profiles_admin_access" ON profiles CASCADE;
DROP POLICY IF EXISTS "profiles_user_access" ON profiles CASCADE;
DROP POLICY IF EXISTS "instructor_profiles_admin_access" ON instructor_profiles CASCADE;
DROP POLICY IF EXISTS "instructor_profiles_user_access" ON instructor_profiles CASCADE;
DROP POLICY IF EXISTS "verification_status_admin_access" ON verification_status CASCADE;
DROP POLICY IF EXISTS "verification_status_user_access" ON verification_status CASCADE;

-- Test message
SELECT 'RLS disabled temporarily for testing' as result;
