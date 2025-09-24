-- Create simple, working RLS policies that won't cause infinite recursion
-- This approach uses very basic policies

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_status ENABLE ROW LEVEL SECURITY;

-- Create very simple policies - no complex logic that could cause recursion

-- PROFILES: Allow all authenticated users to read all profiles
-- This is permissive but will work without recursion
CREATE POLICY "profiles_read_all" ON profiles
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "profiles_write_all" ON profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- INSTRUCTOR_PROFILES: Allow all authenticated users to read all profiles
CREATE POLICY "instructor_profiles_read_all" ON instructor_profiles
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "instructor_profiles_write_all" ON instructor_profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- VERIFICATION_STATUS: Allow all authenticated users to read all profiles
CREATE POLICY "verification_status_read_all" ON verification_status
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "verification_status_write_all" ON verification_status
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Test message
SELECT 'Simple RLS policies created successfully!' as result;
