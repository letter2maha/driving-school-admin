const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client with service role key
const supabaseAdmin = createClient(
  'https://parriuibqsfakwlmbdac.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcnJpdWlicXNmYWt3bG1iZGFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzIxMjEyOSwiZXhwIjoyMDY4Nzg4MTI5fQ.PND9kJQ4mc1UVJmpDZ27w6AoT85mdFKY0kNZT20vVi8',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function fixPendingStatus() {
  try {
    console.log('🔍 Checking verification_status records...')
    
    // Get all records where profile_approved is false but no admin decision was made
    const { data: records, error: fetchError } = await supabaseAdmin
      .from('verification_status')
      .select('*')
      .eq('profile_approved', false)
      .is('profile_approved_at', null)
      .is('profile_approved_by', null)
    
    if (fetchError) {
      console.error('❌ Error fetching records:', fetchError)
      return
    }
    
    console.log(`📊 Found ${records.length} records that need to be fixed`)
    
    if (records.length === 0) {
      console.log('✅ No records need fixing!')
      return
    }
    
    // Update each record to set profile_approved to null (pending state)
    for (const record of records) {
      console.log(`🔄 Fixing record ${record.id}...`)
      
      const { error: updateError } = await supabaseAdmin
        .from('verification_status')
        .update({
          profile_approved: null, // Set to null for pending state
          updated_at: new Date().toISOString()
        })
        .eq('id', record.id)
      
      if (updateError) {
        console.error(`❌ Error updating record ${record.id}:`, updateError)
      } else {
        console.log(`✅ Fixed record ${record.id}`)
      }
    }
    
    console.log('🎉 All records have been fixed!')
    console.log('📝 Records now have profile_approved = null (pending state)')
    console.log('🔧 Mobile app should set profile_approved = null when creating new users')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the fix
fixPendingStatus()
