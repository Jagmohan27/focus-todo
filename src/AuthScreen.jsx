import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Sparkles, ArrowRight, User, Mail, Lock, AlertCircle } from 'lucide-react'
import { register, login } from './auth'

const SPRING = { type: 'spring', stiffness: 380, damping: 28 }
const SOFT = { type: 'spring', stiffness: 260, damping: 24 }

function Field({ id, label, type, value, onChange, placeholder, icon: Icon, autoComplete }) {
  const [focused, setFocused] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const isPw = type === 'password'

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[12px] font-semibold tracking-widest uppercase" style={{ color: 'rgba(29,29,31,0.45)' }}>
        {label}
      </label>

      <motion.div
        animate={{
          boxShadow: focused ? '0 0 0 3px rgba(0,113,227,0.18),0 1px 6px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.06)',
          borderColor: focused ? 'rgba(0,113,227,0.50)' : 'rgba(0,0,0,0.10)',
        }}
        transition={{ duration: 0.15 }}
        className="flex items-center gap-2.5 px-3.5 py-3 bg-white rounded-xl border"
      >
        <Icon size={15} strokeWidth={1.8} style={{ color: focused ? '#0071E3' : 'rgba(0,0,0,0.28)', flexShrink: 0 }} />
        <input
          id={id}
          type={isPw && showPw ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="flex-1 bg-transparent border-none outline-none text-[15px] tracking-tight text-[#1D1D1F] placeholder:text-[#1D1D1F]/25 caret-[#0071E3]"
        />
        {isPw && (
          <button type="button" onClick={() => setShowPw((s) => !s)} className="focus:outline-none" tabIndex={-1}>
            {showPw ? (
              <EyeOff size={14} strokeWidth={1.8} style={{ color: 'rgba(0,0,0,0.28)' }} />
            ) : (
              <Eye size={14} strokeWidth={1.8} style={{ color: 'rgba(0,0,0,0.28)' }} />
            )}
          </button>
        )}
      </motion.div>
    </div>
  )
}

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const toggle = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'))
    setError('')
    setName('')
    setEmail('')
    setPassword('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = mode === 'register'
      ? await register(name, email, password)
      : await login(email, password)

    setLoading(false)
    if (!result.ok) setError(result.error)
    else onAuth(result.user)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 antialiased" style={{ background: '#F5F5F7' }}>
      <div className="w-full max-w-sm">

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SOFT, delay: 0.05 }} className="flex flex-col items-center mb-10">
          <motion.div whileHover={{ rotate: 15, scale: 1.1 }} transition={SPRING} className="w-14 h-14 rounded-2xl bg-[#0071E3] flex items-center justify-center shadow-lg mb-4">
            <Sparkles size={26} className="text-white" strokeWidth={1.8} />
          </motion.div>
          <h1 className="text-[28px] font-bold tracking-tighter text-[#1D1D1F]">Focus</h1>
          <p className="text-[14px] text-[#1D1D1F]/40 tracking-tight mt-1">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SOFT, delay: 0.12 }} className="bg-white rounded-3xl border border-gray-200/60 shadow-sm p-7">

          <div className="flex items-center bg-gray-100/80 rounded-xl p-1 mb-7">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                type="button"
                id={`tab-${m}`}
                onClick={() => m !== mode && toggle()}
                className="relative flex-1 py-1.5 rounded-lg text-[13px] font-medium tracking-tight transition-colors duration-150 focus:outline-none"
                style={{ color: mode === m ? '#1D1D1F' : 'rgba(29,29,31,0.40)' }}
              >
                {mode === m && (
                  <motion.span layoutId="auth-tab" className="absolute inset-0 rounded-lg bg-white shadow-sm" transition={SPRING} />
                )}
                <span className="relative z-10">{m === 'login' ? 'Sign In' : 'Register'}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <AnimatePresence initial={false}>
              {mode === 'register' && (
                <motion.div key="name-field" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ ...SOFT, opacity: { duration: 0.15 } }} className="overflow-hidden">
                  <Field id="auth-name" label="Full Name" type="text" value={name} onChange={setName} placeholder="John Doe" icon={User} autoComplete="name" />
                </motion.div>
              )}
            </AnimatePresence>

            <Field id="auth-email" label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon={Mail} autoComplete="email" />

            <Field id="auth-password" label="Password" type="password" value={password} onChange={setPassword} placeholder={mode === 'register' ? 'Min. 6 characters' : '••••••••'} icon={Lock} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} />

            <AnimatePresence>
              {error && (
                <motion.div key="err" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={SPRING} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] tracking-tight" style={{ backgroundColor: 'rgba(255,59,48,0.07)', color: '#FF3B30' }}>
                  <AlertCircle size={14} strokeWidth={2} className="flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button id="auth-submit-btn" type="submit" whileTap={{ scale: 0.97 }} transition={SPRING} disabled={loading} className="mt-1 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[15px] font-semibold tracking-tight text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] focus-visible:ring-offset-2" style={{ background: loading ? 'rgba(0,113,227,0.55)' : 'linear-gradient(135deg,#0071E3,#34AADC)', cursor: loading ? 'wait' : 'pointer' }}>
              {loading ? (
                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>{mode === 'login' ? 'Sign In' : 'Create Account'}<ArrowRight size={16} strokeWidth={2.2} /></>
              )}
            </motion.button>
          </form>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="text-center text-[11.5px] text-[#1D1D1F]/28 tracking-tight mt-5 px-4">
          Your data is saved to the cloud. Works on any device, any browser.
        </motion.p>
      </div>
    </div>
  )
}
