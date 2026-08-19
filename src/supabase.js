import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder'

if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('your-project-id')) {
  console.error(
    '⚠️ Supabase not configured.\n' +
    'Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
  )
}

const customFetch = (input, init) => {
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
