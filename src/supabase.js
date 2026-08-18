import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || url.includes('your-project-id')) {
  console.error(
    '⚠️ Supabase not configured.\n' +
    'Open .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
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
