import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || url.includes('your-project-id')) {
  console.error(
    '⚠️  Supabase not configured.\n' +
    'Open .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  )
}

// Custom fetch wrapper for Safari / WebKit compatibility
const customFetch = (input: RequestInfo | URL, init?: RequestInit) => {
  return fetch(input, {
    ...init,
    mode: 'cors',
  })
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: customFetch,
  },
})
