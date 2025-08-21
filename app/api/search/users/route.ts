import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
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

    // Search users by username and email
    const { data, error, count } = await supabase
      .from('users')
      .select(`
        id,
        username,
        email,
        bio,
        avatar_url,
        created_at
      `, { count: 'exact' })
      .or(`username.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('User search error:', error)
      return NextResponse.json(
        { error: 'Search failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      users: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      },
      query: searchTerm
    })

  } catch (error) {
    console.error('User search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
