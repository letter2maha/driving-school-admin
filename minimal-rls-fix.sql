-- Step 1: Completely disable RLS to reset everything
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE verification_status DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "profiles_read_all" ON profiles;
DROP POLICY IF EXISTS "profiles_write_all" ON profiles;
DROP POLICY IF EXISTS "instructor_profiles_read_all" ON instructor_profiles;
DROP POLICY IF EXISTS "instructor_profiles_write_all" ON instructor_profiles;
DROP POLICY IF EXISTS "verification_status_read_all" ON verification_status;
DROP POLICY IF EXISTS "verification_status_write_all" ON verification_status;

-- Step 3: Enable RLS again
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_status ENABLE ROW LEVEL SECURITY;

-- Step 4: Create ONLY ONE simple policy per table - no complex logic
-- This is the most minimal policy possible

-- PROFILES: Allow service role full access, authenticated users read access
CREATE POLICY "profiles_service_full" ON profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "profiles_auth_read" ON profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- INSTRUCTOR_PROFILES: Allow service role full access, authenticated users read access
CREATE POLICY "instructor_profiles_service_full" ON instructor_profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "instructor_profiles_auth_read" ON instructor_profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- VERIFICATION_STATUS: Allow service role full access, authenticated users read access
CREATE POLICY "verification_status_service_full" ON verification_status
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "verification_status_auth_read" ON verification_status
    FOR SELECT
    TO authenticated
    USING (true);

-- Test message
SELECT 'Minimal RLS policies created successfully!' as result;
