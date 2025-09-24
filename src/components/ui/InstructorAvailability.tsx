'use client'

import { useState, useEffect } from 'react'
import { ClockIcon, CalendarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { getInstructorAvailability, formatTime, getDayName, formatDate } from '@/lib/availability-api'
import { AvailabilityData } from '@/types/database'

interface InstructorAvailabilityProps {
  instructorId: string
  instructorName: string
}

export default function InstructorAvailability({ instructorId, instructorName }: InstructorAvailabilityProps) {
  const [availability, setAvailability] = useState<AvailabilityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAvailability()
  }, [instructorId])

  const fetchAvailability = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getInstructorAvailability(instructorId)
      setAvailability(data)
    } catch (err) {
      console.error('Error fetching availability:', err)
      setError('Failed to load availability data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <ClockIcon className="h-5 w-5 mr-2" />
          Availability
        </h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <ClockIcon className="h-5 w-5 mr-2" />
          Availability
        </h3>
        <div className="text-red-600 text-sm">
          <ExclamationTriangleIcon className="h-4 w-4 inline mr-1" />
          {error}
        </div>
      </div>
    )
  }

  if (!availability) {
    return (
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <ClockIcon className="h-5 w-5 mr-2" />
          Availability
        </h3>
        <p className="text-gray-500 text-sm">No availability data found</p>
      </div>
    )
  }

  // Group working hours by day
  const workingHoursByDay = availability.working_hours.reduce((acc, hour) => {
    if (!acc[hour.day_of_week]) {
      acc[hour.day_of_week] = []
    }
    acc[hour.day_of_week].push(hour)
    return acc
  }, {} as Record<number, typeof availability.working_hours>)

  // Get upcoming date overrides (next 30 days)
  const today = new Date()
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  const upcomingOverrides = availability.date_overrides.filter(override => {
    const overrideDate = new Date(override.override_date)
    return overrideDate >= today && overrideDate <= thirtyDaysFromNow
  })

  return (
    <div className="card">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <ClockIcon className="h-5 w-5 mr-2" />
        Availability
      </h3>

      {/* Regular Working Hours */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center">
          <ClockIcon className="h-4 w-4 mr-2" />
          Regular Working Hours
        </h4>
        
        {Object.keys(workingHoursByDay).length === 0 ? (
          <p className="text-gray-500 text-sm">No regular working hours set</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(workingHoursByDay)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([dayOfWeek, hours]) => (
                <div key={dayOfWeek} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
                  <span className="font-medium text-gray-700">
                    {getDayName(parseInt(dayOfWeek))}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {hours
                      .sort((a, b) => a.slot_index - b.slot_index)
                      .map((hour, index) => (
                        <span
                          key={index}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            hour.is_available
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {hour.is_available
                            ? `${formatTime(hour.start_time)} - ${formatTime(hour.end_time)}`
                            : 'Unavailable'
                          }
                        </span>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Upcoming Date Overrides */}
      {upcomingOverrides.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Upcoming Schedule Changes (Next 30 Days)
          </h4>
          
          <div className="space-y-2">
            {upcomingOverrides.map((override) => (
              <div key={override.id} className="p-3 bg-blue-50 rounded-md border-l-4 border-blue-400">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-blue-900">
                    {formatDate(override.override_date)}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      override.is_available
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {override.is_available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                
                {override.is_available && override.start_time && override.end_time && (
                  <p className="text-sm text-blue-700 mb-1">
                    Time: {formatTime(override.start_time)} - {formatTime(override.end_time)}
                  </p>
                )}
                
                {override.reason && (
                  <p className="text-sm text-blue-600">
                    Reason: {override.reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Working Days:</span>
            <span className="ml-2 font-medium">
              {Object.keys(workingHoursByDay).length} / 7
            </span>
          </div>
          <div>
            <span className="text-gray-500">Upcoming Changes:</span>
            <span className="ml-2 font-medium">
              {upcomingOverrides.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
