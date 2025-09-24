'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ApplicationWithDetails } from '@/types/database'

export default function DataDebugger() {
  const [data, setData] = useState<ApplicationWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      console.log('Debug: Fetching data...')
      
      // Fetch profiles first
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          *,
          instructor_profiles(*)
        `)
        .eq('role', 'instructor')

      console.log('Debug: Profiles data:', profilesData)
      console.log('Debug: Profiles error:', profilesError)

      if (profilesError) throw profilesError

      // Fetch verification status separately
      const profileIds = profilesData?.map(profile => profile.id) || []
      let verificationData = []
      
      if (profileIds.length > 0) {
        const { data: verificationStatus, error: verificationError } = await supabase
          .from('verification_status')
          .select('*')
          .in('id', profileIds)
        
        console.log('Debug: Verification data:', verificationStatus)
        console.log('Debug: Verification error:', verificationError)
        
        if (verificationError) {
          console.error('Debug: Error fetching verification status:', verificationError)
        } else {
          verificationData = verificationStatus || []
        }
      }

      // Combine the data
      const combinedData = profilesData?.map(profile => {
        const verification = verificationData.find(v => v.id === profile.id)
        return {
          profile,
          instructor_profile: profile.instructor_profiles,
          verification_status: verification || {
            id: profile.id,
            phone_verified: false,
            kyc_status: 'pending',
            profile_completed: false,
            profile_approved: null
          }
        }
      }) || []

      console.log('Debug: Combined data:', combinedData)
      setData(combinedData)
    } catch (error) {
      console.error('Error fetching debug data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading debug data...</div>

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Debug: Raw Database Data</h3>
      <div className="space-y-4">
        {data.map((app) => (
          <div key={app.profile.id} className="border p-4 rounded">
            <div className="font-medium">{app.profile.full_name}</div>
            <div className="text-sm text-gray-600">
              <div>Email: {app.profile.email}</div>
              <div>KYC Status: {app.verification_status.kyc_status}</div>
              <div>Profile Completed: {app.verification_status.profile_completed ? 'Yes' : 'No'}</div>
              <div>Profile Approved: {app.verification_status.profile_approved === null ? 'Null' : app.verification_status.profile_approved ? 'True' : 'False'}</div>
              <div>KYC Submitted At: {app.verification_status.kyc_submitted_at || 'Not submitted'}</div>
              <div>Photo ID Path: {app.verification_status.kyc_photo_id_path || 'No path'}</div>
              <div>Instructor ID Path: {app.verification_status.kyc_instructor_id_path || 'No path'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
