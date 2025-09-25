import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get only approved/active instructors with their basic info
    // Join with verification_status to check approval status
    const { data: instructors, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        phone,
        created_at,
        verification_status!inner (
          profile_approved
        )
      `)
      .eq('role', 'instructor')
      .eq('verification_status.profile_approved', true) // Only approved instructors
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching instructors:', error)
      return NextResponse.json(
        { error: 'Failed to fetch instructors' },
        { status: 500 }
      )
    }

    // Clean up the response to remove the nested verification_status object
    const cleanedInstructors = instructors?.map(instructor => ({
      id: instructor.id,
      full_name: instructor.full_name,
      email: instructor.email,
      phone: instructor.phone,
      created_at: instructor.created_at
    })) || []

    return NextResponse.json(cleanedInstructors)

  } catch (error) {
    console.error('Error in instructors API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
