'use client'

import AdminLayout from '@/components/layout/AdminLayout'
import { useState, useEffect } from 'react'
import { 
  UserGroupIcon, 
  PlusIcon,
  EyeIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface Instructor {
  id: string
  full_name: string
  email: string
  phone: string
  created_at: string
}

interface Student {
  student_type: 'invited' | 'enrolled'
  invitation_id?: number
  name: string
  phone: string
  email: string
  referral_code: string
  invitation_link?: string
  expires_at?: string
  created_at: string
  student_id?: string
  status?: string
  enrollment_date?: string
}

interface InstructorWithStudents {
  instructor: Instructor
  students: Student[]
  summary: {
    total_invited: number
    total_enrolled: number
    total_students: number
  }
}

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [selectedInstructor, setSelectedInstructor] = useState<InstructorWithStudents | null>(null)
  const [loading, setLoading] = useState(true)
  const [studentsLoading, setStudentsLoading] = useState(false)

  useEffect(() => {
    fetchInstructors()
  }, [])

  const fetchInstructors = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/instructors')
      if (response.ok) {
        const data = await response.json()
        setInstructors(data)
      } else {
        console.error('Failed to fetch instructors')
      }
    } catch (error) {
      console.error('Error fetching instructors:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInstructorStudents = async (instructorId: string) => {
    try {
      setStudentsLoading(true)
      const response = await fetch(`/api/admin/instructors/${instructorId}/students`)
      if (response.ok) {
        const data = await response.json()
        setSelectedInstructor(data)
      } else {
        console.error('Failed to fetch instructor students')
      }
    } catch (error) {
      console.error('Error fetching instructor students:', error)
    } finally {
      setStudentsLoading(false)
    }
  }

  const getStudentStatusIcon = (student: Student) => {
    if (student.student_type === 'invited') {
      const isExpired = student.expires_at && new Date(student.expires_at) < new Date()
      return isExpired ? (
        <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      ) : (
        <ClockIcon className="h-5 w-5 text-yellow-500" />
      )
    } else {
      return student.status === 'accepted' ? (
        <CheckCircleIcon className="h-5 w-5 text-green-500" />
      ) : (
        <ClockIcon className="h-5 w-5 text-yellow-500" />
      )
    }
  }

  const getStudentStatusBadge = (student: Student) => {
    if (student.student_type === 'invited') {
      const isExpired = student.expires_at && new Date(student.expires_at) < new Date()
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isExpired ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {isExpired ? 'Expired' : 'Invited'}
        </span>
      )
    } else {
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          student.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {student.status === 'accepted' ? 'Enrolled' : 'Pending'}
        </span>
      )
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Instructor Management</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage approved instructors and their students
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button className="btn-primary">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Instructor
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Instructors List */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Approved Instructors</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {instructors.length} Active
                </span>
              </div>
              <div className="space-y-3">
                {instructors.map((instructor) => (
                  <div
                    key={instructor.id}
                    onClick={() => fetchInstructorStudents(instructor.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedInstructor?.instructor.id === instructor.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">{instructor.full_name}</h4>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Approved
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{instructor.email}</p>
                      </div>
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Students List */}
          <div className="lg:col-span-2">
            <div className="card">
              {selectedInstructor ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Students - {selectedInstructor.instructor.full_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {selectedInstructor.summary.total_students} total students
                      </p>
                    </div>
                    <div className="flex space-x-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {selectedInstructor.summary.total_invited}
                        </div>
                        <div className="text-gray-500">Invited</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {selectedInstructor.summary.total_enrolled}
                        </div>
                        <div className="text-gray-500">Enrolled</div>
                      </div>
                    </div>
                  </div>

                  {studentsLoading ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedInstructor.students.map((student, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                {getStudentStatusIcon(student)}
                                <h4 className="font-medium text-gray-900">{student.name}</h4>
                                {getStudentStatusBadge(student)}
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                                <div className="flex items-center space-x-2">
                                  <PhoneIcon className="h-4 w-4" />
                                  <span>{student.phone}</span>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <EnvelopeIcon className="h-4 w-4" />
                                  <span>{student.email}</span>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <CalendarIcon className="h-4 w-4" />
                                  <span>
                                    {student.student_type === 'invited' ? 'Invited' : 'Enrolled'}: {formatDate(student.created_at)}
                                  </span>
                                </div>

                                {student.expires_at && (
                                  <div className="flex items-center space-x-2">
                                    <ExclamationTriangleIcon className="h-4 w-4" />
                                    <span>
                                      Expires: {formatDate(student.expires_at)}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {student.referral_code && (
                                <div className="mt-2">
                                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-gray-100 text-gray-800">
                                    Code: {student.referral_code}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="ml-4 flex flex-col space-y-2">
                              {student.student_type === 'invited' && student.invitation_link && (
                                <button className="btn-secondary text-xs">
                                  Resend Invite
                                </button>
                              )}
                              {student.student_type === 'invited' && (
                                <button className="btn-danger text-xs">
                                  Cancel Invite
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {selectedInstructor.students.length === 0 && (
                        <div className="text-center py-8">
                          <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
                          <p className="text-gray-500">
                            This instructor hasn't invited or enrolled any students yet.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Instructor</h3>
                  <p className="text-gray-500">
                    Choose an instructor from the list to view their students.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
