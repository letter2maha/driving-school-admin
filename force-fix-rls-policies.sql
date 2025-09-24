-- FORCE FIX: Completely clear and recreate RLS policies
-- This will aggressively remove ALL policies and recreate them
-- Run this in your Supabase SQL Editor

-- Step 1: Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('profiles', 'instructor_profiles', 'verification_status');

-- Step 2: Disable RLS completely
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE verification_status DISABLE ROW LEVEL SECURITY;

-- Step 3: Drop ALL possible policies (using CASCADE to remove dependencies)
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles CASCADE;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles CASCADE;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles CASCADE;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles CASCADE;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles CASCADE;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles CASCADE;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles CASCADE;
DROP POLICY IF EXISTS "profiles_delete_own" ON profiles CASCADE;
DROP POLICY IF EXISTS "profiles_select_service_role" ON profiles CASCADE;
DROP POLICY IF EXISTS "profiles_update_service_role" ON profiles CASCADE;
DROP POLICY IF EXISTS "profiles_delete_service_role" ON profiles CASCADE;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles CASCADE;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles CASCADE;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles CASCADE;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON profiles CASCADE;
DROP POLICY IF EXISTS "profiles_policy" ON profiles CASCADE;
DROP POLICY IF EXISTS "profiles_all_policy" ON profiles CASCADE;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles CASCADE;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles CASCADE;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles CASCADE;

-- Drop instructor_profiles policies
DROP POLICY IF EXISTS "instructor_profiles_select_policy" ON instructor_profiles CASCADE;
DROP POLICY IF EXISTS "instructor_profiles_insert_policy" ON instructor_profiles CASCADE;
DROP POLICY IF EXISTS "instructor_profiles_update_policy" ON instructor_profiles CASCADE;
DROP POLICY IF EXISTS "instructor_profiles_delete_policy" ON instructor_profiles CASCADE;
DROP POLICY IF EXISTS "instructor_profiles_select_own" ON instructor_profiles CASCADE;
DROP POLICY IF EXISTS "instructor_profiles_insert_own" ON instructor_profiles CASCADE;
DROP POLICY IF EXISTS "instructor_profiles_update_own" ON instructor_profiles CASCADE;
DROP POLICY IF EXISTS "instructor_profiles_select_service_role" ON instructor_profiles CASCADE;
DROP POLICY IF EXISTS "instructor_profiles_update_service_role" ON instructor_profiles CASCADE;
DROP POLICY IF EXISTS "instructor_profiles_delete_service_role" ON instructor_profiles CASCADE;

-- Drop verification_status policies
DROP POLICY IF EXISTS "verification_status_select_policy" ON verification_status CASCADE;
DROP POLICY IF EXISTS "verification_status_insert_policy" ON verification_status CASCADE;
DROP POLICY IF EXISTS "verification_status_update_policy" ON verification_status CASCADE;
DROP POLICY IF EXISTS "verification_status_delete_policy" ON verification_status CASCADE;
DROP POLICY IF EXISTS "verification_status_select_own" ON verification_status CASCADE;
DROP POLICY IF EXISTS "verification_status_insert_own" ON verification_status CASCADE;
DROP POLICY IF EXISTS "verification_status_update_own" ON verification_status CASCADE;
DROP POLICY IF EXISTS "verification_status_select_service_role" ON verification_status CASCADE;
DROP POLICY IF EXISTS "verification_status_update_service_role" ON verification_status CASCADE;
DROP POLICY IF EXISTS "verification_status_delete_service_role" ON verification_status CASCADE;

-- Step 4: Wait a moment for cleanup
SELECT pg_sleep(2);

-- Step 5: Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_status ENABLE ROW LEVEL SECURITY;

-- Step 6: Create simple, clean policies

-- PROFILES: Only allow service role access (admin dashboard)
CREATE POLICY "profiles_service_role_all" ON profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- PROFILES: Allow users to access their own profile only
CREATE POLICY "profiles_user_own" ON profiles
    FOR ALL
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- INSTRUCTOR_PROFILES: Only allow service role access (admin dashboard)
CREATE POLICY "instructor_profiles_service_role_all" ON instructor_profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- INSTRUCTOR_PROFILES: Allow users to access their own profile only
CREATE POLICY "instructor_profiles_user_own" ON instructor_profiles
    FOR ALL
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- VERIFICATION_STATUS: Only allow service role access (admin dashboard)
CREATE POLICY "verification_status_service_role_all" ON verification_status
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- VERIFICATION_STATUS: Allow users to access their own status only
CREATE POLICY "verification_status_user_own" ON verification_status
    FOR ALL
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Step 7: Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('profiles', 'instructor_profiles', 'verification_status')
ORDER BY tablename, policyname;

-- Step 8: Test with a simple query
SELECT 'Policy test completed successfully' as result;
