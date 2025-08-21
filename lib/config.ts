// Configuration file to explicitly load environment variables
export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'
  }
}

// Helper function to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  const url = config.supabase.url
  const anonKey = config.supabase.anonKey
  
  return url !== 'https://placeholder.supabase.co' && 
         anonKey !== 'placeholder-anon-key' &&
         url.length > 0 &&
         anonKey.length > 0
}

// Debug function to log configuration
export function logConfig(): void {
  console.log('=== CONFIG DEBUG ===')
  console.log('URL:', config.supabase.url)
  console.log('Anon Key Set:', config.supabase.anonKey !== 'placeholder-anon-key')
  console.log('Service Key Set:', config.supabase.serviceRoleKey !== 'placeholder-service-key')
  console.log('Is Configured:', isSupabaseConfigured())
  console.log('==================')
}
