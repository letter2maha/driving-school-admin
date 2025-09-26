import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const instructorId = params.id

    // First check if this instructor is approved
    const { data: verificationCheck, error: verificationError } = await supabaseAdmin
      .from('verification_status')
      .select('profile_approved')
      .eq('id', instructorId)
      .eq('profile_approved', true)
      .single()

    if (verificationError || !verificationCheck) {
      return NextResponse.json(
        { error: 'Approved instructor not found' },
        { status: 404 }
      )
    }

    // Get instructor details
    const { data: instructorData, error: instructorError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', instructorId)
      .eq('role', 'instructor')
      .single()

    if (instructorError || !instructorData) {
      return NextResponse.json(
        { error: 'Instructor not found' },
        { status: 404 }
      )
    }

    const instructor = {
      id: instructorData.id,
      full_name: instructorData.full_name,
      email: instructorData.email,
      phone: instructorData.phone,
      address: instructorData.address,
      role: instructorData.role,
      created_at: instructorData.created_at,
      updated_at: instructorData.updated_at
    }

    // Get invited students (pending registration)
    const { data: invitedStudents, error: invitedError } = await supabaseAdmin
      .from('student_invitations')
      .select('*')
      .eq('instructor_id', instructorId)
      .eq('status', 'pending') // Only pending invitations
      .gt('expires_at', new Date().toISOString()) // Only non-expired invitations
      .order('created_at', { ascending: false })

    if (invitedError) {
      console.error('Error fetching invited students:', invitedError)
    }

    // Get enrolled students (active) - Expo app creates relationships with status = 'accepted'
    const { data: enrolledStudents, error: enrolledError } = await supabaseAdmin
      .from('student_instructor_relationships')
      .select(`
        *,
        profiles:student_id (
          id,
          full_name,
          phone,
          email,
          created_at,
          profile_image_url
        )
      `)
      .eq('instructor_id', instructorId)
      .in('status', ['accepted', 'active']) // Expo app creates relationships with status = 'accepted' or 'active'
      .order('created_at', { ascending: false })

    if (enrolledError) {
      console.error('Error fetching enrolled students:', enrolledError)
    }

    // Transform invited students
    const invitedStudentsFormatted = (invitedStudents || []).map(invitation => ({
      student_type: 'invited',
      invitation_id: invitation.id,
      name: invitation.student_name,
      phone: invitation.student_phone,
      email: invitation.student_email,
      referral_code: invitation.referral_code,
      invitation_link: invitation.invitation_link,
      expires_at: invitation.expires_at,
      created_at: invitation.created_at,
      student_id: null,
      status: null,
      enrollment_date: null
    }))

    // Transform enrolled students
    const enrolledStudentsFormatted = (enrolledStudents || []).map(relationship => ({
      student_type: 'enrolled',
      invitation_id: null,
      name: relationship.profiles?.full_name || 'Unknown',
      phone: relationship.profiles?.phone || 'N/A',
      email: relationship.profiles?.email || 'N/A',
      referral_code: relationship.referral_code,
      invitation_link: null,
      expires_at: null,
      created_at: relationship.created_at,
      student_id: relationship.student_id,
      status: relationship.status,
      enrollment_date: relationship.profiles?.created_at
    }))

    // Combine all students
    const allStudents = [...invitedStudentsFormatted, ...enrolledStudentsFormatted]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({
      instructor: {
        id: instructor.id,
        full_name: instructor.full_name,
        email: instructor.email,
        phone: instructor.phone,
        created_at: instructor.created_at
      },
      students: allStudents,
      summary: {
        total_invited: invitedStudentsFormatted.length,
        total_enrolled: enrolledStudentsFormatted.length,
        total_students: allStudents.length
      }
    })

  } catch (error) {
    console.error('Error in instructor students API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
