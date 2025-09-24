'use client'

import AdminLayout from '@/components/layout/AdminLayout'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ApplicationWithDetails } from '@/types/database'
import { format } from 'date-fns'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PhoneIcon,
  DocumentIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

type FilterStatus = 'all' | 'phone_incomplete' | 'kyc_incomplete' | 'profile_incomplete'

export default function IncompleteRegistrationsPage() {
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([])
  const [filteredApplications, setFilteredApplications] = useState<ApplicationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    fetchIncompleteRegistrations()
  }, [])

  useEffect(() => {
    filterApplications()
  }, [applications, searchTerm, statusFilter])

  const fetchIncompleteRegistrations = async () => {
    try {
      // Fetch instructor profiles directly from instructor_profiles table
      // (profiles table is protected by RLS policies)
      const { data: instructorData, error: instructorError } = await supabase
        .from('instructor_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (instructorError) throw instructorError

      // Transform instructor profiles to match expected structure
      const profilesData = instructorData?.map(instructorProfile => ({
        id: instructorProfile.id,
        full_name: instructorProfile.bio || `Instructor ${instructorProfile.id.slice(0, 8)}`,
        phone: 'N/A', // Not available in instructor_profiles table
        email: 'N/A', // Not available in instructor_profiles table
        address: instructorProfile.city || instructorProfile.state || instructorProfile.country 
          ? `${instructorProfile.city || 'N/A'}, ${instructorProfile.state || 'N/A'}, ${instructorProfile.country || 'N/A'}`
          : 'N/A',
        profile_image_url: instructorProfile.profile_image_url,
        car_image_url: instructorProfile.car_image_url,
        role: 'instructor',
        created_at: instructorProfile.created_at,
        updated_at: instructorProfile.updated_at,
        instructor_profiles: instructorProfile
      })) || []

      // Fetch verification status separately
      const profileIds = profilesData?.map(profile => profile.id) || []
      let verificationData = []
      
      if (profileIds.length > 0) {
        const { data: verificationStatus, error: verificationError } = await supabase
          .from('verification_status')
          .select('*')
          .in('id', profileIds)
        
        if (verificationError) {
          console.error('Error fetching verification status:', verificationError)
        } else {
          verificationData = verificationStatus || []
        }
      }

      // Combine profiles with verification status and calculate completion status
      const combinedData = profilesData?.map(profile => {
        const verification = verificationData.find(v => v.id === profile.id)
        const verificationStatus = verification || {
          id: profile.id,
          phone_verified: false,
          kyc_status: 'pending',
          profile_completed: false,
          profile_approved: null
        }

        // Calculate completion status
        const calculateCompletionStatus = (verification, hasInstructorProfile) => {
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

        return {
          profile,
          instructor_profile: profile.instructor_profiles,
          verification_status: verificationStatus,
          completion_status: calculateCompletionStatus(verificationStatus, true)
        }
      }) || []

      // Filter to only show incomplete registrations
      const incompleteRegistrations = combinedData.filter(app => 
        ['phone_incomplete', 'kyc_incomplete', 'profile_incomplete'].includes(app.completion_status)
      )

      setApplications(incompleteRegistrations)
    } catch (error) {
      console.error('Error fetching incomplete registrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterApplications = () => {
    let filtered = applications

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.profile.phone.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.completion_status === statusFilter)
    }

    setFilteredApplications(filtered)
    setCurrentPage(1)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      phone_incomplete: { label: 'Phone Verification Pending', color: 'bg-red-100 text-red-800' },
      kyc_incomplete: { label: 'KYC Documents Pending', color: 'bg-yellow-100 text-yellow-800' },
      profile_incomplete: { label: 'Profile Completion Pending', color: 'bg-blue-100 text-blue-800' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'bg-gray-100 text-gray-800' }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'phone_incomplete':
        return <PhoneIcon className="h-4 w-4" />
      case 'kyc_incomplete':
        return <DocumentIcon className="h-4 w-4" />
      case 'profile_incomplete':
        return <UserIcon className="h-4 w-4" />
      default:
        return <DocumentIcon className="h-4 w-4" />
    }
  }

  const getIncompleteReason = (app: ApplicationWithDetails) => {
    const status = app.completion_status
    const verification = app.verification_status

    switch (status) {
      case 'phone_incomplete':
        return 'User has not completed phone verification'
      case 'kyc_incomplete':
        return 'User has not submitted KYC documents'
      case 'profile_incomplete':
        return 'User has not completed instructor profile'
      default:
        return 'Registration incomplete'
    }
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
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Incomplete Registrations</h1>
          <p className="mt-2 text-gray-600">
            Track and follow up on users who haven't completed their registration process.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  className="input-field pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                className="input-field"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
              >
                <option value="all">All Status</option>
                <option value="phone_incomplete">Phone Pending</option>
                <option value="kyc_incomplete">KYC Pending</option>
                <option value="profile_incomplete">Profile Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Showing {filteredApplications.length} incomplete registration{filteredApplications.length !== 1 ? 's' : ''}
            </h3>
          </div>

          {currentApplications.length === 0 ? (
            <div className="text-center py-12">
              <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No incomplete registrations</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'All users have completed their registration process.'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {currentApplications.map((application) => (
                <div key={application.profile.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {application.profile.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {application.profile.full_name}
                          </h4>
                          {getStatusBadge(application.completion_status)}
                        </div>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          <span>Email: {application.profile.email}</span>
                          <span>Phone: {application.profile.phone}</span>
                          <span>Registered: {format(new Date(application.profile.created_at), 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="mt-2 flex items-center space-x-1 text-sm text-gray-600">
                          {getStatusIcon(application.completion_status)}
                          <span>{getIncompleteReason(application)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/admin/applications/${application.profile.id}`}
                        className="btn-secondary flex items-center text-sm"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredApplications.length)} of {filteredApplications.length} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
