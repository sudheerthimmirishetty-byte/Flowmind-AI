import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { isValidEmail } from '../utils/helpers'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', remember: false })
  const [errors, setErrors] = useState({})
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email is required'
    else if (!isValidEmail(form.email)) e.email = 'Enter a valid email address'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setAuthError('')
    if (!validate()) return
    setLoading(true)
    try {
      const user = await login(form.email, form.password, form.remember)
      navigate(user.role === 'hr' ? '/dashboard' : '/employee-dashboard', { replace: true })
    } catch (err) {
      setAuthError(err.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fill = (email, password) => setForm(f => ({ ...f, email, password }))

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <motion.div
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="hidden lg:flex flex-col w-[55%] gradient-primary relative overflow-hidden"
      >
        {/* Background circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute top-1/3 -right-20 w-72 h-72 bg-white/5 rounded-full" />
          <div className="absolute -bottom-20 left-1/4 w-80 h-80 bg-white/5 rounded-full" />
        </div>

        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">AI</span>
            </div>
            <span className="text-white font-bold text-xl">OnboardIQ</span>
          </div>

          {/* Illustration */}
          <div className="flex flex-col items-center text-center">
            <svg viewBox="0 0 400 300" className="w-80 mb-8 drop-shadow-2xl" fill="none">
              {/* Background circles */}
              <circle cx="200" cy="150" r="120" fill="rgba(255,255,255,0.06)" />
              <circle cx="200" cy="150" r="80" fill="rgba(255,255,255,0.06)" />
              {/* Workflow nodes */}
              <circle cx="120" cy="100" r="28" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="2"/>
              <circle cx="200" cy="60" r="28" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="2"/>
              <circle cx="280" cy="100" r="28" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="2"/>
              <circle cx="280" cy="200" r="28" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="2"/>
              <circle cx="200" cy="240" r="28" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="2"/>
              <circle cx="120" cy="200" r="28" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="2"/>
              {/* Connecting lines */}
              <line x1="148" y1="100" x2="172" y2="72" stroke="rgba(255,255,255,0.4)" strokeWidth="2"/>
              <line x1="228" y1="72" x2="252" y2="100" stroke="rgba(255,255,255,0.4)" strokeWidth="2"/>
              <line x1="280" y1="128" x2="280" y2="172" stroke="rgba(255,255,255,0.4)" strokeWidth="2"/>
              <line x1="252" y1="214" x2="228" y2="228" stroke="rgba(255,255,255,0.4)" strokeWidth="2"/>
              <line x1="172" y1="228" x2="148" y2="214" stroke="rgba(255,255,255,0.4)" strokeWidth="2"/>
              <line x1="120" y1="172" x2="120" y2="128" stroke="rgba(255,255,255,0.4)" strokeWidth="2"/>
              {/* Center icon */}
              <circle cx="200" cy="150" r="32" fill="rgba(255,255,255,0.25)" stroke="white" strokeWidth="2.5"/>
              <text x="200" y="156" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">AI</text>
              {/* Check marks */}
              <circle cx="120" cy="100" r="10" fill="#10B981"/>
              <text x="120" y="104" textAnchor="middle" fill="white" fontSize="10">✓</text>
              <circle cx="200" cy="60" r="10" fill="#10B981"/>
              <text x="200" y="64" textAnchor="middle" fill="white" fontSize="10">✓</text>
            </svg>

            <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
              AI-Powered Employee<br />Onboarding
            </h1>
            <p className="text-blue-100 text-lg max-w-sm leading-relaxed">
              Streamline your workforce integration with intelligent automation and real-time tracking.
            </p>

            <div className="mt-8 space-y-3 w-full max-w-xs text-left">
              {[
                'Smart Document Verification',
                'Automated Workflow Management',
                'Real-time Progress Tracking',
              ].map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={14} className="text-white" />
                  </div>
                  <span className="text-blue-50 text-sm font-medium">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-blue-200 text-sm text-center">© 2026 OnboardIQ. All rights reserved.</p>
        </div>
      </motion.div>

      {/* Right Panel */}
      <motion.div
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="flex-1 flex items-center justify-center p-6 bg-white"
      >
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">AI</span>
            </div>
            <span className="font-bold text-slate-900 text-xl">OnboardIQ</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-1">Welcome Back</h2>
            <p className="text-slate-500">Sign in to your account to continue</p>
          </div>

          {/* Demo credentials */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-blue-700 mb-2">Demo Credentials</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">HR Admin:</span>
                <button type="button" onClick={() => fill('hr@company.com','hr1234')} className="text-xs text-blue-600 hover:underline font-medium">hr@company.com / hr1234</button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Employee:</span>
                <button type="button" onClick={() => fill('employee@company.com','emp1234')} className="text-xs text-blue-600 hover:underline font-medium">employee@company.com / emp1234</button>
              </div>
            </div>
          </div>

          {/* Auth error */}
          {authError && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm">
              <AlertCircle size={16} className="flex-shrink-0" />
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Email Address <span className="text-red-500">*</span></label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(v => ({ ...v, email: '' })) }}
                  className={`w-full rounded-lg border pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all ${errors.email ? 'border-red-400 focus:ring-2 focus:ring-red-100' : 'border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500'}`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setErrors(v => ({ ...v, password: '' })) }}
                  className={`w-full rounded-lg border pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all ${errors.password ? 'border-red-400 focus:ring-2 focus:ring-red-100' : 'border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500'}`}
                />
                <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.remember} onChange={e => setForm(f => ({ ...f, remember: e.target.checked }))} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-slate-600">Remember me</span>
              </label>
              <Link to="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Forgot password?</Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-primary text-white font-semibold py-3 rounded-xl hover:opacity-90 active:opacity-80 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            © 2026 OnboardIQ Inc. · <Link to="#" className="hover:underline">Privacy</Link> · <Link to="#" className="hover:underline">Terms</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
