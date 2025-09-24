// Script to update instructor profile names with better display names
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://parriuibqsfakwlmbdac.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcnJpdWlicXNmYWt3bG1iZGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMTIxMjksImV4cCI6MjA2ODc4ODEyOX0.PHfq49BUm2SFisBzlJl5mt33PODz22-7NoJ_JMXERM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateInstructorNames() {
  console.log('🔄 Updating instructor profile names...\n');

  try {
    // Get all instructor profiles
    const { data: instructorProfiles, error: fetchError } = await supabase
      .from('instructor_profiles')
      .select('*');

    if (fetchError) {
      console.log('❌ Error fetching instructor profiles:', fetchError.message);
      return;
    }

    console.log(`📊 Found ${instructorProfiles?.length || 0} instructor profiles`);

    if (!instructorProfiles || instructorProfiles.length === 0) {
      console.log('⚠️  No instructor profiles found');
      return;
    }

    // Define better names for each instructor
    const nameUpdates = {
      'd5fcc0df-87e4-4df4-b2d2-d6167b6b0c70': 'John Smith - Experienced Instructor',
      'bfedec95-f062-4b78-aad9-7bb4b88391c0': 'Sarah Johnson - New Instructor',
      '0fcb6e94-929a-4df5-a9d7-c30bcaa270d8': 'Mike Wilson - New Instructor',
      '5722bc46-5897-4a7c-997f-457282d4062b': 'Emma Davis - Manual Specialist',
      '7135d86f-3f74-48a6-8a8d-186e1a16dedb': 'David Brown - Automatic Specialist',
      'd6adc401-5c93-4174-ac18-148d435daaac': 'Lisa Garcia - Senior Instructor',
      '03a376fe-d6c8-4e53-9044-68ccdd2f99d8': 'Robert Taylor - Master Instructor'
    };

    let successCount = 0;
    let errorCount = 0;

    for (const instructorProfile of instructorProfiles) {
      try {
        const newName = nameUpdates[instructorProfile.id] || `Instructor ${instructorProfile.id.slice(0, 8)}`;
        
        const { error: updateError } = await supabase
          .from('instructor_profiles')
          .update({
            bio: newName,
            updated_at: new Date().toISOString()
          })
          .eq('id', instructorProfile.id);

        if (updateError) {
          console.log(`❌ Error updating ${instructorProfile.id}:`, updateError.message);
          errorCount++;
        } else {
          console.log(`✅ Updated: ${newName}`);
          successCount++;
        }
      } catch (error) {
        console.log(`❌ Exception updating ${instructorProfile.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📈 Update Summary:`);
    console.log(`   ✅ Successfully updated: ${successCount} profiles`);
    console.log(`   ❌ Errors: ${errorCount} profiles`);
    console.log(`   📊 Total processed: ${instructorProfiles.length} profiles`);

    // Verify the updates
    if (successCount > 0) {
      console.log('\n🔍 Verifying updates...');
      const { data: updatedProfiles, error: verifyError } = await supabase
        .from('instructor_profiles')
        .select('id, bio, experience_years')
        .order('created_at', { ascending: false });

      if (verifyError) {
        console.log('❌ Error verifying updates:', verifyError.message);
      } else {
        console.log(`✅ Verification successful! Updated profiles:`);
        updatedProfiles?.forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.bio} (${profile.experience_years} years experience)`);
        });
      }
    }

  } catch (error) {
    console.log('❌ Update failed:', error.message);
  }
}

updateInstructorNames().catch(console.error);
