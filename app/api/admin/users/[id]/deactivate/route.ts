import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, createSupabaseClientForAuthHeader } from '@/lib/policies'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    // Get current user and verify admin
    const user = await getCurrentUser(authHeader)
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const userSupabase = createSupabaseClientForAuthHeader(authHeader)
    const { data: userProfile } = await userSupabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const userId = params.id

    // Prevent admin from deactivating themselves
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot deactivate your own account' },
        { status: 400 }
      )
    }

    // Check if user exists
    const { data: targetUser } = await userSupabase
      .from('users')
      .select('id, username')
      .eq('id', userId)
      .single()

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Deactivate user in Supabase Auth (requires admin client)
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { user_metadata: { is_active: false } }
    )

    if (authError) {
      console.error('Error deactivating user in auth:', authError)
      return NextResponse.json(
        { error: 'Failed to deactivate user' },
        { status: 500 }
      )
    }

    // Deactivate user's posts
    const { error: postsError } = await userSupabase
      .from('posts')
      .update({ is_active: false })
      .eq('author_id', userId)

    if (postsError) {
      console.error('Error deactivating user posts:', postsError)
    }

    return NextResponse.json({
      message: `User ${targetUser.username} has been deactivated`
    })

  } catch (error) {
    console.error('Admin user deactivate error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
