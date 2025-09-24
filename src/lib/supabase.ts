import { createClient } from '@supabase/supabase-js'

// Use environment variables for configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://parriuibqsfakwlmbdac.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcnJpdWlicXNmYWt3bG1iZGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMTIxMjksImV4cCI6MjA2ODc4ODEyOX0.PHfq49BUm2SFisBzlJl5mt33PODz22-7NoJ_JMXERM4'

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key:', supabaseAnonKey ? 'Present' : 'Missing')
console.log('Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing (using placeholder)')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client with service role key for elevated permissions (bypasses RLS)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcnJpdWlicXNmYWt3bG1iZGFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzIxMjEyOSwiZXhwIjoyMDY4Nzg4MTI5fQ.PND9kJQ4mc1UVJmpDZ27w6AoT85mdFKY0kNZT20vVi8',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Helper function to check if user is admin using service role key
export async function checkAdminStatus(userId: string): Promise<boolean> {
  try {
    console.log('Using service role key for admin check')
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error checking admin status with service role:', error)
      return false
    }

    console.log('Admin check result:', profile?.role === 'admin')
    return profile?.role === 'admin'
  } catch (err) {
    console.error('Error checking admin status:', err)
    return false
  }
}