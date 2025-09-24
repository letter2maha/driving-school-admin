'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, checkAdminStatus } from '@/lib/supabase'
import { getCurrentAdmin, signOutAdmin } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Use mock authentication instead of real Supabase auth
    const adminUser = getCurrentAdmin()
    if (adminUser) {
      // Create a minimal user object for compatibility
      const user = {
        id: adminUser.id,
        email: adminUser.email,
        aud: 'authenticated',
        role: 'authenticated',
        created_at: adminUser.created_at,
        updated_at: adminUser.created_at,
        app_metadata: {},
        user_metadata: {},
        identities: [],
        confirmed_at: adminUser.created_at,
        last_sign_in_at: adminUser.created_at,
        recovery_sent_at: undefined,
        email_confirmed_at: adminUser.created_at,
        phone_confirmed_at: undefined,
        new_email: undefined,
        invited_at: undefined,
        action_link: undefined,
        email_change_sent_at: undefined,
        new_phone: undefined,
        phone_change_sent_at: undefined,
        phone_change: undefined,
        phone_change_token: undefined,
        email_change: undefined,
        email_change_token: undefined,
        factors: [],
        banned_until: undefined,
        is_anonymous: false,
        is_sso_user: false
      } as User
      
      setUser(user)
      setIsAdmin(true)
    } else {
      setUser(null)
      setIsAdmin(false)
    }
    setLoading(false)
  }, [])

  const checkAdminStatusLocal = async (userId: string) => {
    try {
      const isAdminUser = await checkAdminStatus(userId)
      setIsAdmin(isAdminUser)
    } catch (err) {
      console.error('Error checking admin status:', err)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    await signOutAdmin()
    setUser(null)
    setIsAdmin(false)
  }

  const value = {
    user,
    loading,
    isAdmin,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
