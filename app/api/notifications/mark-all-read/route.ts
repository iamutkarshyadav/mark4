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

    // Create user-scoped client
    const userSupabase = createSupabaseClientForAuthHeader(authHeader)

    // Mark all unread notifications as read
    const { data, error } = await userSupabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', user.id)
      .eq('is_read', false)
      .select('id')

    if (error) {
      console.error('Error marking all notifications as read:', error)
      return NextResponse.json(
        { error: 'Failed to mark notifications as read' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `Marked ${data?.length || 0} notifications as read`
    })

  } catch (error) {
    console.error('Mark all notifications read error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
