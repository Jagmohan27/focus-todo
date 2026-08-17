import { supabase } from './supabase'
import type { User, Todo } from './types'

// ─── Adapt Supabase user → our User type ─────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptUser(sbUser: any): User {
  const name     = sbUser.user_metadata?.name ?? sbUser.email ?? 'User'
  const words    = name.trim().split(' ')
  const initials = (words[0][0] + (words[1]?.[0] ?? words[0][1] ?? '')).toUpperCase()
  return {
    id:        sbUser.id,
    name,
    email:     sbUser.email ?? '',
    initials,
    createdAt: sbUser.created_at ?? new Date().toISOString(),
  }
}

export type AuthResult =
  | { ok: true;  user: User }
  | { ok: false; error: string }

// ─── Register ─────────────────────────────────────────────────────────────────
export async function register(
  name: string,
  email: string,
  password: string
): Promise<AuthResult> {
  if (password.length < 6)
    return { ok: false, error: 'Password must be at least 6 characters.' }

  try {
    const { data, error } = await supabase.auth.signUp({
      email:    email.trim().toLowerCase(),
      password,
      options:  { data: { name: name.trim() } },
    })

    if (error) {
      console.error('Supabase signUp error:', error)
      return { ok: false, error: `${error.name}: ${error.message}` }
    }
    if (!data.user) return { ok: false, error: 'Registration failed. User object missing.' }

    return { ok: true, user: adaptUser(data.user) }
  } catch (err: unknown) {
    console.error('Supabase signUp catch error:', err)
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
    return { ok: false, error: msg }
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────
export async function login(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email:    email.trim().toLowerCase(),
      password,
    })

    if (error) {
      console.error('Supabase signIn error:', error)
      return { ok: false, error: `${error.name}: ${error.message}` }
    }
    if (!data.user) return { ok: false, error: 'Login failed. User object missing.' }

    return { ok: true, user: adaptUser(data.user) }
  } catch (err: unknown) {
    console.error('Supabase signIn catch error:', err)
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
    return { ok: false, error: msg }
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export async function logout() {
  await supabase.auth.signOut()
}

// ─── Get current session user (on page load) ──────────────────────────────────
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data } = await supabase.auth.getSession()
    if (!data.session?.user) return null
    return adaptUser(data.session.user)
  } catch (err) {
    console.error('getCurrentUser error:', err)
    return null
  }
}

// ─── Todo CRUD (all scoped to the signed-in user via RLS) ────────────────────

export async function fetchTodos(userId: string): Promise<Todo[]> {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) { console.error('fetchTodos:', error.message); return [] }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any): Todo => ({
    id:        r.id,
    text:      r.text,
    completed: r.completed,
    note:      r.note ?? '',
    dueDate:   r.due_date ?? null,
    createdAt: r.created_at,
  }))
}

export async function insertTodo(
  userId: string,
  todo: Omit<Todo, 'id' | 'createdAt'>
): Promise<Todo | null> {
  const { data, error } = await supabase
    .from('todos')
    .insert({
      user_id:   userId,
      text:      todo.text,
      completed: todo.completed,
      note:      todo.note,
      due_date:  todo.dueDate,
    })
    .select()
    .single()

  if (error) { console.error('insertTodo:', error.message); return null }

  return {
    id:        data.id,
    text:      data.text,
    completed: data.completed,
    note:      data.note ?? '',
    dueDate:   data.due_date ?? null,
    createdAt: data.created_at,
  }
}

export async function updateTodo(
  id: string,
  changes: Partial<Pick<Todo, 'completed' | 'note' | 'dueDate' | 'text'>>
): Promise<void> {
  const dbChanges: Record<string, unknown> = {}
  if (changes.completed !== undefined) dbChanges.completed = changes.completed
  if (changes.note      !== undefined) dbChanges.note      = changes.note
  if (changes.text      !== undefined) dbChanges.text      = changes.text
  if ('dueDate' in changes)            dbChanges.due_date  = changes.dueDate

  const { error } = await supabase.from('todos').update(dbChanges).eq('id', id)
  if (error) console.error('updateTodo:', error.message)
}

export async function deleteTodo(id: string): Promise<void> {
  const { error } = await supabase.from('todos').delete().eq('id', id)
  if (error) console.error('deleteTodo:', error.message)
}

export async function deleteCompletedTodos(userId: string): Promise<void> {
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('user_id', userId)
    .eq('completed', true)
  if (error) console.error('deleteCompleted:', error.message)
}
