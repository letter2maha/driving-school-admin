'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'

interface AdminRouteProps {
  children: React.ReactNode
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // No user, redirect to login
        router.push('/admin/login')
      } else if (!isAdmin) {
        // User exists but not admin, redirect to login
        router.push('/admin/login')
      }
    }
  }, [user, loading, isAdmin, router])

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Show nothing while redirecting
  if (!user || !isAdmin) {
    return null
  }

  // User is authenticated and is admin, show the protected content
  return <>{children}</>
}
