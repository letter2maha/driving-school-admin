const { createClient } = require('@supabase/supabase-js')

// Use the same configuration as the main app
const supabaseUrl = 'https://parriuibqsfakwlmbdac.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcnJpdWlicXNmYWt3bG1iZGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMTIxMjksImV4cCI6MjA2ODc4ODEyOX0.PHfq49BUm2SFisBzlJl5mt33PODz22-7NoJ_JMXERM4'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function syncProfilesFromInstructor() {
  console.log('🔄 Syncing profiles from instructor_profiles...\n')

  try {
    // Get all instructor profiles
    const { data: instructorProfiles, error: instructorError } = await supabase
      .from('instructor_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (instructorError) {
      console.error('❌ Error fetching instructor profiles:', instructorError.message)
      return
    }

    if (!instructorProfiles || instructorProfiles.length === 0) {
      console.log('⚠️  No instructor profiles found')
      return
    }

    console.log(`📊 Found ${instructorProfiles.length} instructor profiles`)

    // Check which profiles already exist
    const { data: existingProfiles, error: existingError } = await supabase
      .from('profiles')
      .select('id')
      .in('id', instructorProfiles.map(p => p.id))

    if (existingError) {
      console.log('⚠️  Could not check existing profiles (RLS may be blocking):', existingError.message)
    }

    const existingIds = existingProfiles?.map(p => p.id) || []
    console.log(`📋 Found ${existingIds.length} existing profiles`)

    // Create profiles for instructor profiles that don't have them
    const profilesToCreate = instructorProfiles.filter(p => !existingIds.includes(p.id))
    console.log(`🆕 Need to create ${profilesToCreate.length} new profiles`)

    if (profilesToCreate.length === 0) {
      console.log('✅ All instructor profiles already have corresponding profiles')
      return
    }

    // Create profiles
    const profilesData = profilesToCreate.map(instructor => ({
      id: instructor.id,
      full_name: instructor.bio || `Instructor ${instructor.id.slice(0, 8)}`,
      phone: '+1234567890', // Default phone
      email: `instructor${instructor.id.slice(0, 8)}@example.com`, // Default email
      role: 'instructor',
      address: `${instructor.city || 'Unknown'}, ${instructor.state || 'Unknown'}, ${instructor.country || 'Unknown'}`,
      profile_image_url: instructor.profile_image_url,
      car_image_url: instructor.car_image_url,
      created_at: instructor.created_at,
      updated_at: instructor.updated_at
    }))

    console.log('\n📝 Creating profiles...')
    for (const profile of profilesData) {
      try {
        const { error } = await supabase
          .from('profiles')
          .insert(profile)

        if (error) {
          console.log(`❌ Error creating profile for ${profile.full_name}:`, error.message)
        } else {
          console.log(`✅ Created profile: ${profile.full_name}`)
        }
      } catch (err) {
        console.log(`❌ Error creating profile for ${profile.full_name}:`, err.message)
      }
    }

    console.log('\n🎉 Profile sync completed!')
    console.log('\n💡 Next steps:')
    console.log('1. Check if profiles are now accessible in the dashboard')
    console.log('2. If still blocked, you may need to update RLS policies in Supabase dashboard')
    console.log('3. Or use the service role key for admin operations')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

syncProfilesFromInstructor().catch(console.error)
