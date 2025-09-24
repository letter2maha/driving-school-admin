// Test environment variables loading
require('dotenv').config({ path: '.env.local' })

console.log('Environment Variables Test:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Present' : 'Missing')
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing')
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing')

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('Service Role Key starts with:', process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...')
}
