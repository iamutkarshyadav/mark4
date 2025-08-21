import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error && !error.message.includes('session_missing')) {
          console.error('Session error:', error)
          setAuthState(prev => ({ ...prev, error: error.message, loading: false }))
          return
        }

        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
          error: null
        })
      } catch (error: any) {
        console.error('Auth initialization error:', error)
        setAuthState(prev => ({ 
          ...prev, 
          error: error.message || 'Authentication error', 
          loading: false 
        }))
      }
    }

    getInitialSession()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event, session?.user?.email || 'no user')
      
      setAuthState({
        user: session?.user ?? null,
        session,
        loading: false,
        error: null
      })
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
        return { error }
      }
      return { error: null }
    } catch (error: any) {
      console.error('Sign out error:', error)
      return { error: error.message }
    }
  }

  return {
    ...authState,
    signOut
  }
}
