import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateEmail } from '@/lib/validators'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json({
      message: 'Login successful',
      user: data.user,
      session: data.session
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
