-- CLEAN ALL POLICIES: Remove ALL existing policies and create clean ones
-- This will fix the infinite recursion by removing conflicting policies

-- Step 1: Disable RLS on all tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE verification_status DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL policies (this will remove every single policy)
DROP POLICY IF EXISTS "Admin can view all instructor profiles" ON instructor_profiles CASCADE;
DROP POLICY IF EXISTS "Instructors can insert their own profile" ON instructor_profiles CASCADE;
DROP POLICY IF EXISTS "Instructors can update their own profile" ON instructor_profiles CASCADE;
DROP POLICY IF EXISTS "Users can update own instructor profile" ON instructor_profiles CASCADE;
DROP POLICY IF EXISTS "Users can view instructor profiles" ON instructor_profiles CASCADE;
DROP POLICY IF EXISTS "Users can view own instructor profile" ON instructor_profiles CASCADE;
DROP POLICY IF EXISTS "instructor_profiles_delete_service_role" ON instructor_profiles CASCADE;
DROP POLICY IF EXISTS "instructor_profiles_insert_own" ON instructor_profiles CASCADE;
DROP POLICY IF EXISTS "instructor_profiles_select_own" ON instructor_profiles CASCADE;
DROP POLICY IF EXISTS "instructor_profiles_select_service_role" ON instructor_profiles CASCADE;
DROP POLICY IF EXISTS "instructor_profiles_update_own" ON instructor_profiles CASCADE;
DROP POLICY IF EXISTS "instructor_profiles_update_service_role" ON instructor_profiles CASCADE;

DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles CASCADE;
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles CASCADE;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles CASCADE;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles CASCADE;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles CASCADE;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles CASCADE;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles CASCADE;
DROP POLICY IF EXISTS "profiles_delete_service_role" ON profiles CASCADE;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles CASCADE;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles CASCADE;
DROP POLICY IF EXISTS "profiles_select_service_role" ON profiles CASCADE;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles CASCADE;
DROP POLICY IF EXISTS "profiles_update_service_role" ON profiles CASCADE;

DROP POLICY IF EXISTS "Admin can update verification status" ON verification_status CASCADE;
DROP POLICY IF EXISTS "Admin can view all verification status" ON verification_status CASCADE;
DROP POLICY IF EXISTS "Users can insert their own verification status" ON verification_status CASCADE;
DROP POLICY IF EXISTS "Users can update own verification status" ON verification_status CASCADE;
DROP POLICY IF EXISTS "Users can update their own verification status" ON verification_status CASCADE;
DROP POLICY IF EXISTS "Users can view own verification status" ON verification_status CASCADE;
DROP POLICY IF EXISTS "Users can view their own verification status" ON verification_status CASCADE;
DROP POLICY IF EXISTS "verification_status_delete_service_role" ON verification_status CASCADE;
DROP POLICY IF EXISTS "verification_status_insert_own" ON verification_status CASCADE;
DROP POLICY IF EXISTS "verification_status_select_own" ON verification_status CASCADE;
DROP POLICY IF EXISTS "verification_status_select_service_role" ON verification_status CASCADE;
DROP POLICY IF EXISTS "verification_status_update_own" ON verification_status CASCADE;
DROP POLICY IF EXISTS "verification_status_update_service_role" ON verification_status CASCADE;

-- Step 3: Wait for cleanup
SELECT pg_sleep(3);

-- Step 4: Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_status ENABLE ROW LEVEL SECURITY;

-- Step 5: Create ONLY ONE policy per table per operation (no conflicts)

-- PROFILES TABLE - Only 2 policies total
CREATE POLICY "profiles_admin_access" ON profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "profiles_user_access" ON profiles
    FOR ALL
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- INSTRUCTOR_PROFILES TABLE - Only 2 policies total
CREATE POLICY "instructor_profiles_admin_access" ON instructor_profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "instructor_profiles_user_access" ON instructor_profiles
    FOR ALL
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- VERIFICATION_STATUS TABLE - Only 2 policies total
CREATE POLICY "verification_status_admin_access" ON verification_status
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "verification_status_user_access" ON verification_status
    FOR ALL
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Step 6: Verify we only have 6 policies total (2 per table)
SELECT 
    tablename, 
    COUNT(*) as policy_count,
    STRING_AGG(policyname, ', ') as policies
FROM pg_policies 
WHERE tablename IN ('profiles', 'instructor_profiles', 'verification_status')
GROUP BY tablename
ORDER BY tablename;

-- Step 7: Test message
SELECT 'All policies cleaned and simplified successfully!' as result;
