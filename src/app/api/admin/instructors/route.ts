import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get only approved/active instructors with their basic info
    const { data: instructors, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        phone,
        created_at
      `)
      .eq('role', 'instructor')
      .eq('profile_approved', true) // Only approved instructors
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching instructors:', error)
      return NextResponse.json(
        { error: 'Failed to fetch instructors' },
        { status: 500 }
      )
    }

    return NextResponse.json(instructors || [])

  } catch (error) {
    console.error('Error in instructors API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
