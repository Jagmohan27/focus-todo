import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence, motion, Reorder } from 'framer-motion'
import { Check, Trash2, Plus, Command, Sparkles, FileText, ChevronDown, Calendar, X, HelpCircle, Search, ArrowUpDown, Tag } from 'lucide-react'
import {
  fetchTodos, insertTodo, updateTodo, deleteTodo,
  deleteCompletedTodos, logout,
} from './auth'
import ProfilePanel from './ProfilePanel'

const SPRING = { type: 'spring', stiffness: 400, damping: 30 }
const SOFT = { type: 'spring', stiffness: 280, damping: 24 }

const todayStr = () => new Date().toISOString().slice(0, 10)

const formatDate = (d) =>
  d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

const TAG_CONFIG = {
  work: { label: 'Work', bg: 'rgba(0,113,227,0.08)', text: '#0071E3' },
  personal: { label: 'Personal', bg: 'rgba(175,82,222,0.08)', text: '#AF52DE' },
  idea: { label: 'Idea', bg: 'rgba(255,149,0,0.08)', text: '#FF9500' },
  urgent: { label: 'Urgent', bg: 'rgba(255,59,48,0.08)', text: '#FF3B30' },
}

function dueDateLabel(iso) {
  const t = todayStr()
  if (iso === t) return 'Today'
  const diff = (new Date(iso).getTime() - new Date(t).getTime()) / 86_400_000
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff < 0) return `${Math.abs(Math.round(diff))}d overdue`
  if (diff < 7) return new Date(iso).toLocaleDateString('en-US', { weekday: 'long' })
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function duePriority(iso, completed) {
  if (!iso || completed) return null
  const t = todayStr()
  if (iso < t) return 'overdue'
  if (iso === t) return 'today'
  const diff = (new Date(iso).getTime() - new Date(t).getTime()) / 86_400_000
  return diff <= 3 ? 'soon' : 'future'
}

const PRI = {
  overdue: { bg: 'rgba(255,59,48,0.08)', text: '#FF3B30', dot: '#FF3B30' },
  today: { bg: 'rgba(255,149,0,0.09)', text: '#FF9500', dot: '#FF9500' },
  soon: { bg: 'rgba(0,113,227,0.08)', text: '#0071E3', dot: '#0071E3' },
  future: { bg: 'rgba(0,0,0,0.04)', text: 'rgba(29,29,31,0.45)', dot: 'rgba(29,29,31,0.30)' },
}

function ShortcutsModal({ open, onClose }) {
  const shortcuts = [
    { key: 'Space', desc: 'Focus task input field' },
    { key: '↵ Enter', desc: 'Add new task' },
    { key: 'Esc', desc: 'Cancel input or close panel' },
    { key: '?', desc: 'Toggle keyboard shortcuts' },
  ]

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="sc-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px]"
          />
          <motion.div
            key="sc-modal"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={SPRING}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Command size={16} className="text-[#0071E3]" />
                <h3 className="text-[16px] font-bold tracking-tight text-[#1D1D1F]">Keyboard Shortcuts</h3>
              </div>
              <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
                <X size={15} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-2.5">
              {shortcuts.map((s) => (
                <div key={s.key} className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-gray-50/80">
                  <span className="text-[13px] text-[#1D1D1F]/70 tracking-tight">{s.desc}</span>
                  <kbd className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-[12px] font-mono text-[#1D1D1F] shadow-2xs">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function DueBadge({ dueDate, completed, onClear, showClear }) {
  const p = duePriority(dueDate, completed)
  const s = p ? PRI[p] : PRI.future
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium tracking-tight select-none" style={{ backgroundColor: s.bg, color: s.text }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.dot }} />
      {dueDateLabel(dueDate)}
      <AnimatePresence>
        {showClear && (
          <motion.button key="c" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} transition={SPRING} onClick={(e) => { e.stopPropagation(); onClear() }} aria-label="Remove due date" className="ml-0.5 rounded-full hover:opacity-70 transition-opacity">
            <X size={10} strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </span>
  )
}

function Checkbox({ checked, onChange, id }) {
  return (
    <button id={`cb-${id}`} aria-label={checked ? 'Mark incomplete' : 'Mark complete'} onClick={onChange} className="relative flex-shrink-0 w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] focus-visible:ring-offset-2" style={{ borderColor: checked ? '#0071E3' : 'rgba(0,0,0,0.22)', backgroundColor: checked ? '#0071E3' : 'transparent' }}>
      <AnimatePresence>
        {checked && (
          <motion.span key="chk" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={SPRING}>
            <Check size={12} strokeWidth={3} className="text-white" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}

function DateShortcuts({ value, onChange }) {
  const t = todayStr()
  const opts = [
    { label: 'Today', date: t },
    { label: 'Tomorrow', date: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10) },
    { label: 'Next week', date: new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10) },
  ]
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {opts.map((o) => (
        <button key={o.label} type="button" onClick={() => onChange(value === o.date ? '' : o.date)} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] tracking-tight font-medium transition-all duration-150 focus:outline-none border" style={{ backgroundColor: value === o.date ? '#0071E3' : 'transparent', color: value === o.date ? 'white' : 'rgba(29,29,31,0.50)', borderColor: value === o.date ? '#0071E3' : 'rgba(0,0,0,0.10)' }}>
          {o.label}
        </button>
      ))}
      <label className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] tracking-tight font-medium cursor-pointer border relative" style={{ backgroundColor: value && !opts.find((o) => o.date === value) ? '#0071E3' : 'transparent', color: value && !opts.find((o) => o.date === value) ? 'white' : 'rgba(29,29,31,0.50)', borderColor: value && !opts.find((o) => o.date === value) ? '#0071E3' : 'rgba(0,0,0,0.10)' }}>
        <Calendar size={11} strokeWidth={2} />
        {value && !opts.find((o) => o.date === value)
          ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : 'Pick date'}
        <input type="date" aria-label="Custom due date" value={value} min={t} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" style={{ colorScheme: 'light' }} />
      </label>
      {value && (
        <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={SPRING} type="button" onClick={() => onChange('')} className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-red-50 hover:text-red-400 text-[#1D1D1F]/30 focus:outline-none">
          <X size={12} strokeWidth={2.5} />
        </motion.button>
      )}
    </div>
  )
}

function TodoItem({ todo, onToggle, onDelete, onNoteChange, onDueDateChange }) {
  const [hovered, setHovered] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const noteRef = useRef(null)
  const dateRef = useRef(null)
  const hasNote = todo.note.trim().length > 0

  useEffect(() => { if (noteOpen) noteRef.current?.focus() }, [noteOpen])

  const autoGrow = () => {
    const el = noteRef.current; if (!el) return
    el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'
  }

  return (
    <Reorder.Item value={todo} id={todo.id} as="li" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -16, scale: 0.97 }} transition={SOFT} whileDrag={{ scale: 1.02, boxShadow: '0 8px 28px rgba(0,0,0,0.10)', zIndex: 50 }} layout onHoverStart={() => setHovered(true)} onHoverEnd={() => setHovered(false)} className="bg-white/85 backdrop-blur-sm border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden select-none" style={{ listStyle: 'none', cursor: 'grab' }}>
      <div className="flex items-start gap-3.5 px-4 py-3.5">
        <div className="mt-0.5"><Checkbox id={todo.id} checked={todo.completed} onChange={() => onToggle(todo.id)} /></div>

        <div className="flex-1 min-w-0">
          <p className="text-[15px] leading-snug tracking-tight transition-all duration-300" style={{ color: todo.completed ? 'rgba(29,29,31,0.32)' : '#1D1D1F', textDecoration: todo.completed ? 'line-through' : 'none', textDecorationColor: 'rgba(0,0,0,0.22)' }}>
            {todo.text}
          </p>
          <div className="flex items-center flex-wrap gap-1.5 mt-1">
            {todo.tag && TAG_CONFIG[todo.tag] && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium tracking-tight" style={{ backgroundColor: TAG_CONFIG[todo.tag].bg, color: TAG_CONFIG[todo.tag].text }}>
                {TAG_CONFIG[todo.tag].label}
              </span>
            )}
            {todo.dueDate && <DueBadge dueDate={todo.dueDate} completed={todo.completed} showClear={hovered} onClear={() => onDueDateChange(todo.id, null)} />}
            {hasNote && !noteOpen && <span className="text-[11.5px] text-[#1D1D1F]/35 leading-snug tracking-tight truncate max-w-[160px]">{todo.note}</span>}
          </div>
        </div>

        <div className="flex items-center gap-1 mt-0.5">
          <AnimatePresence>
            {(hovered || todo.dueDate) && (
              <motion.button key="date-btn" id={`date-${todo.id}`} aria-label="Set due date" initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.75 }} transition={SPRING} onClick={() => dateRef.current?.showPicker?.()} className="relative flex items-center justify-center w-7 h-7 rounded-full transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3]" style={{ backgroundColor: todo.dueDate ? 'rgba(0,113,227,0.08)' : 'transparent', color: todo.dueDate ? '#0071E3' : 'rgba(0,0,0,0.28)' }}>
                <Calendar size={13} strokeWidth={1.9} />
                <input ref={dateRef} type="date" aria-label="Due date" value={todo.dueDate ?? ''} min={todayStr()} onChange={(e) => onDueDateChange(todo.id, e.target.value || null)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" style={{ colorScheme: 'light' }} />
              </motion.button>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {(hovered || hasNote) && (
              <motion.button key="note-btn" id={`note-${todo.id}`} aria-label={noteOpen ? 'Close note' : 'Add or edit note'} initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.75 }} transition={SPRING} onClick={() => setNoteOpen((o) => !o)} className="flex items-center justify-center w-7 h-7 rounded-full transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3]" style={{ backgroundColor: noteOpen ? 'rgba(0,113,227,0.10)' : hasNote ? 'rgba(0,113,227,0.06)' : 'transparent', color: noteOpen || hasNote ? '#0071E3' : 'rgba(0,0,0,0.28)' }}>
                <FileText size={13} strokeWidth={1.9} />
              </motion.button>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {hovered && (
              <motion.button key="del" id={`del-${todo.id}`} aria-label="Delete task" initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.75 }} transition={SPRING} onClick={() => onDelete(todo.id)} className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
                <Trash2 size={13} strokeWidth={1.8} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {noteOpen && (
          <motion.div key="note-panel" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ ...SOFT, opacity: { duration: 0.15 } }} className="overflow-hidden">
            <div className="px-4 pb-3 pt-0">
              <div className="h-px bg-gray-100 mb-2.5" />
              <div className="flex items-start gap-2">
                <FileText size={12} strokeWidth={1.8} className="mt-2.5 flex-shrink-0 text-[#0071E3]/50" />
                <textarea ref={noteRef} id={`note-input-${todo.id}`} value={todo.note} onChange={(e) => { onNoteChange(todo.id, e.target.value); autoGrow() }} onKeyDown={(e) => { if (e.key === 'Escape') setNoteOpen(false) }} placeholder="Add a note…" rows={2} className="flex-1 resize-none bg-transparent border-none outline-none text-[13.5px] tracking-tight text-[#1D1D1F]/75 placeholder:text-[#1D1D1F]/25 leading-relaxed caret-[#0071E3] mt-1.5" />
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-[11px] text-[#1D1D1F]/25 tracking-tight">Saved to device · Esc to close</span>
                <button onClick={() => setNoteOpen(false)} className="flex items-center gap-1 text-[11px] text-[#1D1D1F]/35 hover:text-[#0071E3] transition-colors tracking-tight focus:outline-none">
                  <ChevronDown size={11} /> Done
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  )
}

function FilterPill({ label, active, onClick, id }) {
  return (
    <button id={id} onClick={onClick} className="relative px-3.5 py-1 rounded-full text-[13px] tracking-tight font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3]" style={{ color: active ? '#0071E3' : 'rgba(29,29,31,0.42)' }}>
      {active && <motion.span layoutId="filter-pill" className="absolute inset-0 rounded-full bg-blue-50" transition={SPRING} />}
      <span className="relative z-10">{label}</span>
    </button>
  )
}

function EmptyState({ filter, isSearch }) {
  const msgs = {
    all: isSearch ? 'No tasks match your search query.' : 'Your canvas is blank. Add your first task above.',
    active: 'Nothing left to do. Enjoy the moment.',
    completed: 'No completed tasks yet.',
  }
  return (
    <motion.div key="empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={SOFT} className="flex flex-col items-center justify-center py-14">
      <p className="text-[14px] text-[#1D1D1F]/35 tracking-tight">{msgs[filter]}</p>
    </motion.div>
  )
}

function SlashTooltip({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div key="slash" initial={{ opacity: 0, y: 6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.96 }} transition={SPRING} className="absolute left-0 -bottom-11 z-50 flex items-center gap-2 px-3 py-1.5 bg-[#1D1D1F]/90 backdrop-blur-md rounded-xl text-white text-xs tracking-tight shadow-xl">
          <Command size={11} />
          <span>Press <kbd className="font-semibold">Enter</kbd> to add task</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#0071E3] animate-pulse" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function avatarColor(id) {
  const p = ['#0071E3', '#34AADC', '#5E5CE6', '#30D158', '#FF9500', '#FF375F', '#BF5AF2', '#00C7BE']
  return p[(id || '').charCodeAt(0) % p.length]
}

export default function App({ user, onLogout }) {
  const [todos, setTodos] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [input, setInput] = useState('')
  const [dueInput, setDueInput] = useState('')
  const [selectedTag, setSelectedTag] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('date-desc')
  const [filter, setFilter] = useState('all')
  const [showSlash, setShowSlash] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    fetchTodos(user.id).then((data) => {
      setTodos(data)
      setLoadingData(false)
    })
  }, [user.id])

  const filtered = todos.filter((t) => {
    const matchesFilter = filter === 'active' ? !t.completed : filter === 'completed' ? t.completed : true
    const matchesSearch = searchQuery.trim() === '' ||
      t.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.note && t.note.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesFilter && matchesSearch
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'due-date') {
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return a.dueDate.localeCompare(b.dueDate)
    }
    if (sortBy === 'alpha') {
      return a.text.localeCompare(b.text)
    }
    if (sortBy === 'date-asc') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const activeCount = todos.filter((t) => !t.completed).length
  const completedCount = todos.filter((t) => t.completed).length
  const overdueCount = todos.filter((t) => !t.completed && t.dueDate && t.dueDate < todayStr()).length

  useEffect(() => {
    if (activeCount > 0) {
      document.title = `Focus (${activeCount}) · Tasks`
    } else {
      document.title = 'Focus · Tasks'
    }
  }, [activeCount])

  const handleAdd = useCallback(async () => {
    const text = input.trim(); if (!text) return
    const temp = { id: crypto.randomUUID(), text, completed: false, note: '', tag: selectedTag, dueDate: dueInput || null, createdAt: new Date().toISOString() }
    setTodos((p) => [temp, ...p])
    setInput(''); setDueInput(''); setSelectedTag(null); setShowSlash(false)
    const saved = await insertTodo(user.id, { text, completed: false, note: '', tag: selectedTag, dueDate: dueInput || null })
    if (saved) setTodos((p) => p.map((t) => (t.id === temp.id ? saved : t)))
  }, [input, dueInput, selectedTag, user.id])

  const handleToggle = useCallback(async (id) => {
    const todo = todos.find((t) => t.id === id); if (!todo) return
    const newVal = !todo.completed
    setTodos((p) => p.map((t) => (t.id === id ? { ...t, completed: newVal } : t)))
    await updateTodo(id, { completed: newVal })
  }, [todos])

  const handleDelete = useCallback(async (id) => {
    setTodos((p) => p.filter((t) => t.id !== id))
    await deleteTodo(id)
  }, [])

  const handleNoteChange = useCallback(async (id, note) => {
    setTodos((p) => p.map((t) => (t.id === id ? { ...t, note } : t)))
    await updateTodo(id, { note })
  }, [])

  const handleDueDateChange = useCallback(async (id, dueDate) => {
    setTodos((p) => p.map((t) => (t.id === id ? { ...t, dueDate } : t)))
    await updateTodo(id, { dueDate })
  }, [])

  const handleClearCompleted = useCallback(async () => {
    setTodos((p) => p.filter((t) => !t.completed))
    await deleteCompletedTodos(user.id)
  }, [user.id])

  const handleLogout = async () => { await logout(); onLogout() }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd()
    if (e.key === 'Escape') { setInput(''); setDueInput(''); setSelectedTag(null); setShowSlash(false); inputRef.current?.blur() }
  }

  useEffect(() => {
    const h = (e) => {
      if (e.key === ' ' && document.activeElement === document.body) { e.preventDefault(); inputRef.current?.focus() }
      if (e.key === '?' && document.activeElement === document.body) { e.preventDefault(); setShortcutsOpen((o) => !o) }
    }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [])

  const color = avatarColor(user.id)

  return (
    <div className="min-h-screen bg-[#F5F5F7] antialiased">
      <motion.header initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SOFT, delay: 0.05 }} className="sticky top-0 z-40 w-full border-b border-gray-200/50 bg-white/70 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <motion.div whileHover={{ rotate: 20, scale: 1.15 }} transition={SPRING} className="w-7 h-7 rounded-lg bg-[#0071E3] flex items-center justify-center shadow-sm">
              <Sparkles size={14} className="text-white" strokeWidth={2} />
            </motion.div>
            <span className="text-[15px] font-semibold tracking-tight text-[#1D1D1F]">Focus</span>
          </div>
          <div className="flex items-center gap-2.5">
            <AnimatePresence>
              {overdueCount > 0 && (
                <motion.span key="ov" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={SPRING} className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium tracking-tight" style={{ backgroundColor: 'rgba(255,59,48,0.08)', color: '#FF3B30' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30]" />
                  {overdueCount} overdue
                </motion.span>
              )}
            </AnimatePresence>
            <span className="text-[13px] text-[#1D1D1F]/40 tracking-tight hidden sm:block">
              {activeCount > 0 ? `${activeCount} remaining` : completedCount > 0 ? '✓ All done' : ''}
            </span>
            <button onClick={() => setShortcutsOpen(true)} title="Keyboard shortcuts (?)" className="w-8 h-8 rounded-full flex items-center justify-center text-[#1D1D1F]/40 hover:text-[#0071E3] hover:bg-blue-50 transition-colors focus:outline-none">
              <HelpCircle size={17} strokeWidth={1.8} />
            </button>
            <motion.button id="profile-btn" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }} transition={SPRING} onClick={() => setProfileOpen(true)} aria-label="Open profile" className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] focus-visible:ring-offset-2" style={{ background: `linear-gradient(135deg,${color},${color}aa)` }}>
              {user.initials}
            </motion.button>
          </div>
        </div>
      </motion.header>

      <main className="max-w-2xl mx-auto px-6 pt-12 pb-28">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SOFT, delay: 0.10 }} className="mb-8">
          <p className="text-[12px] font-medium text-[#0071E3] tracking-widest uppercase mb-1.5">{formatDate(new Date())}</p>
          <h1 className="text-[34px] font-bold tracking-tighter leading-none text-[#1D1D1F]">
            My Tasks
          </h1>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SOFT, delay: 0.16 }} className="mb-7">
          <p className="text-[11px] font-semibold text-[#1D1D1F]/35 tracking-widest uppercase mb-2 ml-1">Add Task</p>
          <motion.div animate={{ boxShadow: inputFocused ? '0 0 0 3px rgba(0,113,227,0.15),0 2px 12px rgba(0,0,0,0.06)' : '0 1px 4px rgba(0,0,0,0.06)', borderColor: inputFocused ? 'rgba(0,113,227,0.45)' : 'rgba(0,0,0,0.10)' }} transition={{ duration: 0.18 }} className="relative bg-white rounded-2xl border p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-dashed flex items-center justify-center transition-colors duration-150" style={{ borderColor: inputFocused ? '#0071E3' : 'rgba(0,0,0,0.20)' }}>
                <Plus size={12} strokeWidth={2.5} style={{ color: inputFocused ? '#0071E3' : 'rgba(0,0,0,0.30)' }} />
              </div>
              <input ref={inputRef} id="task-input" type="text" value={input} onChange={(e) => { setInput(e.target.value); setShowSlash(e.target.value.startsWith('/')) }} onKeyDown={handleKeyDown} onFocus={() => setInputFocused(true)} onBlur={() => setInputFocused(false)} placeholder="What do you need to get done?" aria-label="New task input" autoComplete="off" className="flex-1 bg-transparent border-none outline-none text-[16px] tracking-tight text-[#1D1D1F] placeholder:text-[#1D1D1F]/28 caret-[#0071E3]" />
              <AnimatePresence>
                {input.length > 0 && (
                  <motion.span initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={SPRING} className="hidden sm:flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-400 text-[11px] font-mono border border-gray-200/70 select-none">
                    ↵
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Tag selector pills */}
            <div className="mb-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Tag size={11} strokeWidth={2} className="text-[#1D1D1F]/35" />
                <span className="text-[11px] font-semibold text-[#1D1D1F]/35 tracking-widest uppercase">Tag</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {Object.entries(TAG_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedTag(selectedTag === key ? null : key)}
                    className="px-2.5 py-0.5 rounded-full text-[11.5px] font-medium tracking-tight transition-all border"
                    style={{
                      backgroundColor: selectedTag === key ? cfg.text : 'transparent',
                      color: selectedTag === key ? 'white' : cfg.text,
                      borderColor: selectedTag === key ? cfg.text : `${cfg.text}40`,
                    }}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-1">
              <div className="flex items-center gap-1.5 mb-2">
                <Calendar size={11} strokeWidth={2} className="text-[#1D1D1F]/35" />
                <span className="text-[11px] font-semibold text-[#1D1D1F]/35 tracking-widest uppercase">Due date</span>
              </div>
              <DateShortcuts value={dueInput} onChange={setDueInput} />
            </div>

            <motion.div animate={{ opacity: inputFocused ? 1 : 0, height: inputFocused ? 'auto' : 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <span className="text-[12px] text-[#1D1D1F]/30 tracking-tight">
                  <kbd className="font-semibold text-[#1D1D1F]/50">Enter</kbd> to add ·{' '}
                  <kbd className="font-semibold text-[#1D1D1F]/50">Esc</kbd> to cancel
                </span>
                <motion.button id="add-task-btn" whileTap={{ scale: 0.93 }} transition={SPRING} onClick={handleAdd} disabled={input.trim().length === 0} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[13px] font-medium tracking-tight transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3]" style={{ backgroundColor: input.trim() ? '#0071E3' : 'rgba(0,0,0,0.06)', color: input.trim() ? 'white' : 'rgba(0,0,0,0.28)', cursor: input.trim() ? 'pointer' : 'default' }}>
                  <Plus size={13} strokeWidth={2.5} /> Add Task
                </motion.button>
              </div>
            </motion.div>
            <SlashTooltip visible={showSlash} />
          </motion.div>
        </motion.div>

        {/* Filter pills, Sort selector & Search input */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }} className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-0.5" role="group" aria-label="Filter tasks">
            {['all', 'active', 'completed'].map((f) => (
              <FilterPill key={f} id={`filter-${f}`} label={f.charAt(0).toUpperCase() + f.slice(1)} active={filter === f} onClick={() => setFilter(f)} />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <ArrowUpDown size={13} className="absolute left-2.5 text-[#1D1D1F]/35 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-8 pr-3 py-1 rounded-full text-[12.5px] bg-white border border-gray-200/80 outline-none text-[#1D1D1F]/70 hover:text-[#1D1D1F] cursor-pointer appearance-none transition-all"
              >
                <option value="date-desc">Newest first</option>
                <option value="date-asc">Oldest first</option>
                <option value="due-date">Due date</option>
                <option value="alpha">Alphabetical</option>
              </select>
            </div>

            <div className="relative flex items-center">
              <Search size={13} className="absolute left-2.5 text-[#1D1D1F]/35" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks…"
                className="pl-8 pr-7 py-1 rounded-full text-[12.5px] bg-white border border-gray-200/80 outline-none text-[#1D1D1F] placeholder:text-[#1D1D1F]/30 focus:border-[#0071E3] transition-all w-32 sm:w-40"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 text-[#1D1D1F]/30 hover:text-[#1D1D1F]/70">
                  <X size={12} />
                </button>
              )}
            </div>

            <AnimatePresence>
              {completedCount > 0 && (
                <motion.button id="clear-btn" key="clear" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={SPRING} onClick={handleClearCompleted} className="text-[13px] text-[#1D1D1F]/32 hover:text-red-400 tracking-tight transition-colors duration-150 focus:outline-none whitespace-nowrap">
                  Clear done
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SOFT, delay: 0.26 }}>
          {loadingData ? (
            <div className="flex justify-center py-14">
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }} className="w-6 h-6 rounded-full border-2 border-[#0071E3]/20 border-t-[#0071E3]" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {sorted.length === 0 ? (
                <EmptyState key="empty" filter={filter} isSearch={searchQuery.trim().length > 0} />
              ) : (
                <Reorder.Group axis="y" values={sorted} onReorder={(newOrder) => {
                  setTodos((prev) => {
                    const others = prev.filter((t) => !sorted.find((f) => f.id === t.id))
                    return [...newOrder, ...others]
                  })
                }} as="ul" className="flex flex-col gap-2.5 p-0 m-0" style={{ listStyle: 'none' }}>
                  <AnimatePresence>
                    {sorted.map((todo) => (
                      <TodoItem key={todo.id} todo={todo} onToggle={handleToggle} onDelete={handleDelete} onNoteChange={handleNoteChange} onDueDateChange={handleDueDateChange} />
                    ))}
                  </AnimatePresence>
                </Reorder.Group>
              )}
            </AnimatePresence>
          )}
        </motion.div>

        {todos.length > 0 && !loadingData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="mt-10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[12px] text-[#1D1D1F]/35 tracking-tight">Progress</span>
              <span className="text-[12px] font-medium text-[#1D1D1F]/45 tracking-tight">{completedCount}/{todos.length} completed</span>
            </div>
            <div className="h-1 w-full bg-gray-200/70 rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-[#0071E3] to-[#34AADC]" initial={{ width: 0 }} animate={{ width: `${todos.length > 0 ? (completedCount / todos.length) * 100 : 0}%` }} transition={SOFT} />
            </div>
          </motion.div>
        )}
      </main>

      <motion.button id="fab-add" aria-label="Add new task" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...SPRING, delay: 0.4 }} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }} onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => inputRef.current?.focus(), 300) }} className="fixed bottom-6 right-6 z-50 rounded-full bg-[#0071E3] text-white shadow-lg flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] focus-visible:ring-offset-2" style={{ width: 52, height: 52 }}>
        <Plus size={22} strokeWidth={2.2} />
      </motion.button>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/60 backdrop-blur-md border border-gray-200/50 shadow-sm pointer-events-none">
        <span className="text-[11px] text-[#1D1D1F]/30 tracking-tight whitespace-nowrap"><kbd className="font-mono">Space</kbd> focus</span>
        <span className="w-px h-3 bg-gray-300/70" />
        <span className="text-[11px] text-[#1D1D1F]/30 tracking-tight whitespace-nowrap"><kbd className="font-mono">?</kbd> shortcuts</span>
        <span className="w-px h-3 bg-gray-300/70" />
        <span className="text-[11px] text-[#1D1D1F]/30 tracking-tight whitespace-nowrap">💾 saved locally</span>
      </motion.div>

      <ProfilePanel user={user} taskCount={todos.length} completedCount={completedCount} open={profileOpen} onClose={() => setProfileOpen(false)} onLogout={handleLogout} />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  )
}
