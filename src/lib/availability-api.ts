import { supabaseAdmin } from './supabase'
import { WorkingHours, DateOverride, AvailabilityData } from '@/types/database'

/**
 * Fetch working hours for an instructor
 * @param instructorId - The instructor's user ID
 * @returns Promise<WorkingHours[]> - Array of working hours
 */
export async function getWorkingHours(instructorId: string): Promise<WorkingHours[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('working_hours')
      .select('*')
      .eq('instructor_id', instructorId)
      .order('day_of_week', { ascending: true })
      .order('slot_index', { ascending: true })

    if (error) {
      console.error('Error fetching working hours:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getWorkingHours:', error)
    throw error
  }
}

/**
 * Fetch date overrides for an instructor
 * @param instructorId - The instructor's user ID
 * @returns Promise<DateOverride[]> - Array of date overrides
 */
export async function getDateOverrides(instructorId: string): Promise<DateOverride[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('date_overrides')
      .select('*')
      .eq('instructor_id', instructorId)
      .order('override_date', { ascending: true })

    if (error) {
      console.error('Error fetching date overrides:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getDateOverrides:', error)
    throw error
  }
}

/**
 * Fetch complete availability data for an instructor
 * @param instructorId - The instructor's user ID
 * @returns Promise<AvailabilityData> - Complete availability data
 */
export async function getInstructorAvailability(instructorId: string): Promise<AvailabilityData> {
  try {
    const [workingHours, dateOverrides] = await Promise.all([
      getWorkingHours(instructorId),
      getDateOverrides(instructorId)
    ])

    return {
      working_hours: workingHours,
      date_overrides: dateOverrides
    }
  } catch (error) {
    console.error('Error in getInstructorAvailability:', error)
    throw error
  }
}

/**
 * Format time from HH:MM:SS to HH:MM
 * @param timeString - Time in HH:MM:SS format
 * @returns string - Time in HH:MM format
 */
export function formatTime(timeString: string): string {
  if (!timeString) return ''
  return timeString.substring(0, 5) // Remove seconds
}

/**
 * Get day name from day of week number
 * @param dayOfWeek - Day of week (0-6: Sunday=0, Monday=1, ..., Saturday=6)
 * @returns string - Day name
 */
export function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dayOfWeek] || 'Unknown'
}

/**
 * Format date from YYYY-MM-DD to readable format
 * @param dateString - Date in YYYY-MM-DD format
 * @returns string - Formatted date
 */
export function formatDate(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}
