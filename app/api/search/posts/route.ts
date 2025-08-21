import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    const searchTerm = query.trim()

    // Build search query
    let searchQuery = supabase
      .from('posts')
      .select(`
        *,
        author:users(id, username, avatar_url),
        comments(count)
      `, { count: 'exact' })
      .eq('is_active', true)

    // Search by content and optionally by category
    if (category && category.trim().length > 0) {
      searchQuery = searchQuery
        .or(`content.ilike.%${searchTerm}%,category.ilike.%${category.trim()}%`)
    } else {
      searchQuery = searchQuery
        .or(`content.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
    }

    const { data, error, count } = await searchQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Post search error:', error)
      return NextResponse.json(
        { error: 'Search failed' },
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
      },
      query: searchTerm,
      category: category || null
    })

  } catch (error) {
    console.error('Post search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
