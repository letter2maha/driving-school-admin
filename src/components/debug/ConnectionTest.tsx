'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ConnectionTest() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    setResult('')
    
    try {
      console.log('Testing Supabase connection...')
      console.log('Supabase URL:', 'https://parriuibqsfakwlmbdac.supabase.co')
      console.log('Supabase Key:', 'Present (hardcoded)')
      
      // Test basic connection with a simple query
      const { data, error } = await supabase
        .from('instructor_profiles')
        .select('id, bio, experience_years')
        .limit(3)
      
      if (error) {
        setResult(`Error: ${error.message}`)
        console.error('Connection test error:', error)
      } else {
        setResult('Connection successful!')
        console.log('Connection test successful:', data)
      }
    } catch (err) {
      setResult(`Exception: ${err}`)
      console.error('Connection test exception:', err)
    } finally {
      setLoading(false)
    }
  }

  const testAllProfiles = async () => {
    setLoading(true)
    setResult('')
    
    try {
      // First, let's try to get ALL instructor profiles
      const { data, error } = await supabase
        .from('instructor_profiles')
        .select('*')
        .limit(10)
      
      if (error) {
        setResult(`Error fetching instructor profiles: ${error.message}`)
      } else {
        setResult(`Found ${data?.length || 0} instructor profiles: ${JSON.stringify(data, null, 2)}`)
      }
    } catch (err) {
      setResult(`Exception: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const testInstructorProfiles = async () => {
    setLoading(true)
    setResult('')
    
    try {
      // Test specifically for instructor profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'instructor')
        .limit(10)
      
      if (error) {
        setResult(`Error fetching instructor profiles: ${error.message}`)
      } else {
        setResult(`Found ${data?.length || 0} instructor profiles: ${JSON.stringify(data, null, 2)}`)
      }
    } catch (err) {
      setResult(`Exception: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const testVerificationStatus = async () => {
    setLoading(true)
    setResult('')
    
    try {
      // Test if verification_status table exists
      const { data, error } = await supabase
        .from('verification_status')
        .select('*')
        .limit(5)
      
      if (error) {
        setResult(`Error fetching verification_status: ${error.message}`)
      } else {
        setResult(`Found ${data?.length || 0} verification_status records: ${JSON.stringify(data, null, 2)}`)
      }
    } catch (err) {
      setResult(`Exception: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Connection Test</h3>
      <div className="space-y-4">
        <div className="flex space-x-2 flex-wrap">
          <button
            onClick={testConnection}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Testing...' : 'Test Connection'}
          </button>
          <button
            onClick={testAllProfiles}
            disabled={loading}
            className="btn-secondary"
          >
            {loading ? 'Testing...' : 'All Profiles'}
          </button>
          <button
            onClick={testInstructorProfiles}
            disabled={loading}
            className="btn-secondary"
          >
            {loading ? 'Testing...' : 'Instructor Profiles'}
          </button>
          <button
            onClick={testVerificationStatus}
            disabled={loading}
            className="btn-secondary"
          >
            {loading ? 'Testing...' : 'Verification Status'}
          </button>
        </div>
        {result && (
          <div className="bg-gray-100 p-4 rounded">
            <pre className="text-sm whitespace-pre-wrap">{result}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
