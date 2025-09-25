import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // First, get all approved instructor IDs from verification_status
    const { data: approvedIds, error: verificationError } = await supabaseAdmin
      .from('verification_status')
      .select('id')
      .eq('profile_approved', true)

    if (verificationError) {
      console.error('Error fetching approved instructor IDs:', verificationError)
      return NextResponse.json(
        { error: 'Failed to fetch approved instructors' },
        { status: 500 }
      )
    }

    if (!approvedIds || approvedIds.length === 0) {
      return NextResponse.json([])
    }

    // Extract the IDs
    const instructorIds = approvedIds.map(item => item.id)

    // Now get the instructor profiles for these approved IDs
    const { data: instructors, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        phone,
        created_at
      `)
      .eq('role', 'instructor')
      .in('id', instructorIds)
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('Error fetching instructor profiles:', profilesError)
      return NextResponse.json(
        { error: 'Failed to fetch instructor profiles' },
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
