// Mock data for admin dashboard when Supabase is not accessible
import { ApplicationWithDetails } from '@/types/database'

export const mockApplications: ApplicationWithDetails[] = [
  {
    id: '1',
    full_name: 'John Smith',
    phone: '+1234567890',
    email: 'john.smith@example.com',
    address: '123 Main St, London, UK',
    profile_image_url: null,
    car_image_url: null,
    role: 'instructor',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    instructor_profiles: {
      id: '1',
      bio: 'Experienced driving instructor with 5+ years of experience',
      city: 'London',
      state: 'England',
      country: 'UK',
      profile_image_url: null,
      car_image_url: null,
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
      profile_rejection_reason: null,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    }
  },
  {
    id: '2',
    full_name: 'Sarah Johnson',
    phone: '+1234567891',
    email: 'sarah.johnson@example.com',
    address: '456 Oak Ave, Manchester, UK',
    profile_image_url: null,
    car_image_url: null,
    role: 'instructor',
    created_at: '2024-01-14T09:30:00Z',
    updated_at: '2024-01-14T09:30:00Z',
    instructor_profiles: {
      id: '2',
      bio: 'Professional driving instructor specializing in nervous drivers',
      city: 'Manchester',
      state: 'England',
      country: 'UK',
      profile_image_url: null,
      car_image_url: null,
      created_at: '2024-01-14T09:30:00Z',
      updated_at: '2024-01-14T09:30:00Z'
    },
    verification_status: {
      id: '2',
      phone_verified: true,
      kyc_status: 'approved',
      profile_completed: true,
      profile_approved: true,
      profile_approved_at: '2024-01-14T15:00:00Z',
      profile_approved_by: 'admin@drivedash.co.uk',
      profile_rejection_reason: null,
      created_at: '2024-01-14T09:30:00Z',
      updated_at: '2024-01-14T15:00:00Z'
    }
  },
  {
    id: '3',
    full_name: 'Mike Wilson',
    phone: '+1234567892',
    email: 'mike.wilson@example.com',
    address: '789 Pine St, Birmingham, UK',
    profile_image_url: null,
    car_image_url: null,
    role: 'instructor',
    created_at: '2024-01-13T14:20:00Z',
    updated_at: '2024-01-13T14:20:00Z',
    instructor_profiles: {
      id: '3',
      bio: 'Driving instructor with focus on advanced driving techniques',
      city: 'Birmingham',
      state: 'England',
      country: 'UK',
      profile_image_url: null,
      car_image_url: null,
      created_at: '2024-01-13T14:20:00Z',
      updated_at: '2024-01-13T14:20:00Z'
    },
    verification_status: {
      id: '3',
      phone_verified: false,
      kyc_status: 'incomplete',
      profile_completed: false,
      profile_approved: null,
      profile_approved_at: null,
      profile_approved_by: null,
      profile_rejection_reason: null,
      created_at: '2024-01-13T14:20:00Z',
      updated_at: '2024-01-13T14:20:00Z'
    }
  }
]

export const mockStats = {
  total: 3,
  pending: 1,
  approved: 1,
  rejected: 0,
  incomplete: 1
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
