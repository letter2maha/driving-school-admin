'use client'

import AdminLayout from '@/components/layout/AdminLayout'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { ApplicationWithDetails } from '@/types/database'
import { format } from 'date-fns'
import { useAuth } from '@/components/auth/AuthProvider'
import { rejectUserApplication, approveUserApplication, softDeleteUser, hardDeleteUser } from '@/lib/admin-actions'
import { 
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentIcon,
  PhotoIcon,
  UserIcon,
  UserGroupIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  StarIcon,
  EyeIcon,
  XMarkIcon,
  TrashIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal'
import InstructorAvailability from '@/components/ui/InstructorAvailability'

export default function ApplicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [application, setApplication] = useState<ApplicationWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showKycModal, setShowKycModal] = useState(false)
  const [selectedKycDoc, setSelectedKycDoc] = useState<{type: string, url: string, path: string} | null>(null)
  const [kycLoading, setKycLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteType, setDeleteType] = useState<'soft' | 'hard'>('soft')
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchApplication(params.id as string)
    }
  }, [params.id])

  const fetchApplication = async (id: string) => {
    try {
      // First, try to get the profile to determine if it's a student or instructor
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select(`
          *,
          instructor_profiles(*),
          student_profiles(*)
        `)
        .eq('id', id)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        throw profileError
      }

      // Fetch verification status separately using admin client
      const { data: verificationData, error: verificationError } = await supabaseAdmin
        .from('verification_status')
        .select('*')
        .eq('id', id)
        .single()

      if (verificationError) {
        console.error('Error fetching verification status:', verificationError)
      }

      // Use the profile data we already fetched above

      let finalProfileData = profileData
      
      // If we have instructor or student profile data, enhance the display
      if (profileData.instructor_profiles) {
        // This is an instructor - keep original profile images, use instructor data for other fields
        finalProfileData = {
          ...profileData,
          // Only construct address from city/state/country if main address is empty
          address: profileData.address || 
                   (profileData.instructor_profiles.city || profileData.instructor_profiles.state || profileData.instructor_profiles.country 
                    ? `${profileData.instructor_profiles.city || 'N/A'}, ${profileData.instructor_profiles.state || 'N/A'}, ${profileData.instructor_profiles.country || 'N/A'}`
                    : 'N/A'),
          // Keep original profile image URLs, don't override with instructor profile (which might be null)
          profile_image_url: profileData.profile_image_url || profileData.instructor_profiles.profile_image_url,
          car_image_url: profileData.car_image_url || profileData.instructor_profiles.car_image_url,
        }
      } else if (profileData.student_profiles) {
        // This is a student - use the profile data as is
        finalProfileData = profileData
      }

      // Combine the data
      const combinedData = {
        profile: finalProfileData,
        instructor_profile: profileData.instructor_profiles || null,
        student_profile: profileData.student_profiles || null,
        verification_status: verificationData || {
          id: profileData.id,
          phone_verified: false,
          kyc_status: 'pending' as const,
          profile_completed: true, // Since they have profiles, consider them completed
          profile_approved: null,
          profile_approved_at: null,
          profile_approved_by: null,
          created_at: profileData.created_at,
          updated_at: profileData.updated_at
        }
      }

      setApplication(combinedData)
    } catch (error) {
      console.error('Error fetching application:', error)
      toast.error('Failed to load application details')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!application || !user) return

    setActionLoading(true)
    try {
      const success = await approveUserApplication(application.profile.id, user.id)
      
      if (success) {
        toast.success('Application approved successfully!')
        fetchApplication(application.profile.id)
      }
    } catch (error) {
      console.error('Error approving application:', error)
      toast.error('Failed to approve application')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!application || !rejectReason.trim() || !user) return

    setActionLoading(true)
    try {
      const success = await rejectUserApplication(
        application.profile.id, 
        user.id, 
        rejectReason.trim()
      )
      
      if (success) {
        toast.success('Application rejected successfully!')
        setShowRejectModal(false)
        setRejectReason('')
        fetchApplication(application.profile.id)
      }
    } catch (error) {
      console.error('Error rejecting application:', error)
      toast.error('Failed to reject application')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (reason: string) => {
    if (!application || !user) return

    setDeleteLoading(true)
    try {
      let success = false
      
      if (deleteType === 'soft') {
        success = await softDeleteUser(application.profile.id, user.id, reason)
      } else {
        success = await hardDeleteUser(application.profile.id, user.id, reason)
      }
      
      if (success) {
        toast.success(`User ${deleteType === 'soft' ? 'soft deleted' : 'hard deleted'} successfully!`)
        setShowDeleteModal(false)
        
        if (deleteType === 'hard') {
          // Redirect to applications list if hard deleted
          router.push('/admin/applications')
        } else {
          // Refresh the application data if soft deleted
          fetchApplication(application.profile.id)
        }
      }
    } catch (error) {
      console.error(`Error ${deleteType} deleting user:`, error)
      toast.error(`Failed to ${deleteType} delete user`)
    } finally {
      setDeleteLoading(false)
    }
  }

  const openDeleteModal = (type: 'soft' | 'hard') => {
    setDeleteType(type)
    setShowDeleteModal(true)
  }

  const openKycDocument = async (type: string, path: string) => {
    setKycLoading(true)
    try {
      // Generate a signed URL for the private bucket
      const { data, error } = await supabaseAdmin.storage
        .from('verifications')
        .createSignedUrl(path, 3600) // 1 hour expiry

      if (error) {
        console.error('Error creating signed URL:', error)
        toast.error('Unable to load document')
        return
      }

      setSelectedKycDoc({ type, url: data.signedUrl, path })
      setShowKycModal(true)
    } catch (error) {
      console.error('Error opening KYC document:', error)
      toast.error('Unable to load document')
    } finally {
      setKycLoading(false)
    }
  }

  const getStatusBadge = () => {
    if (!application) return null
    
    const verification = application.verification_status
    
    // Check if there's an actual admin approval decision
    if (verification?.profile_approved === true && verification?.profile_approved_at && verification?.profile_approved_by) {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">Approved</span>
    }
    
    if (verification?.profile_approved === false && verification?.profile_approved_at && verification?.profile_approved_by) {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">Rejected</span>
    }
    
    // Check if profile_approved is explicitly set to null (pending state)
    if (verification?.profile_approved === null) {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">Pending Review</span>
    }
    
    // Legacy fallback: if profile_approved is false but no admin decision made, treat as pending
    if (verification?.profile_approved === false && !verification?.profile_approved_at && !verification?.profile_approved_by) {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">Pending Review</span>
    }
    
    // Default to pending if no approval decision made yet
    return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">Pending Review</span>
  }

  const canTakeAction = () => {
    if (!application) return false
    const verification = application.verification_status
    
    // Allow actions if:
    // 1. profile_approved is null (pending state)
    // 2. profile_approved is false but no admin decision made (legacy records)
    // 3. No admin approval tracking fields exist
    return (
      verification?.profile_approved === null ||
      (verification?.profile_approved === false && !verification?.profile_approved_at && !verification?.profile_approved_by) ||
      (!verification?.profile_approved_at && !verification?.profile_approved_by)
    )
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {[...Array(3)].map((_, i) => (
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
            <div className="space-y-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!application) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Application not found</h3>
          <p className="mt-2 text-gray-500">The application you're looking for doesn't exist.</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div>
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Applications
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {application.profile.full_name}
                </h1>
                {/* Role Badge */}
                {application.profile.role === 'instructor' ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                    <StarIcon className="h-4 w-4 mr-1" />
                    Instructor
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                    <UserGroupIcon className="h-4 w-4 mr-1" />
                    Student
                  </span>
                )}
              </div>
              <p className="text-gray-500">{application.profile.email}</p>
            </div>
            <div className="flex items-center space-x-4">
              {getStatusBadge()}
              {canTakeAction() && (
                <div className="flex space-x-2">
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="btn-success flex items-center"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    className="btn-danger flex items-center"
                  >
                    <XCircleIcon className="h-4 w-4 mr-2" />
                    Reject
                  </button>
                </div>
              )}
              
              {/* Delete Actions - Always Available */}
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => openDeleteModal('soft')}
                  disabled={deleteLoading}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArchiveBoxIcon className="h-4 w-4 mr-2" />
                  Soft Delete
                </button>
                <button
                  onClick={() => openDeleteModal('hard')}
                  disabled={deleteLoading}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Hard Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <p className="mt-1 text-sm text-gray-900">{application.profile.full_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <PhoneIcon className="h-4 w-4 mr-1" />
                    {application.profile.phone}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <EnvelopeIcon className="h-4 w-4 mr-1" />
                    {application.profile.email}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    {application.profile.address}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Application Date</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {application.profile.created_at ? format(new Date(application.profile.created_at), 'MMM dd, yyyy') : 'Unknown date'}
                  </p>
                </div>
              </div>
            </div>

            {/* Instructor Profile */}
            {application.instructor_profile && (
              <div className="card border-l-4 border-l-blue-500 bg-blue-50/30">
                <h3 className="text-lg font-medium text-blue-900 mb-4 flex items-center">
                  <StarIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Instructor Profile
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Teaching Professional</span>
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bio</label>
                    <p className="mt-1 text-sm text-gray-900">{application.instructor_profile.bio || 'No bio provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Experience</label>
                    <p className="mt-1 text-sm text-gray-900">{application.instructor_profile.experience_years || 0} years</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expertise</label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {application.instructor_profile.expertise && application.instructor_profile.expertise.length > 0 ? (
                        application.instructor_profile.expertise.map((skill, index) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500 italic">No expertise listed</span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Manual Pricing</label>
                      <p className="mt-1 text-sm text-gray-900 flex items-center">
                        <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                        ${application.instructor_profile.manual_price_min || 0} - ${application.instructor_profile.manual_price_max || 0}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Automatic Pricing</label>
                      <p className="mt-1 text-sm text-gray-900 flex items-center">
                        <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                        ${application.instructor_profile.automatic_price_min || 0} - ${application.instructor_profile.automatic_price_max || 0}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Car Details</label>
                    <p className="mt-1 text-sm text-gray-900">{application.instructor_profile.car_details || 'No car details provided'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Instructor Availability */}
            {application.instructor_profile && (
              <InstructorAvailability 
                instructorId={application.profile.id}
                instructorName={application.profile.full_name}
              />
            )}

            {/* Student Profile */}
            {application.student_profile && (
              <div className="card border-l-4 border-l-green-500 bg-green-50/30">
                <h3 className="text-lg font-medium text-green-900 mb-4 flex items-center">
                  <UserGroupIcon className="h-5 w-5 mr-2 text-green-600" />
                  Student Profile
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Learning Driver</span>
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {application.student_profile.date_of_birth ? 
                          new Date(application.student_profile.date_of_birth).toLocaleDateString() : 
                          'Not provided'
                        }
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">License Type</label>
                      <p className="mt-1 text-sm text-gray-900">{application.student_profile.license_type || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Emergency Contact</label>
                      <p className="mt-1 text-sm text-gray-900">{application.student_profile.emergency_contact || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Emergency Phone</label>
                      <p className="mt-1 text-sm text-gray-900">{application.student_profile.emergency_phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Application Timeline */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Application Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Registration</p>
                    <p className="text-sm text-gray-500">
                      {application.profile.created_at ? format(new Date(application.profile.created_at), 'MMM dd, yyyy HH:mm') : 'Unknown date'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      application.verification_status.phone_verified 
                        ? 'bg-green-100' 
                        : 'bg-gray-100'
                    }`}>
                      <PhoneIcon className={`w-5 h-5 ${
                        application.verification_status.phone_verified 
                          ? 'text-green-600' 
                          : 'text-gray-400'
                      }`} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Phone Verification</p>
                    <p className="text-sm text-gray-500">
                      {application.verification_status.phone_verified 
                        ? `Verified on ${application.verification_status.phone_verified_at ? format(new Date(application.verification_status.phone_verified_at), 'MMM dd, yyyy HH:mm') : 'Unknown date'}`
                        : 'Pending'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      application.verification_status.kyc_status === 'submitted' 
                        ? 'bg-green-100' 
                        : 'bg-gray-100'
                    }`}>
                      <DocumentIcon className={`w-5 h-5 ${
                        application.verification_status.kyc_status === 'submitted' 
                          ? 'text-green-600' 
                          : 'text-gray-400'
                      }`} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">KYC Documents</p>
                    <p className="text-sm text-gray-500">
                      {application.verification_status.kyc_status === 'submitted' 
                        ? `Submitted on ${application.verification_status.kyc_submitted_at ? format(new Date(application.verification_status.kyc_submitted_at), 'MMM dd, yyyy HH:mm') : 'Unknown date'}`
                        : 'Pending'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      application.verification_status.profile_completed 
                        ? 'bg-green-100' 
                        : 'bg-gray-100'
                    }`}>
                      <UserIcon className={`w-5 h-5 ${
                        application.verification_status.profile_completed 
                          ? 'text-green-600' 
                          : 'text-gray-400'
                      }`} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Profile Completion</p>
                    <p className="text-sm text-gray-500">
                      {application.verification_status.profile_completed 
                        ? `Completed on ${application.verification_status.profile_submitted_at ? format(new Date(application.verification_status.profile_submitted_at), 'MMM dd, yyyy HH:mm') : 'Unknown date'}`
                        : 'Pending'
                      }
                    </p>
                  </div>
                </div>

                {application.verification_status.profile_approved_at && application.verification_status.profile_approved_by && (
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        application.verification_status.profile_approved 
                          ? 'bg-green-100' 
                          : 'bg-red-100'
                      }`}>
                        {application.verification_status.profile_approved ? (
                          <CheckCircleIcon className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircleIcon className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Admin Review</p>
                      <p className="text-sm text-gray-500">
                        {application.verification_status.profile_approved ? 'Approved' : 'Rejected'} on{' '}
                        {format(new Date(application.verification_status.profile_approved_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                      {!application.verification_status.profile_approved && application.verification_status.profile_rejection_reason && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                          <p className="text-sm text-red-700 mt-1">{application.verification_status.profile_rejection_reason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Image */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <PhotoIcon className="h-5 w-5 mr-2" />
                Profile Image
              </h3>
              {(() => {
                // Check profile for image (instructor profiles don't have separate image URLs)
                const profileImageUrl = application.profile.profile_image_url;
                
                if (profileImageUrl) {
                  return (
                    <img
                      src={profileImageUrl}
                      alt="Profile"
                      className="w-full h-48 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                        if (nextElement) {
                          nextElement.style.display = 'flex';
                        }
                      }}
                    />
                  );
                }
                
                return (
                  <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <span className="text-gray-500 text-sm">No profile image uploaded</span>
                      <p className="text-xs text-gray-400 mt-1">User can upload during registration</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Car Image - Only for Instructors */}
            {application.profile.role === 'instructor' && (
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <PhotoIcon className="h-5 w-5 mr-2" />
                  Car Image
                </h3>
                {(() => {
                  // Check profile for car image (instructor profiles don't have separate car image URLs)
                  const carImageUrl = application.profile.car_image_url;
                  
                  if (carImageUrl) {
                    return (
                      <img
                        src={carImageUrl}
                        alt="Car"
                        className="w-full h-48 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                          if (nextElement) {
                            nextElement.style.display = 'flex';
                          }
                        }}
                      />
                    );
                  }
                  
                  return (
                    <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <span className="text-gray-500 text-sm">No car image uploaded</span>
                        <p className="text-xs text-gray-400 mt-1">Required for instructor applications</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* KYC Documents */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <DocumentIcon className="h-5 w-5 mr-2" />
                KYC Documents
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Photo ID</label>
                  {application.verification_status.kyc_photo_id_path ? (
                    <div className="mt-2">
                      <div 
                        className={`relative w-full h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors group ${kycLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => !kycLoading && application.verification_status.kyc_photo_id_path && openKycDocument('Photo ID', application.verification_status.kyc_photo_id_path)}
                      >
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          {kycLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                              <p className="text-sm text-gray-500 mt-2">Loading...</p>
                            </>
                          ) : (
                            <>
                              <PhotoIcon className="h-8 w-8 text-gray-400 group-hover:text-blue-500" />
                              <p className="text-sm text-gray-500 group-hover:text-blue-600 mt-1">Click to view Photo ID</p>
                            </>
                          )}
                        </div>
                        {!kycLoading && (
                          <div className="absolute top-2 right-2">
                            <EyeIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-500" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        File: {application.verification_status.kyc_photo_id_path.split('/').pop()}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-gray-500">Not provided</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Instructor License</label>
                  {application.verification_status.kyc_instructor_id_path ? (
                    <div className="mt-2">
                      <div 
                        className={`relative w-full h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors group ${kycLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => !kycLoading && application.verification_status.kyc_instructor_id_path && openKycDocument('Instructor License', application.verification_status.kyc_instructor_id_path)}
                      >
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          {kycLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                              <p className="text-sm text-gray-500 mt-2">Loading...</p>
                            </>
                          ) : (
                            <>
                              <DocumentIcon className="h-8 w-8 text-gray-400 group-hover:text-blue-500" />
                              <p className="text-sm text-gray-500 group-hover:text-blue-600 mt-1">Click to view License</p>
                            </>
                          )}
                        </div>
                        {!kycLoading && (
                          <div className="absolute top-2 right-2">
                            <EyeIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-500" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        File: {application.verification_status.kyc_instructor_id_path.split('/').pop()}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-gray-500">Not provided</p>
                  )}
                </div>
                
              </div>
            </div>
          </div>
        </div>

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Application</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for rejection
                  </label>
                  <textarea
                    className="input-field"
                    rows={4}
                    placeholder="Please provide a reason for rejection..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowRejectModal(false)
                      setRejectReason('')
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={actionLoading || !rejectReason.trim()}
                    className="btn-danger"
                  >
                    {actionLoading ? 'Rejecting...' : 'Reject Application'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KYC Document Modal */}
        {showKycModal && selectedKycDoc && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedKycDoc.type}
                </h3>
                <button
                  onClick={() => setShowKycModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
                <div className="text-center">
                  <img
                    src={selectedKycDoc.url}
                    alt={selectedKycDoc.type}
                    className="max-w-full max-h-[70vh] mx-auto rounded-lg shadow-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      const nextElement = e.currentTarget.nextSibling as HTMLElement;
                      if (nextElement) {
                        nextElement.style.display = 'block';
                      }
                    }}
                  />
                  <div className="hidden mt-8 p-8 bg-gray-100 rounded-lg">
                    <DocumentIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Unable to load document image</p>
                    <p className="text-sm text-gray-500 mb-4">File: {selectedKycDoc.path}</p>
                    <a
                      href={selectedKycDoc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <EyeIcon className="h-4 w-4 mr-2" />
                      Open in New Tab
                    </a>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <a
                    href={selectedKycDoc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    <EyeIcon className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          userName={application?.profile.full_name || 'User'}
          deleteType={deleteType}
          isLoading={deleteLoading}
        />
      </div>
    </AdminLayout>
  )
}
