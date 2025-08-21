import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, createSupabaseClientForAuthHeader } from '@/lib/policies'

export async function GET(request: NextRequest) {
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

    // Get today's date for active users filter
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Fetch all statistics in parallel
    const [
      totalUsersResult,
      totalPostsResult,
      activePostsResult,
      totalCommentsResult,
      totalLikesResult,
      totalFollowsResult,
      recentUsersResult,
      recentPostsResult
    ] = await Promise.all([
      userSupabase
        .from('users')
        .select('id', { count: 'exact', head: true }),
      userSupabase
        .from('posts')
        .select('id', { count: 'exact', head: true }),
      userSupabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),
      userSupabase
        .from('comments')
        .select('id', { count: 'exact', head: true }),
      userSupabase
        .from('likes')
        .select('id', { count: 'exact', head: true }),
      userSupabase
        .from('follows')
        .select('follower_id', { count: 'exact', head: true }),
      userSupabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', today.toISOString()),
      userSupabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())
    ])

    // Check for any errors
    const errors = [
      totalUsersResult.error,
      totalPostsResult.error,
      activePostsResult.error,
      totalCommentsResult.error,
      totalLikesResult.error,
      totalFollowsResult.error,
      recentUsersResult.error,
      recentPostsResult.error
    ].filter(Boolean)

    if (errors.length > 0) {
      console.error('Error fetching stats:', errors)
      return NextResponse.json(
        { error: 'Failed to fetch statistics' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      totalUsers: totalUsersResult.count || 0,
      totalPosts: totalPostsResult.count || 0,
      activePosts: activePostsResult.count || 0,
      totalComments: totalCommentsResult.count || 0,
      totalLikes: totalLikesResult.count || 0,
      totalFollows: totalFollowsResult.count || 0,
      usersRegisteredToday: recentUsersResult.count || 0,
      postsCreatedToday: recentPostsResult.count || 0,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
