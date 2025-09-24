// Test script to verify database access after RLS policy updates
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://parriuibqsfakwlmbdac.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcnJpdWlicXNmYWt3bG1iZGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMTIxMjksImV4cCI6MjA2ODc4ODEyOX0.PHfq49BUm2SFisBzlJl5mt33PODz22-7NoJ_JMXERM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseAccess() {
  console.log('🔍 Testing database access after RLS policy updates...\n');

  // Test 1: Check profiles table access
  console.log('1. Testing profiles table access...');
  try {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, phone, email, role')
      .eq('role', 'instructor')
      .limit(5);

    if (profilesError) {
      console.log('❌ Profiles table error:', profilesError.message);
    } else {
      console.log('✅ Profiles table accessible!');
      console.log(`   Found ${profiles?.length || 0} instructor profiles:`);
      profiles?.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.full_name} (${profile.phone || 'No phone'})`);
      });
    }
  } catch (error) {
    console.log('❌ Profiles table exception:', error.message);
  }

  // Test 2: Check instructor_profiles table access
  console.log('\n2. Testing instructor_profiles table access...');
  try {
    const { data: instructorProfiles, error: instructorError } = await supabase
      .from('instructor_profiles')
      .select('id, bio, experience_years')
      .limit(5);

    if (instructorError) {
      console.log('❌ Instructor profiles table error:', instructorError.message);
    } else {
      console.log('✅ Instructor profiles table accessible!');
      console.log(`   Found ${instructorProfiles?.length || 0} instructor profiles:`);
      instructorProfiles?.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.bio || 'No bio'} (${profile.experience_years} years)`);
      });
    }
  } catch (error) {
    console.log('❌ Instructor profiles table exception:', error.message);
  }

  // Test 3: Check verification_status table access
  console.log('\n3. Testing verification_status table access...');
  try {
    const { data: verificationStatus, error: verificationError } = await supabase
      .from('verification_status')
      .select('id, profile_approved, kyc_status')
      .limit(5);

    if (verificationError) {
      console.log('❌ Verification status table error:', verificationError.message);
    } else {
      console.log('✅ Verification status table accessible!');
      console.log(`   Found ${verificationStatus?.length || 0} verification records`);
    }
  } catch (error) {
    console.log('❌ Verification status table exception:', error.message);
  }

  // Test 4: Test the join query that the dashboard uses
  console.log('\n4. Testing dashboard join query...');
  try {
    const { data: dashboardData, error: dashboardError } = await supabase
      .from('profiles')
      .select(`
        *,
        instructor_profiles(*)
      `)
      .eq('role', 'instructor')
      .order('created_at', { ascending: false })
      .limit(3);

    if (dashboardError) {
      console.log('❌ Dashboard query error:', dashboardError.message);
    } else {
      console.log('✅ Dashboard query successful!');
      console.log(`   Found ${dashboardData?.length || 0} complete profiles:`);
      dashboardData?.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.full_name} (${profile.phone || 'No phone'})`);
        if (profile.instructor_profiles) {
          console.log(`      - Bio: ${profile.instructor_profiles.bio || 'No bio'}`);
          console.log(`      - Experience: ${profile.instructor_profiles.experience_years} years`);
        } else {
          console.log(`      - No instructor profile data`);
        }
      });
    }
  } catch (error) {
    console.log('❌ Dashboard query exception:', error.message);
  }

  console.log('\n🎯 Test completed!');
}

testDatabaseAccess().catch(console.error);
