-- Update RLS policies to allow admin dashboard access to profiles table
-- Run this in your Supabase SQL Editor

-- First, let's check the current policies on the profiles table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- Drop existing restrictive policies (if any)
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

-- Create new policies that allow admin access
-- Allow SELECT for all authenticated users (this will allow your admin dashboard to read profiles)
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow INSERT for authenticated users (if needed for user registration)
CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow UPDATE for authenticated users (if needed for profile updates)
CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow DELETE for authenticated users (if needed for admin operations)
CREATE POLICY "profiles_delete_policy" ON profiles
    FOR DELETE
    TO authenticated
    USING (true);

-- Also update instructor_profiles policies to ensure they work properly
DROP POLICY IF EXISTS "instructor_profiles_select_policy" ON instructor_profiles;
DROP POLICY IF EXISTS "instructor_profiles_insert_policy" ON instructor_profiles;
DROP POLICY IF EXISTS "instructor_profiles_update_policy" ON instructor_profiles;
DROP POLICY IF EXISTS "instructor_profiles_delete_policy" ON instructor_profiles;

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

-- Update verification_status policies as well
DROP POLICY IF EXISTS "verification_status_select_policy" ON verification_status;
DROP POLICY IF EXISTS "verification_status_insert_policy" ON verification_status;
DROP POLICY IF EXISTS "verification_status_update_policy" ON verification_status;
DROP POLICY IF EXISTS "verification_status_delete_policy" ON verification_status;

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

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('profiles', 'instructor_profiles', 'verification_status')
ORDER BY tablename, policyname;
