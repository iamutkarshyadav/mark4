import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, createSupabaseClientForAuthHeader } from '@/lib/policies'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    // Get current user
    const user = await getCurrentUser(authHeader)
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const { currentPassword, newPassword } = await request.json()

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Create user-scoped client
    const userSupabase = createSupabaseClientForAuthHeader(authHeader)

    // Verify current password by trying to sign in
    const { error: verifyError } = await userSupabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword
    })

    if (verifyError) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Update to new password
    const { data, error } = await userSupabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      console.error('Password change error:', error)
      return NextResponse.json(
        { error: 'Failed to change password' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Password changed successfully'
    })

  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
