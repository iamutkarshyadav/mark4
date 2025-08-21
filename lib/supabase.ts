import { createClient } from '@supabase/supabase-js'
import { config } from './config'

export const supabase = createClient(config.supabase.url, config.supabase.anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'socialconnect-auth-token',
    flowType: 'pkce'
  }
})

// For server-side operations that require elevated privileges
export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
