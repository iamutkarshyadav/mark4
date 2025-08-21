import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { post_id: string } }
) {
  try {
    const { post_id } = params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Check if post exists and is active
    const { data: post } = await supabase
      .from('posts')
      .select('id')
      .eq('id', post_id)
      .eq('is_active', true)
      .single()

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found or inactive' },
        { status: 404 }
      )
    }

    // Get comments for the post
    const { data, error, count } = await supabase
      .from('comments')
      .select(`
        *,
        author:users(id, username, avatar_url)
      `, { count: 'exact' })
      .eq('post_id', post_id)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Comments fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      comments: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('Comments fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
