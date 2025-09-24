'use client'

import AdminLayout from '@/components/layout/AdminLayout'
import { useState, useEffect } from 'react'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { ApplicationWithDetails } from '@/types/database'
import { format } from 'date-fns'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  StarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected'

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([])
  const [filteredApplications, setFilteredApplications] = useState<ApplicationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    fetchApplications()
  }, [])

  useEffect(() => {
    filterApplications()
  }, [applications, searchTerm, statusFilter])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      
      // Primary approach: Use verification_status table as the main source
      // This follows the proper admin workflow
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

        setApplications(combinedData)
        return
      }

      // Step 2: Get corresponding profiles and instructor_profiles
      const profileIds = verificationData.map(v => v.id)
      
      // Try to get profiles with instructor_profiles first (proper join)
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
      setApplications(combinedData)
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterApplications = () => {
    let filtered = applications

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.profile.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.profile.phone?.includes(searchTerm)
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => {
        const status = app.verification_status
        switch (statusFilter) {
          case 'pending':
            // Show as pending if no admin decision has been made
            return (
              status.profile_approved === null ||
              (status.profile_approved === false && !status.profile_approved_at && !status.profile_approved_by) ||
              (!status.profile_approved_at && !status.profile_approved_by)
            )
          case 'approved':
            return status.profile_approved === true && status.profile_approved_at && status.profile_approved_by
          case 'rejected':
            return status.profile_approved === false && status.profile_approved_at && status.profile_approved_by
          default:
            return true
        }
      })
    }

    setFilteredApplications(filtered)
    setCurrentPage(1)
  }

  const getStatusBadge = (application: ApplicationWithDetails) => {
    const status = application.verification_status
    
    // Check if there's an actual admin approval decision
    if (status.profile_approved === true && status.profile_approved_at && status.profile_approved_by) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Approved</span>
    }
    
    if (status.profile_approved === false && status.profile_approved_at && status.profile_approved_by) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>
    }
    
    // Check if profile_approved is explicitly set to null (pending state)
    if (status.profile_approved === null) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending Review</span>
    }
    
    // Legacy fallback: if profile_approved is false but no admin decision made, treat as pending
    if (status.profile_approved === false && !status.profile_approved_at && !status.profile_approved_by) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending Review</span>
    }
    
    // Check KYC status for incomplete applications
    if (status.kyc_status === 'pending') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">KYC Pending</span>
    }
    
    // Default to pending if no approval decision made yet
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending Review</span>
  }

  const getStatusIcon = (application: ApplicationWithDetails) => {
    const status = application.verification_status
    
    // Check if there's an actual admin approval decision
    if (status.profile_approved === true && status.profile_approved_at && status.profile_approved_by) {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />
    }
    
    if (status.profile_approved === false && status.profile_approved_at && status.profile_approved_by) {
      return <XCircleIcon className="h-5 w-5 text-red-500" />
    }
    
    // Default to pending icon for all other cases
    return <div className="h-5 w-5 rounded-full bg-yellow-500" />
  }

  // Pagination
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentApplications = filteredApplications.slice(startIndex, endIndex)

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
        <div className="sm:flex sm:items-center mb-6">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Applications</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage instructor applications and approvals
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FunnelIcon className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="input-field pl-10"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Results count */}
            <div className="flex items-center text-sm text-gray-500">
              Showing {filteredApplications.length} of {applications.length} applications
            </div>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {currentApplications.map((application) => (
              <li key={application.profile.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {application.profile.profile_image_url ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={application.profile.profile_image_url}
                            alt={application.profile.full_name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {application.profile.full_name?.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">
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
                          <div className="ml-2">
                            {getStatusIcon(application)}
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">
                          {application.profile.email}
                        </p>
                        <p className="text-sm text-gray-500">
                          {application.profile.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-900">
                          {format(new Date(application.profile.created_at), 'MMM dd, yyyy')}
                        </div>
                        <div className="mt-1">
                          {getStatusBadge(application)}
                        </div>
                      </div>
                      <Link
                        href={`/admin/applications/${application.profile.id}`}
                        className="btn-primary flex items-center"
                      >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(endIndex, filteredApplications.length)}</span> of{' '}
                    <span className="font-medium">{filteredApplications.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === i + 1
                            ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
