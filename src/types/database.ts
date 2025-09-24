export interface Profile {
  id: string
  full_name: string
  phone: string
  email: string
  address: string
  profile_image_url?: string
  car_image_url?: string
  role: 'instructor' | 'student'
  created_at: string
  updated_at: string
  deleted_at?: string | null
  deleted_by?: string | null
  deletion_reason?: string | null
}

export interface InstructorProfile {
  id: string
  expertise: string[]
  experience_years: number
  bio: string
  manual_price_min: number
  manual_price_max: number
  automatic_price_min: number
  automatic_price_max: number
  expertise_keywords: string[]
  car_details: string
  created_at: string
  updated_at: string
  deleted_at?: string | null
  deleted_by?: string | null
  deletion_reason?: string | null
}

export interface StudentProfile {
  id: string
  date_of_birth?: string
  emergency_contact?: string
  emergency_phone?: string
  license_type?: string
  created_at: string
  updated_at: string
  deleted_at?: string | null
  deleted_by?: string | null
  deletion_reason?: string | null
}

export interface VerificationStatus {
  id: string
  phone_verified: boolean
  phone_verified_at?: string
  kyc_status: 'pending' | 'submitted' | 'approved' | 'rejected'
  kyc_photo_id_path?: string
  kyc_instructor_id_path?: string
  kyc_submitted_at?: string
  kyc_approved_at?: string
  profile_completed: boolean
  profile_submitted_at?: string
  profile_approved?: boolean | null
  profile_approved_at?: string | null
  profile_approved_by?: string | null
  profile_rejection_reason?: string
  created_at: string
  updated_at: string
  deleted_at?: string | null
  deleted_by?: string | null
  deletion_reason?: string | null
}

export interface ApplicationWithDetails {
  profile: Profile
  instructor_profile?: InstructorProfile
  student_profile?: StudentProfile
  verification_status: VerificationStatus
}

export interface AdminUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'super_admin'
  created_at: string
}

export interface WorkingHours {
  id: string
  instructor_id: string
  day_of_week: number // 0-6: Sunday=0, Monday=1, ..., Saturday=6
  start_time: string // HH:MM:SS format
  end_time: string // HH:MM:SS format
  is_available: boolean
  slot_index: number // for multiple time slots per day
  created_at: string
  updated_at: string
}

export interface DateOverride {
  id: string
  instructor_id: string
  override_date: string // YYYY-MM-DD format
  start_time?: string | null // HH:MM:SS format, nullable
  end_time?: string | null // HH:MM:SS format, nullable
  is_available: boolean
  reason?: string | null
  created_at: string
  updated_at: string
}

export interface AvailabilityData {
  working_hours: WorkingHours[]
  date_overrides: DateOverride[]
}
