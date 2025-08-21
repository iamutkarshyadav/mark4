import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:users(id, username, avatar_url, bio),
        comments(
          id,
          text,
          created_at,
          author:users(id, username, avatar_url)
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      post: data
    })

  } catch (error) {
    console.error('Get post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
