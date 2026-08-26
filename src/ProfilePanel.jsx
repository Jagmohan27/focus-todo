import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Check, Download, Upload } from 'lucide-react'
import { useState, useRef } from 'react'

const SPRING = { type: 'spring', stiffness: 380, damping: 28 }

function avatarColor(id) {
  const palette = [
    '#0071E3', '#34AADC', '#5E5CE6', '#30D158',
    '#FF9500', '#FF375F', '#BF5AF2', '#00C7BE',
  ]
  return palette[(id || '').charCodeAt(0) % palette.length]
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      title="Copy to clipboard"
      className="flex items-center justify-center w-6 h-6 rounded-lg transition-colors hover:bg-[#0071E3]/10 focus:outline-none"
      style={{ color: copied ? '#30D158' : 'rgba(0,0,0,0.30)' }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={SPRING}>
            <Check size={13} strokeWidth={2.5} />
          </motion.span>
        ) : (
          <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={SPRING}>
            <Copy size={13} strokeWidth={1.8} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}

export default function ProfilePanel({ user, taskCount, completedCount, open, onClose }) {
  const color = avatarColor(user?.id)
  const fileInputRef = useRef(null)
  const [importStatus, setImportStatus] = useState('')

  const handleExport = () => {
    try {
      const raw = localStorage.getItem('focus-todos-local-v1') || '[]'
      const blob = new Blob([raw], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `focus-tasks-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result)
        if (Array.isArray(parsed)) {
          localStorage.setItem('focus-todos-local-v1', JSON.stringify(parsed))
          setImportStatus('Restored!')
          setTimeout(() => {
            window.location.reload()
          }, 600)
        } else {
          setImportStatus('Invalid JSON')
        }
      } catch {
        setImportStatus('File error')
      }
    }
    reader.readAsText(file)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px]"
          />

          <motion.div
            key="panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={SPRING}
            className="fixed top-0 right-0 bottom-0 z-50 w-80 bg-white/90 backdrop-blur-xl border-l border-gray-200/60 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <span className="text-[15px] font-semibold tracking-tight text-[#1D1D1F]">Tasks Overview</span>
              <button
                id="close-profile"
                onClick={onClose}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors focus:outline-none"
                style={{ color: 'rgba(0,0,0,0.40)' }}
              >
                <X size={15} strokeWidth={2} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              <div className="flex flex-col items-center gap-3 py-2">
                <motion.div
                  whileHover={{ scale: 1.06 }}
                  transition={SPRING}
                  className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md select-none"
                  style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }}
                >
                  ✓
                </motion.div>
                <div className="text-center">
                  <p className="text-[18px] font-bold tracking-tight text-[#1D1D1F]">Task Workspace</p>
                  <p className="text-[13px] text-[#1D1D1F]/45 tracking-tight">Saved locally on your device</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: 'Total Tasks', value: taskCount },
                  { label: 'Completed', value: completedCount },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl px-4 py-3 text-center"
                    style={{ background: 'rgba(0,113,227,0.05)' }}
                  >
                    <p className="text-[22px] font-bold tracking-tighter text-[#0071E3]">{s.value}</p>
                    <p className="text-[11px] text-[#1D1D1F]/40 tracking-tight mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
                <div className="px-4 py-3">
                  <p className="text-[11px] font-semibold tracking-widest uppercase text-[#1D1D1F]/35 mb-1">
                    Storage Mode
                  </p>
                  <p className="text-[12.5px] tracking-tight text-[#1D1D1F]/70">
                    Local Device Storage
                  </p>
                </div>
              </div>

              {/* Data Backup & Restore */}
              <div className="space-y-2 pt-2">
                <p className="text-[11px] font-semibold tracking-widest uppercase text-[#1D1D1F]/35 px-1">
                  Backup & Restore
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleExport}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-gray-200/80 bg-white text-[12.5px] font-medium text-[#1D1D1F] hover:bg-gray-50 transition-colors focus:outline-none"
                  >
                    <Download size={13} className="text-[#0071E3]" />
                    Export JSON
                  </button>
                  <button
                    onClick={handleImportClick}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-gray-200/80 bg-white text-[12.5px] font-medium text-[#1D1D1F] hover:bg-gray-50 transition-colors focus:outline-none"
                  >
                    <Upload size={13} className="text-[#0071E3]" />
                    {importStatus || 'Import JSON'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
