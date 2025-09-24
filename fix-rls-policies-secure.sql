-- Fix RLS policies to resolve infinite recursion while maintaining security
-- This approach maintains proper security for both admin dashboard and React Native app
-- Run this in your Supabase SQL Editor

-- First, let's check what policies currently exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- Disable RLS temporarily to clear conflicting policies
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE verification_status DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to clear any conflicting ones
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON profiles;
-- Drop any other potential policy names
DROP POLICY IF EXISTS "profiles_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_all_policy" ON profiles;

-- Drop instructor_profiles policies
DROP POLICY IF EXISTS "instructor_profiles_select_policy" ON instructor_profiles;
DROP POLICY IF EXISTS "instructor_profiles_insert_policy" ON instructor_profiles;
DROP POLICY IF EXISTS "instructor_profiles_update_policy" ON instructor_profiles;
DROP POLICY IF EXISTS "instructor_profiles_delete_policy" ON instructor_profiles;

-- Drop verification_status policies
DROP POLICY IF EXISTS "verification_status_select_policy" ON verification_status;
DROP POLICY IF EXISTS "verification_status_insert_policy" ON verification_status;
DROP POLICY IF EXISTS "verification_status_update_policy" ON verification_status;
DROP POLICY IF EXISTS "verification_status_delete_policy" ON verification_status;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_status ENABLE ROW LEVEL SECURITY;

-- Create secure policies that work for both admin dashboard and React Native app

-- PROFILES TABLE POLICIES
-- Allow users to read their own profile
CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "profiles_insert_own" ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow service role (admin dashboard) to read all profiles
CREATE POLICY "profiles_select_service_role" ON profiles
    FOR SELECT
    TO service_role
    USING (true);

-- Allow service role (admin dashboard) to update all profiles
CREATE POLICY "profiles_update_service_role" ON profiles
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow service role (admin dashboard) to delete profiles
CREATE POLICY "profiles_delete_service_role" ON profiles
    FOR DELETE
    TO service_role
    USING (true);

-- INSTRUCTOR_PROFILES TABLE POLICIES
-- Allow users to read their own instructor profile
CREATE POLICY "instructor_profiles_select_own" ON instructor_profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Allow users to insert their own instructor profile
CREATE POLICY "instructor_profiles_insert_own" ON instructor_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Allow users to update their own instructor profile
CREATE POLICY "instructor_profiles_update_own" ON instructor_profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow service role (admin dashboard) to access all instructor profiles
CREATE POLICY "instructor_profiles_select_service_role" ON instructor_profiles
    FOR SELECT
    TO service_role
    USING (true);

CREATE POLICY "instructor_profiles_update_service_role" ON instructor_profiles
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "instructor_profiles_delete_service_role" ON instructor_profiles
    FOR DELETE
    TO service_role
    USING (true);

-- VERIFICATION_STATUS TABLE POLICIES
-- Allow users to read their own verification status
CREATE POLICY "verification_status_select_own" ON verification_status
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Allow users to insert their own verification status
CREATE POLICY "verification_status_insert_own" ON verification_status
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Allow users to update their own verification status
CREATE POLICY "verification_status_update_own" ON verification_status
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow service role (admin dashboard) to access all verification status
CREATE POLICY "verification_status_select_service_role" ON verification_status
    FOR SELECT
    TO service_role
    USING (true);

CREATE POLICY "verification_status_update_service_role" ON verification_status
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "verification_status_delete_service_role" ON verification_status
    FOR DELETE
    TO service_role
    USING (true);

-- Verify the policies were created correctly
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('profiles', 'instructor_profiles', 'verification_status')
ORDER BY tablename, policyname;
