import { supabase } from './supabase'

function adaptUser(sbUser) {
  const name = sbUser.user_metadata?.name ?? sbUser.email ?? 'User'
  const words = name.trim().split(' ')
  const initials = (words[0][0] + (words[1]?.[0] ?? words[0][1] ?? '')).toUpperCase()
  return {
    id: sbUser.id,
    name,
    email: sbUser.email ?? '',
    initials,
    createdAt: sbUser.created_at ?? new Date().toISOString(),
  }
}

function formatAuthError(msg) {
  if (msg.toLowerCase().includes('load failed') || msg.toLowerCase().includes('failed to fetch')) {
    return 'Connection issue. Please refresh the page and try again.'
  }
  return msg
}

export async function register(name, email, password) {
  if (password.length < 6) {
    return { ok: false, error: 'Password must be at least 6 characters.' }
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { name: name.trim() } },
    })

    if (error) return { ok: false, error: formatAuthError(error.message) }
    if (!data.user) return { ok: false, error: 'Registration failed. User object missing.' }

    return { ok: true, user: adaptUser(data.user) }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: formatAuthError(msg) }
  }
}

export async function login(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) return { ok: false, error: formatAuthError(error.message) }
    if (!data.user) return { ok: false, error: 'Login failed. User object missing.' }

    return { ok: true, user: adaptUser(data.user) }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: formatAuthError(msg) }
  }
}

export async function logout() {
  await supabase.auth.signOut()
}

export async function getCurrentUser() {
  try {
    const { data } = await supabase.auth.getSession()
    if (!data.session?.user) return null
    return adaptUser(data.session.user)
  } catch {
    return null
  }
}

export async function fetchTodos(userId) {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('fetchTodos:', error.message)
    return []
  }

  return (data ?? []).map((r) => ({
    id: r.id,
    text: r.text,
    completed: r.completed,
    note: r.note ?? '',
    dueDate: r.due_date ?? null,
    createdAt: r.created_at,
  }))
}

export async function insertTodo(userId, todo) {
  const { data, error } = await supabase
    .from('todos')
    .insert({
      user_id: userId,
      text: todo.text,
      completed: todo.completed,
      note: todo.note,
      due_date: todo.dueDate,
    })
    .select()
    .single()

  if (error) {
    console.error('insertTodo:', error.message)
    return null
  }

  return {
    id: data.id,
    text: data.text,
    completed: data.completed,
    note: data.note ?? '',
    dueDate: data.due_date ?? null,
    createdAt: data.created_at,
  }
}

export async function updateTodo(id, changes) {
  const dbChanges = {}
  if (changes.completed !== undefined) dbChanges.completed = changes.completed
  if (changes.note !== undefined) dbChanges.note = changes.note
  if (changes.text !== undefined) dbChanges.text = changes.text
  if ('dueDate' in changes) dbChanges.due_date = changes.dueDate

  const { error } = await supabase.from('todos').update(dbChanges).eq('id', id)
  if (error) console.error('updateTodo:', error.message)
}

export async function deleteTodo(id) {
  const { error } = await supabase.from('todos').delete().eq('id', id)
  if (error) console.error('deleteTodo:', error.message)
}

export async function deleteCompletedTodos(userId) {
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('user_id', userId)
    .eq('completed', true)
  if (error) console.error('deleteCompleted:', error.message)
}
