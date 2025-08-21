import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, createSupabaseClientForAuthHeader } from '@/lib/policies'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
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

    // Get user details with comprehensive stats
    const { data: targetUser, error } = await userSupabase
      .from('users')
      .select(`
        *,
        posts_count:posts(count),
        followers_count:follows!follows_following_id_fkey(count),
        following_count:follows!follows_follower_id_fkey(count),
        recent_posts:posts(id, content, created_at, like_count, comment_count)
      `)
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user details:', error)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user: targetUser })

  } catch (error) {
    console.error('Admin user details error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
