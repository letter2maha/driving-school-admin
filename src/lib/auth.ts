import { supabase } from './supabase'
import { AdminUser } from '@/types/database'

export interface AuthState {
  user: AdminUser | null
  loading: boolean
}

// Simple admin authentication - in production, you'd want more robust auth
export const adminEmails = [
  'admin@drivingschool.com',
  'superadmin@drivingschool.com',
  'admin@drivedash.co.uk'  // Add your actual admin email
]

export async function signInAdmin(email: string, password: string) {
  try {
    console.log('Mock auth: Attempting login for', email)
    
    // For demo purposes, we'll use a simple check
    // In production, implement proper admin authentication
    if (!adminEmails.includes(email)) {
      console.log('Mock auth: Email not in admin list')
      throw new Error('Unauthorized admin email')
    }

    // Simple password validation for demo
    if (!password || password.length < 3) {
      console.log('Mock auth: Password too short')
      throw new Error('Password is required')
    }

    console.log('Mock auth: Login successful')

    // Mock admin user - replace with actual authentication
    const adminUser: AdminUser = {
      id: email === 'admin@drivedash.co.uk' ? '7e538aad-0075-47a4-8c81-1f1354da4563' : 'admin-1',
      email,
      name: email.split('@')[0],
      role: email === 'superadmin@drivingschool.com' ? 'super_admin' : 'admin',
      created_at: new Date().toISOString()
    }

    // Store in localStorage for demo
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_user', JSON.stringify(adminUser))
      console.log('Mock auth: User stored in localStorage')
    }

    return { data: { user: adminUser }, error: null }
  } catch (error) {
    console.log('Mock auth: Login failed', error)
    return { data: { user: null }, error }
  }
}

export async function signOutAdmin() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_user')
  }
  return { error: null }
}

export function getCurrentAdmin(): AdminUser | null {
  if (typeof window === 'undefined') return null
  
  try {
    const userStr = localStorage.getItem('admin_user')
    return userStr ? JSON.parse(userStr) : null
  } catch {
    return null
  }
}
