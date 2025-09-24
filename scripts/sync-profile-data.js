// Script to sync profile data from instructor_profiles to profiles table
// This will help populate the profiles table with the available data

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://parriuibqsfakwlmbdac.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcnJpdWlicXNmYWt3bG1iZGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMTIxMjksImV4cCI6MjA2ODc4ODEyOX0.PHfq49BUm2SFisBzlJl5mt33PODz22-7NoJ_JMXERM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncProfileData() {
  console.log('🔄 Starting profile data sync...\n');

  try {
    // First, get all instructor profiles
    const { data: instructorProfiles, error: instructorError } = await supabase
      .from('instructor_profiles')
      .select('*');

    if (instructorError) {
      console.log('❌ Error fetching instructor profiles:', instructorError.message);
      return;
    }

    console.log(`📊 Found ${instructorProfiles?.length || 0} instructor profiles`);

    if (!instructorProfiles || instructorProfiles.length === 0) {
      console.log('⚠️  No instructor profiles found to sync');
      return;
    }

    // Check if profiles table is accessible
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (profilesError) {
      console.log('❌ Profiles table not accessible:', profilesError.message);
      console.log('💡 You may need to update RLS policies first');
      return;
    }

    console.log('✅ Profiles table is accessible');

    // Create profile records for each instructor profile
    let successCount = 0;
    let errorCount = 0;

    for (const instructorProfile of instructorProfiles) {
      try {
        // Check if profile already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', instructorProfile.id)
          .single();

        if (existingProfile) {
          console.log(`⏭️  Profile ${instructorProfile.id} already exists, skipping...`);
          continue;
        }

        // Create profile record
        const profileData = {
          id: instructorProfile.id,
          full_name: instructorProfile.bio || 'Instructor',
          phone: null, // Not available in instructor_profiles
          email: null, // Not available in instructor_profiles
          address: `${instructorProfile.city || ''}, ${instructorProfile.state || ''}, ${instructorProfile.country || ''}`.replace(/^,\s*|,\s*$/g, '') || null,
          profile_image_url: instructorProfile.profile_image_url,
          car_image_url: instructorProfile.car_image_url,
          role: 'instructor',
          referral_code: null,
          created_at: instructorProfile.created_at,
          updated_at: instructorProfile.updated_at
        };

        const { error: insertError } = await supabase
          .from('profiles')
          .insert(profileData);

        if (insertError) {
          console.log(`❌ Error creating profile for ${instructorProfile.id}:`, insertError.message);
          errorCount++;
        } else {
          console.log(`✅ Created profile for ${instructorProfile.bio || 'Instructor'} (${instructorProfile.id})`);
          successCount++;
        }
      } catch (error) {
        console.log(`❌ Exception creating profile for ${instructorProfile.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📈 Sync Summary:`);
    console.log(`   ✅ Successfully created: ${successCount} profiles`);
    console.log(`   ❌ Errors: ${errorCount} profiles`);
    console.log(`   📊 Total processed: ${instructorProfiles.length} profiles`);

    // Verify the sync
    if (successCount > 0) {
      console.log('\n🔍 Verifying sync...');
      const { data: newProfiles, error: verifyError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('role', 'instructor');

      if (verifyError) {
        console.log('❌ Error verifying sync:', verifyError.message);
      } else {
        console.log(`✅ Verification successful! Found ${newProfiles?.length || 0} instructor profiles in profiles table`);
        newProfiles?.forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.full_name} (${profile.id})`);
        });
      }
    }

  } catch (error) {
    console.log('❌ Sync failed:', error.message);
  }
}

syncProfileData().catch(console.error);
