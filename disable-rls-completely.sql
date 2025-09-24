-- Completely disable RLS on all tables
-- This will allow your admin dashboard to work immediately

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE verification_status DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "profiles_read_all" ON profiles;
DROP POLICY IF EXISTS "profiles_write_all" ON profiles;
DROP POLICY IF EXISTS "profiles_service_full" ON profiles;
DROP POLICY IF EXISTS "profiles_auth_read" ON profiles;

DROP POLICY IF EXISTS "instructor_profiles_read_all" ON instructor_profiles;
DROP POLICY IF EXISTS "instructor_profiles_write_all" ON instructor_profiles;
DROP POLICY IF EXISTS "instructor_profiles_service_full" ON instructor_profiles;
DROP POLICY IF EXISTS "instructor_profiles_auth_read" ON instructor_profiles;

DROP POLICY IF EXISTS "verification_status_read_all" ON verification_status;
DROP POLICY IF EXISTS "verification_status_write_all" ON verification_status;
DROP POLICY IF EXISTS "verification_status_service_full" ON verification_status;
DROP POLICY IF EXISTS "verification_status_auth_read" ON verification_status;

-- Test message
SELECT 'RLS completely disabled - admin dashboard should work now!' as result;
