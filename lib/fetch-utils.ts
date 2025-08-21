import { supabase } from './supabase';

interface FetchOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
}

export async function authenticatedFetch(
  url: string, 
  options: FetchOptions = {}
): Promise<Response> {
  const {
    method = 'GET',
    body,
    headers = {},
    retries = 2,
    retryDelay = 1000
  } = options;

  // Get fresh session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('Session error:', sessionError);
    throw new Error(`Authentication error: ${sessionError.message}`);
  }

  if (!session?.access_token) {
    throw new Error('No valid session found');
  }

  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      ...headers
    }
  };

  if (body && method !== 'GET') {
    fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`Fetching ${url} (attempt ${attempt + 1})`);
      
      const response = await fetch(url, fetchOptions);
      
      if (response.ok) {
        return response;
      }
      
      // If it's the last attempt or it's a client error (4xx), don't retry
      if (attempt === retries || (response.status >= 400 && response.status < 500)) {
        return response;
      }
      
      console.warn(`Fetch failed (${response.status}), retrying in ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      
    } catch (error) {
      console.error(`Fetch attempt ${attempt + 1} failed:`, error);
      
      // If it's the last attempt, throw the error
      if (attempt === retries) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  throw new Error('All fetch attempts failed');
}

export async function safeFetch(
  url: string,
  options: FetchOptions = {}
): Promise<{ data?: any; error?: string; response?: Response }> {
  try {
    const response = await authenticatedFetch(url, options);
    
    if (response.ok) {
      const data = await response.json();
      return { data, response };
    } else {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return { 
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        response
      };
    }
  } catch (error: any) {
    console.error('Safe fetch error:', error);
    return { 
      error: error.message || 'Network error. Please check your connection and try again.'
    };
  }
}
