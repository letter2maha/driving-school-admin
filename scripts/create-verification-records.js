// Script to create verification_status records for existing instructor profiles
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://parriuibqsfakwlmbdac.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcnJpdWlicXNmYWt3bG1iZGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMTIxMjksImV4cCI6MjA2ODc4ODEyOX0.PHfq49BUm2SFisBzlJl5mt33PODz22-7NoJ_JMXERM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createVerificationRecords() {
  console.log('🔄 Creating verification_status records for existing instructor profiles...\n');

  try {
    // Get all instructor profiles
    const { data: instructorProfiles, error: fetchError } = await supabase
      .from('instructor_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.log('❌ Error fetching instructor profiles:', fetchError.message);
      return;
    }

    console.log(`📊 Found ${instructorProfiles?.length || 0} instructor profiles`);

    if (!instructorProfiles || instructorProfiles.length === 0) {
      console.log('⚠️  No instructor profiles found');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const instructorProfile of instructorProfiles) {
      try {
        // Create verification status record for each instructor
        const verificationData = {
          id: instructorProfile.id,
          phone_verified: Math.random() > 0.3, // 70% chance of being verified
          phone_verified_at: Math.random() > 0.3 ? new Date().toISOString() : null,
          kyc_status: Math.random() > 0.4 ? 'submitted' : 'pending', // 60% chance of submitted
          kyc_submitted_at: Math.random() > 0.4 ? new Date().toISOString() : null,
          kyc_photo_id_path: Math.random() > 0.5 ? '/documents/photo_id_' + instructorProfile.id.slice(0, 8) + '.jpg' : null,
          kyc_instructor_id_path: Math.random() > 0.5 ? '/documents/license_' + instructorProfile.id.slice(0, 8) + '.jpg' : null,
          profile_completed: true, // Since they have instructor profiles, consider them completed
          profile_approved: null, // None approved yet - ready for admin review
          profile_submitted_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error: insertError } = await supabase
          .from('verification_status')
          .insert(verificationData);

        if (insertError) {
          console.log(`❌ Error creating verification record for ${instructorProfile.id.slice(0, 8)}:`, insertError.message);
          errorCount++;
        } else {
          console.log(`✅ Created verification record for: ${instructorProfile.bio || 'Instructor ' + instructorProfile.id.slice(0, 8)}`);
          successCount++;
        }
      } catch (error) {
        console.log(`❌ Exception creating verification record for ${instructorProfile.id.slice(0, 8)}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📈 Creation Summary:`);
    console.log(`   ✅ Successfully created: ${successCount} verification records`);
    console.log(`   ❌ Errors: ${errorCount} records`);
    console.log(`   📊 Total processed: ${instructorProfiles.length} profiles`);

    // Verify the creation
    if (successCount > 0) {
      console.log('\n🔍 Verifying created records...');
      const { data: verificationRecords, error: verifyError } = await supabase
        .from('verification_status')
        .select('id, phone_verified, kyc_status, profile_completed, profile_approved')
        .order('created_at', { ascending: false });

      if (verifyError) {
        console.log('❌ Error verifying records:', verifyError.message);
      } else {
        console.log(`✅ Verification successful! Created ${verificationRecords?.length || 0} verification records:`);
        verificationRecords?.forEach((record, index) => {
          const status = record.profile_approved === null ? 'Pending Review' : 
                        record.profile_approved === true ? 'Approved' : 'Rejected';
          console.log(`   ${index + 1}. ID: ${record.id.slice(0, 8)}... - ${status} (Phone: ${record.phone_verified}, KYC: ${record.kyc_status})`);
        });
      }
    }

  } catch (error) {
    console.log('❌ Creation failed:', error.message);
  }
}

createVerificationRecords().catch(console.error);
