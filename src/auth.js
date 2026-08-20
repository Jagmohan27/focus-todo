import { supabase } from './supabase'

const LOCAL_STORAGE_KEY = 'focus-todos-local-v1'

function getLocalTodos() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

function saveLocalTodos(todos) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(todos))
  } catch {}
}

export async function fetchTodos(userId) {
  try {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      return data.map((r) => ({
        id: r.id,
        text: r.text,
        completed: r.completed,
        note: r.note ?? '',
        dueDate: r.due_date ?? null,
        createdAt: r.created_at,
      }))
    }
  } catch {}

  // Fallback to localStorage
  return getLocalTodos()
}

export async function insertTodo(userId, todo) {
  const newTodo = {
    id: crypto.randomUUID(),
    text: todo.text,
    completed: todo.completed,
    note: todo.note,
    dueDate: todo.dueDate,
    createdAt: new Date().toISOString(),
  }

  // Try Supabase first
  try {
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

    if (!error && data) {
      newTodo.id = data.id
      newTodo.createdAt = data.created_at
    }
  } catch {}

  // Save to local storage as well
  const current = getLocalTodos()
  saveLocalTodos([newTodo, ...current])

  return newTodo
}

export async function updateTodo(id, changes) {
  try {
    const dbChanges = {}
    if (changes.completed !== undefined) dbChanges.completed = changes.completed
    if (changes.note !== undefined) dbChanges.note = changes.note
    if (changes.text !== undefined) dbChanges.text = changes.text
    if ('dueDate' in changes) dbChanges.due_date = changes.dueDate

    await supabase.from('todos').update(dbChanges).eq('id', id)
  } catch {}

  // Local storage update
  const current = getLocalTodos()
  const updated = current.map((t) => (t.id === id ? { ...t, ...changes } : t))
  saveLocalTodos(updated)
}

export async function deleteTodo(id) {
  try {
    await supabase.from('todos').delete().eq('id', id)
  } catch {}

  const current = getLocalTodos()
  saveLocalTodos(current.filter((t) => t.id !== id))
}

export async function deleteCompletedTodos(userId) {
  try {
    await supabase.from('todos').delete().eq('user_id', userId).eq('completed', true)
  } catch {}

  const current = getLocalTodos()
  saveLocalTodos(current.filter((t) => !t.completed))
}

export async function register() {
  return { ok: true, user: { id: 'guest-user-123', name: 'User' } }
}

export async function login() {
  return { ok: true, user: { id: 'guest-user-123', name: 'User' } }
}

export async function logout() {}

export async function getCurrentUser() {
  return { id: 'guest-user-123', name: 'User', email: 'local@device', initials: 'TU' }
}
