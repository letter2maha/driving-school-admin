'use client'

import AdminLayout from '@/components/layout/AdminLayout'
import { 
  DocumentTextIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  StarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { ApplicationWithDetails } from '@/types/database'
import DataDebugger from '@/components/debug/DataDebugger'
import ConnectionTest from '@/components/debug/ConnectionTest'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    incomplete: 0
  })
  const [recentApplications, setRecentApplications] = useState<ApplicationWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      console.log('Fetching dashboard data using same approach as applications page...')
      
      // Try to fetch real data first, fallback to mock data if it fails
      try {
        // Use the same approach as the applications page which is working correctly
        // Primary approach: Use verification_status table as the main source
        console.log('Fetching applications using verification_status as primary source...')

        // Step 1: Get all verification status records (excluding soft deleted)
        const { data: verificationData, error: verificationError } = await supabaseAdmin
          .from('verification_status')
          .select('*')
          .order('created_at', { ascending: false })

        if (verificationError) {
          console.error('Error fetching verification status:', verificationError)
          throw verificationError
        }

        console.log('Found verification status records:', verificationData?.length || 0)

        // If no verification records exist, get all profiles as fallback
      if (!verificationData || verificationData.length === 0) {
        console.log('No verification records found, using all profiles as fallback...')
        
        // Get all profiles (both students and instructors, excluding soft deleted)
        const profilesResult = await supabaseAdmin
          .from('profiles')
          .select(`
            *,
            instructor_profiles(*),
            student_profiles(*)
          `)
          .order('created_at', { ascending: false })

        if (profilesResult.error) throw profilesResult.error

        // Transform profiles to match expected structure
        const profilesData = profilesResult.data?.map(profile => {
          // Create a better display name from available data
          let displayName = profile.full_name || 'User'
          if (profile.full_name && profile.full_name.length > 50) {
            displayName = profile.full_name.substring(0, 50) + '...'
          }
          if (!profile.full_name || profile.full_name === 'null' || profile.full_name.trim() === '') {
            displayName = `${profile.role === 'instructor' ? 'Instructor' : 'Student'} ${profile.id.slice(0, 8)}`
          }
          
          return {
            id: profile.id,
            full_name: displayName,
            phone: profile.phone || 'N/A',
            email: profile.email || 'N/A',
            address: profile.address || 'N/A',
            profile_image_url: profile.profile_image_url,
            car_image_url: profile.car_image_url,
            role: profile.role as 'instructor' | 'student',
            created_at: profile.created_at,
            updated_at: profile.updated_at,
            instructor_profiles: profile.instructor_profiles,
            student_profiles: profile.student_profiles
          }
        }) || []

        // Create combined data with no verification records (all pending approval)
        const combinedData = profilesData.map(profile => ({
          profile,
          instructor_profile: profile.instructor_profiles || (profile.role === 'instructor' ? profile : null),
          student_profile: profile.student_profiles || (profile.role === 'student' ? profile : null),
          verification_status: {
            id: profile.id,
            phone_verified: false,
            kyc_status: 'pending' as const,
            profile_completed: true, // Since they have profiles
            profile_approved: null, // Ready for admin review
            profile_approved_at: null,
            profile_approved_by: null,
            created_at: profile.created_at,
            updated_at: profile.updated_at
          },
          completion_status: 'pending_approval'
        }))

        console.log('Combined applications data (fallback):', combinedData.length)
        console.log('Sample application names:', combinedData.slice(0, 3).map(app => app.profile.full_name))
        
        // Calculate stats from fallback data
        const pending = combinedData.filter(app => {
          const status = app.verification_status
          return (
            status?.profile_approved === null ||
            (status?.profile_approved === false && !status?.profile_approved_at && !status?.profile_approved_by) ||
            (!status?.profile_approved_at && !status?.profile_approved_by)
          )
        })

        setStats({
          total: combinedData.length,
          pending: pending.length,
          approved: 0,
          rejected: 0,
          incomplete: 0
        })

        // Set recent applications (last 5 pending)
        setRecentApplications(pending.slice(0, 5) as unknown as ApplicationWithDetails[])
        return
      }

      // Step 2: Get corresponding profiles and instructor_profiles
      const profileIds = verificationData.map(v => v.id)
      
      // Try to get profiles with instructor_profiles and student_profiles (proper join)
      let profilesData = []
      const profilesResult = await supabaseAdmin
        .from('profiles')
        .select(`
          *,
          instructor_profiles(*),
          student_profiles(*)
        `)
        .in('id', profileIds)
        .order('created_at', { ascending: false })
        // Include both students and instructors

      if (profilesResult.error && profilesResult.error.message.includes('policy')) {
        console.log('Profiles table not accessible, using instructor_profiles and student_profiles only...')
        
        // Fallback: get instructor_profiles and student_profiles directly
        const [instructorResult, studentResult] = await Promise.all([
          supabaseAdmin
            .from('instructor_profiles')
            .select('*')
            .in('id', profileIds)
            .order('created_at', { ascending: false }),
          supabaseAdmin
            .from('student_profiles')
            .select('*')
            .in('id', profileIds)
            .order('created_at', { ascending: false })
        ])

        if (instructorResult.error) throw instructorResult.error
        if (studentResult.error) throw studentResult.error

        // Transform instructor profiles to match expected structure
        const instructorProfiles = instructorResult.data?.map(instructorProfile => ({
          id: instructorProfile.id,
          full_name: instructorProfile.bio || `Instructor ${instructorProfile.id.slice(0, 8)}`,
          phone: 'N/A', // Not available in instructor_profiles table
          email: 'N/A', // Not available in instructor_profiles table
          address: instructorProfile.city || instructorProfile.state || instructorProfile.country 
            ? `${instructorProfile.city || 'N/A'}, ${instructorProfile.state || 'N/A'}, ${instructorProfile.country || 'N/A'}`
            : 'N/A',
          profile_image_url: instructorProfile.profile_image_url,
          car_image_url: instructorProfile.car_image_url,
          role: 'instructor' as const,
          created_at: instructorProfile.created_at,
          updated_at: instructorProfile.updated_at,
          instructor_profiles: instructorProfile
        })) || []

        // Transform student profiles to match expected structure
        const studentProfiles = studentResult.data?.map(studentProfile => ({
          id: studentProfile.id,
          full_name: `Student ${studentProfile.id.slice(0, 8)}`,
          phone: 'N/A', // Not available in student_profiles table
          email: 'N/A', // Not available in student_profiles table
          address: 'N/A', // Not available in student_profiles table
          profile_image_url: null,
          car_image_url: null,
          role: 'student' as const,
          created_at: studentProfile.created_at,
          updated_at: studentProfile.updated_at,
          student_profiles: studentProfile
        })) || []

        profilesData = [...instructorProfiles, ...studentProfiles]
      } else {
        if (profilesResult.error) throw profilesResult.error
        profilesData = profilesResult.data || []
      }

      // Step 3: Combine verification status with profiles and instructor_profiles
      // Use verificationData order (already sorted by created_at desc) as primary
      const combinedData = verificationData.map(verification => {
        const profile = profilesData.find(p => p.id === verification.id)
        
        // Calculate completion status based on verification_status
        const calculateCompletionStatus = (verification: any, hasInstructorProfile: boolean) => {
          if (verification?.profile_completed === true && verification?.profile_approved !== null) {
            return 'completed'
          }
          if (verification?.profile_completed === true && verification?.profile_approved === null) {
            return 'pending_approval'
          }
          if (verification?.phone_verified === true && verification?.kyc_status === 'submitted' && hasInstructorProfile) {
            return 'profile_incomplete'
          }
          if (verification?.phone_verified === true && verification?.kyc_status === 'submitted') {
            return 'profile_incomplete'
          }
          if (verification?.phone_verified === true) {
            return 'kyc_incomplete'
          }
          return 'phone_incomplete'
        }

        // If profile not found, create a minimal profile from verification data
        if (!profile) {
          return {
            profile: {
              id: verification.id,
              full_name: `User ${verification.id.slice(0, 8)}`,
              phone: 'N/A',
              email: 'N/A',
              address: 'N/A',
              profile_image_url: null,
              car_image_url: null,
              role: 'instructor' as const,
              created_at: verification.created_at,
              updated_at: verification.updated_at
            },
            instructor_profile: null,
            student_profile: null,
            verification_status: verification,
            completion_status: calculateCompletionStatus(verification, false)
          }
        }

        return {
          profile,
          instructor_profile: profile.instructor_profiles || (profile.role === 'instructor' ? profile : null),
          student_profile: profile.student_profiles || (profile.role === 'student' ? profile : null),
          verification_status: verification,
          completion_status: calculateCompletionStatus(verification, !!(profile.instructor_profiles || profile.student_profiles))
        }
      })

      console.log('Combined applications data:', combinedData.length)
      console.log('Sample application names:', combinedData.slice(0, 3).map(app => app.profile.full_name))

      // Categorize applications using the same logic as applications list and detail pages
      const pending = combinedData.filter(app => {
        const status = app.verification_status
        
        // Show as pending if no admin decision has been made
        return (
          status?.profile_approved === null ||
          (status?.profile_approved === false && !status?.profile_approved_at && !status?.profile_approved_by) ||
          (!status?.profile_approved_at && !status?.profile_approved_by)
        )
      })

      const approved = combinedData.filter(app => {
        const status = app.verification_status
        return status?.profile_approved === true && status?.profile_approved_at && status?.profile_approved_by
      })

      const rejected = combinedData.filter(app => {
        const status = app.verification_status
        return status?.profile_approved === false && status?.profile_approved_at && status?.profile_approved_by
      })

      const incomplete = combinedData.filter(app => {
        return ['phone_incomplete', 'kyc_incomplete', 'profile_incomplete'].includes(app.completion_status)
      })

      console.log('Categorized data:', { 
        pending: pending.length, 
        approved: approved.length, 
        rejected: rejected.length,
        incomplete: incomplete.length 
      })

      setStats({
        total: combinedData.length,
        pending: pending.length,
        approved: approved.length,
        rejected: rejected.length,
        incomplete: incomplete.length
      })

        // Set recent applications (last 5 pending)
        setRecentApplications(pending.slice(0, 5) as unknown as ApplicationWithDetails[])
      } catch (innerError) {
        console.error('Error in inner try block:', innerError)
        throw innerError
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Keep empty state when data fetch fails
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      name: 'Total Applications',
      value: stats.total,
      icon: DocumentTextIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'Pending Review',
      value: stats.pending,
      icon: ClockIcon,
      color: 'bg-yellow-500'
    },
    {
      name: 'Incomplete',
      value: stats.incomplete,
      icon: DocumentTextIcon,
      color: 'bg-orange-500'
    },
    {
      name: 'Approved',
      value: stats.approved,
      icon: CheckCircleIcon,
      color: 'bg-green-500'
    },
    {
      name: 'Rejected',
      value: stats.rejected,
      icon: XCircleIcon,
      color: 'bg-red-500'
    }
  ]

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-8">Dashboard</h1>
        
        
        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-8">
          {statCards.map((stat) => (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`p-3 rounded-md ${stat.color}`}>
                      <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Applications */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Applications
            </h3>
            {recentApplications.length === 0 ? (
              <p className="text-gray-500">No pending applications</p>
            ) : (
              <div className="flow-root">
                <ul className="-my-5 divide-y divide-gray-200">
                  {recentApplications.map((application) => (
                    <li key={application.profile.id} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {application.profile.profile_image_url ? (
                            <img
                              src={application.profile.profile_image_url}
                              alt={application.profile.full_name}
                              className="h-10 w-10 rounded-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                if (nextElement) {
                                  nextElement.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div className={`h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center ${application.profile.profile_image_url ? 'hidden' : ''}`}>
                            <span className="text-sm font-medium text-gray-700">
                              {application.profile.full_name?.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {application.profile.full_name}
                            </p>
                            {/* Role Badge */}
                            {application.profile.role === 'instructor' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <StarIcon className="h-3 w-3 mr-1" />
                                Instructor
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <UserGroupIcon className="h-3 w-3 mr-1" />
                                Student
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            {application.profile.email}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Debug Section - Remove this in production */}
        <div className="mt-8 space-y-6">
          <ConnectionTest />
          <DataDebugger />
        </div>
      </div>
    </AdminLayout>
  )
}
