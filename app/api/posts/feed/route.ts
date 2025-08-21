import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/policies'

export async function GET(request: NextRequest) {
  try {
    // Extract the authorization header
    const authHeader = request.headers.get('authorization')
    const user = await getCurrentUser(authHeader)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Get users that the current user follows
    const { data: followingData } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)

    const followingIds = followingData?.map(f => f.following_id) || []
    const userIds = [user.id, ...followingIds]

    // Get posts from user and followed users
    const { data, error, count } = await supabase
      .from('posts')
      .select(`
        *,
        author:users(id, username, avatar_url),
        comments(count)
      `, { count: 'exact' })
      .in('author_id', userIds)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Feed error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch feed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      posts: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('Feed error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
