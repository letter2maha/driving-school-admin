-- Fix RLS policies to resolve infinite recursion error
-- Run this in your Supabase SQL Editor

-- First, disable RLS temporarily to clear existing policies
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE verification_status DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to clear any conflicting ones
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

DROP POLICY IF EXISTS "instructor_profiles_select_policy" ON instructor_profiles;
DROP POLICY IF EXISTS "instructor_profiles_insert_policy" ON instructor_profiles;
DROP POLICY IF EXISTS "instructor_profiles_update_policy" ON instructor_profiles;
DROP POLICY IF EXISTS "instructor_profiles_delete_policy" ON instructor_profiles;

DROP POLICY IF EXISTS "verification_status_select_policy" ON verification_status;
DROP POLICY IF EXISTS "verification_status_insert_policy" ON verification_status;
DROP POLICY IF EXISTS "verification_status_update_policy" ON verification_status;
DROP POLICY IF EXISTS "verification_status_delete_policy" ON verification_status;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_status ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "profiles_delete_policy" ON profiles
    FOR DELETE
    TO authenticated
    USING (true);

-- Instructor profiles policies
CREATE POLICY "instructor_profiles_select_policy" ON instructor_profiles
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "instructor_profiles_insert_policy" ON instructor_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "instructor_profiles_update_policy" ON instructor_profiles
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "instructor_profiles_delete_policy" ON instructor_profiles
    FOR DELETE
    TO authenticated
    USING (true);

-- Verification status policies
CREATE POLICY "verification_status_select_policy" ON verification_status
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "verification_status_insert_policy" ON verification_status
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "verification_status_update_policy" ON verification_status
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "verification_status_delete_policy" ON verification_status
    FOR DELETE
    TO authenticated
    USING (true);

-- Verify the policies were created correctly
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('profiles', 'instructor_profiles', 'verification_status')
ORDER BY tablename, policyname;
