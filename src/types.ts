// ─── Shared types ─────────────────────────────────────────────────────────────

export interface User {
  id: string        // Supabase auth UUID — permanent & unique
  name: string
  email: string
  initials: string
  createdAt: string
}

export interface Todo {
  id: string
  text: string
  completed: boolean
  note: string
  dueDate: string | null  // "YYYY-MM-DD"
  createdAt: string
}

export type FilterType = 'all' | 'active' | 'completed'
