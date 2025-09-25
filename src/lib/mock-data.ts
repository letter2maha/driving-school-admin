// Mock data for admin dashboard when Supabase is not accessible
import { ApplicationWithDetails } from '@/types/database'

export const mockApplications: ApplicationWithDetails[] = [
  {
    profile: {
      id: '1',
      full_name: 'John Smith',
      phone: '+1234567890',
      email: 'john.smith@example.com',
      address: '123 Main St, London, UK',
      profile_image_url: undefined,
      car_image_url: undefined,
      role: 'instructor',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    instructor_profile: {
      id: '1',
      bio: 'Experienced driving instructor with 5+ years of experience',
      city: 'London',
      state: 'England',
      country: 'UK',
      profile_image_url: undefined,
      car_image_url: undefined,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    verification_status: {
      id: '1',
      phone_verified: true,
      kyc_status: 'pending',
      profile_completed: true,
      profile_approved: null,
      profile_approved_at: null,
      profile_approved_by: null,
      profile_rejection_reason: undefined,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    }
  },
  {
    profile: {
      id: '2',
      full_name: 'Sarah Johnson',
      phone: '+1234567891',
      email: 'sarah.johnson@example.com',
      address: '456 Oak Ave, Manchester, UK',
      profile_image_url: undefined,
      car_image_url: undefined,
      role: 'instructor',
      created_at: '2024-01-16T11:00:00Z',
      updated_at: '2024-01-16T11:00:00Z'
    },
    instructor_profile: {
      id: '2',
      bio: 'Professional driving instructor specializing in nervous drivers',
      city: 'Manchester',
      state: 'England',
      country: 'UK',
      profile_image_url: undefined,
      car_image_url: undefined,
      created_at: '2024-01-16T11:00:00Z',
      updated_at: '2024-01-16T11:00:00Z'
    },
    verification_status: {
      id: '2',
      phone_verified: true,
      kyc_status: 'submitted',
      profile_completed: true,
      profile_approved: true,
      profile_approved_at: '2024-01-16T12:00:00Z',
      profile_approved_by: 'admin',
      profile_rejection_reason: undefined,
      created_at: '2024-01-16T11:00:00Z',
      updated_at: '2024-01-16T12:00:00Z'
    }
  },
  {
    profile: {
      id: '3',
      full_name: 'Mike Brown',
      phone: '+1234567892',
      email: 'mike.brown@example.com',
      address: '789 Pine St, Birmingham, UK',
      profile_image_url: undefined,
      car_image_url: undefined,
      role: 'student',
      created_at: '2024-01-17T09:00:00Z',
      updated_at: '2024-01-17T09:00:00Z'
    },
    student_profile: {
      id: '3',
      date_of_birth: '1995-06-15',
      emergency_contact: 'Jane Brown',
      emergency_phone: '+1234567893',
      license_type: 'B',
      created_at: '2024-01-17T09:00:00Z',
      updated_at: '2024-01-17T09:00:00Z'
    },
    verification_status: {
      id: '3',
      phone_verified: false,
      kyc_status: 'not_submitted',
      profile_completed: false,
      profile_approved: null,
      profile_approved_at: null,
      profile_approved_by: null,
      profile_rejection_reason: undefined,
      created_at: '2024-01-17T09:00:00Z',
      updated_at: '2024-01-17T09:00:00Z'
    }
  }
]

export const mockStats = {
  total: mockApplications.length,
  pending: mockApplications.filter(app => app.verification_status.profile_approved === null && app.verification_status.profile_completed).length,
  approved: mockApplications.filter(app => app.verification_status.profile_approved === true).length,
  rejected: mockApplications.filter(app => app.verification_status.profile_approved === false).length,
  incomplete: mockApplications.filter(app => !app.verification_status.profile_completed || !app.verification_status.phone_verified).length
}

export function getMockApplications(): ApplicationWithDetails[] {
  return mockApplications
}

export function getMockStats() {
  return mockStats
}

export function getMockRecentApplications(): ApplicationWithDetails[] {
  return mockApplications.slice(0, 3)
}