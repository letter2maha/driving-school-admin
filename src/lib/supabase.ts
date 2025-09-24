import { createClient } from '@supabase/supabase-js'

// Use environment variables for configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://parriuibqsfakwlmbdac.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcnJpdWlicXNmYWt3bG1iZGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMTIxMjksImV4cCI6MjA2ODc4ODEyOX0.PHfq49BUm2SFisBzlJl5mt33PODz22-7NoJ_JMXERM4'

console.log('=== SUPABASE CONFIG DEBUG ===')
console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key:', supabaseAnonKey ? 'Present' : 'Missing')
console.log('Service Role Key (server):', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing')
console.log('Service Role Key (public):', process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing')
console.log('All SUPABASE env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')))
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('================================')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client with service role key for elevated permissions (bypasses RLS)
// Use NEXT_PUBLIC_ prefix for client-side access in Vercel
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcnJpdWlicXNmYWt3bG1iZGFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzIxMjEyOSwiZXhwIjoyMDY4Nzg4MTI5fQ.PND9kJQ4mc1UVJmpDZ27w6AoT85mdFKY0kNZT20vVi8'

export const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey,
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
    
    // First try with service role key (bypasses RLS)
    try {
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error checking admin status with service role:', error)
        // Fall back to simple check if service role fails
        return checkAdminStatusSimple(userId)
      }

      console.log('Admin check result:', profile?.role === 'admin')
      return profile?.role === 'admin'
    } catch (err) {
      console.error('Service role check failed, using simple check:', err)
      return checkAdminStatusSimple(userId)
    }
  } catch (err) {
    console.error('Error checking admin status:', err)
    return checkAdminStatusSimple(userId)
  }
}

// Simple admin check that doesn't require database access
function checkAdminStatusSimple(userId: string): boolean {
  // For now, allow access if the user ID matches the known admin ID
  // This is a temporary workaround until RLS is properly configured
  const adminUserId = '7e538aad-0075-47a4-8c81-1f1354da4563'
  const isAdmin = userId === adminUserId
  
  console.log('Simple admin check result:', isAdmin)
  return isAdmin
}