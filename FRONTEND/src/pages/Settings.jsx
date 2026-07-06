import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Palette,
  Bell,
  Globe,
  Lock,
  User,
  Sun,
  Moon,
  PanelLeft,
  PanelLeftClose,
  Check,
  Monitor,
  Smartphone,
  LogOut,
  ChevronRight,
  Save,
  Shield,
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import Button from '../components/ui/Button'
import { cn } from '../utils/helpers'

// ── Section definitions ───────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'appearance',    label: 'Appearance',         icon: Palette },
  { id: 'notifications', label: 'Notifications',      icon: Bell    },
  { id: 'region',        label: 'Language & Region',  icon: Globe   },
  { id: 'privacy',       label: 'Privacy & Security', icon: Lock    },
  { id: 'profile',       label: 'Profile Settings',   icon: User    },
]

const ACCENT_COLORS = [
  { name: 'Blue',   value: '#2563EB', bg: 'bg-blue-600'    },
  { name: 'Purple', value: '#7C3AED', bg: 'bg-violet-600'  },
  { name: 'Teal',   value: '#0D9488', bg: 'bg-teal-600'    },
  { name: 'Rose',   value: '#E11D48', bg: 'bg-rose-600'    },
  { name: 'Amber',  value: '#D97706', bg: 'bg-amber-600'   },
]

// ── Toast notification ────────────────────────────────────────────────────────
function Toast({ show, message }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.95 }}
          animate={{ opacity: 1, y: 0,  scale: 1    }}
          exit={{   opacity: 0, y: 16, scale: 0.95  }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium"
        >
          <div className="w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center flex-shrink-0">
            <Check size={12} />
          </div>
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Toggle switch ─────────────────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange, disabled = false }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        checked   ? 'bg-blue-600' : 'bg-slate-200',
        disabled  && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300',
          checked && 'translate-x-5'
        )}
      />
    </button>
  )
}

// ── Section card wrapper ──────────────────────────────────────────────────────
function SectionCard({ id, title, icon: Icon, children }) {
  return (
    <div id={id} className="bg-white rounded-xl border border-slate-100 card-shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
          <Icon size={16} className="text-blue-600" />
        </div>
        <h2 className="text-sm font-bold text-slate-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {title}
        </h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

// ── Notification row ──────────────────────────────────────────────────────────
function NotifRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-slate-50 last:border-0">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  )
}

// ── Session row ───────────────────────────────────────────────────────────────
function SessionRow({ icon: Icon, device, location, time, isCurrent, onTerminate }) {
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-slate-50 last:border-0">
      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
        <Icon size={18} className="text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-800">{device}</p>
          {isCurrent && (
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
              Current
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-0.5">{location} · {time}</p>
      </div>
      {!isCurrent && (
        <button
          onClick={onTerminate}
          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 font-medium transition-colors px-2 py-1 hover:bg-red-50 rounded-lg"
        >
          <LogOut size={13} />
          Terminate
        </button>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Settings() {
  const { isDark, toggleTheme } = useTheme()

  const [sidebarStyle, setSidebarStyle] = useState('expanded')
  const [accentColor,  setAccentColor]  = useState('#2563EB')

  const [notifications, setNotifications] = useState({
    email:     true,
    sms:       false,
    onboarding: true,
    documents:  true,
    system:     true,
  })

  const [language,    setLanguage]    = useState('en')
  const [dateFormat,  setDateFormat]  = useState('DD/MM/YYYY')
  const [timezone,    setTimezone]    = useState('Asia/Kolkata')

  const [profileVisible, setProfileVisible] = useState(true)
  const [showOnline,     setShowOnline]     = useState(true)
  const [sessions, setSessions] = useState([
    { id: 1, icon: Monitor,    device: 'Chrome on Windows 11', location: 'Bengaluru, India', time: 'Active now', isCurrent: true  },
    { id: 2, icon: Smartphone, device: 'iOS Safari — iPhone 14', location: 'Mumbai, India',   time: '3 hours ago', isCurrent: false },
  ])

  // Toast
  const [toast, setToast] = useState({ show: false, msg: '' })
  const toastTimer = useRef(null)

  const showToast = (msg = 'Settings saved successfully') => {
    clearTimeout(toastTimer.current)
    setToast({ show: true, msg })
    toastTimer.current = setTimeout(() => setToast({ show: false, msg: '' }), 3000)
  }

  const terminateSession = (id) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
    showToast('Session terminated')
  }

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <motion.div
      className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      {/* Toast */}
      <Toast show={toast.show} message={toast.msg} />

      <div className="max-w-6xl mx-auto">

        {/* Page heading */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Settings
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage your app preferences and account configuration</p>
        </motion.div>

        <div className="flex gap-6 items-start">

          {/* ── Left nav ────────────────────────────────────────────────── */}
          <motion.aside
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="hidden lg:block w-56 flex-shrink-0 sticky top-6"
          >
            <div className="bg-white rounded-xl border border-slate-100 card-shadow p-2 space-y-0.5">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-150 group text-left"
                >
                  <s.icon size={15} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                  <span className="font-medium flex-1">{s.label}</span>
                  <ChevronRight size={13} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
                </button>
              ))}
            </div>
          </motion.aside>

          {/* ── Main content ─────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex-1 space-y-6 min-w-0"
          >

            {/* ═══ APPEARANCE ═══════════════════════════════════════════ */}
            <SectionCard id="appearance" title="Appearance" icon={Palette}>
              {/* Theme toggle */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Theme</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'light', label: 'Light Mode', icon: Sun,  desc: 'Clean, bright interface'  },
                    { id: 'dark',  label: 'Dark Mode',  icon: Moon, desc: 'Easy on the eyes at night' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={toggleTheme}
                      className={cn(
                        'flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all duration-200',
                        (isDark ? opt.id === 'dark' : opt.id === 'light')
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <opt.icon size={18} className={
                          (isDark ? opt.id === 'dark' : opt.id === 'light')
                            ? 'text-blue-600'
                            : 'text-slate-400'
                        } />
                        {(isDark ? opt.id === 'dark' : opt.id === 'light') && (
                          <span className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                            <Check size={10} className="text-white" />
                          </span>
                        )}
                      </div>
                      <div className="text-left">
                        <p className={cn('text-sm font-semibold', (isDark ? opt.id === 'dark' : opt.id === 'light') ? 'text-blue-700' : 'text-slate-700')}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100 my-4" />

              {/* Sidebar style */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Sidebar Style</p>
                <div className="flex gap-3">
                  {[
                    { id: 'expanded', label: 'Expanded', icon: PanelLeft     },
                    { id: 'compact',  label: 'Compact',  icon: PanelLeftClose },
                  ].map((opt) => (
                    <label key={opt.id} className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="sidebar"
                        className="sr-only"
                        checked={sidebarStyle === opt.id}
                        onChange={() => setSidebarStyle(opt.id)}
                      />
                      <div className={cn(
                        'flex items-center gap-2.5 p-3.5 rounded-xl border-2 transition-all duration-200',
                        sidebarStyle === opt.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                      )}>
                        <opt.icon size={16} />
                        <span className="text-sm font-medium">{opt.label}</span>
                        {sidebarStyle === opt.id && (
                          <span className="ml-auto w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                            <Check size={10} className="text-white" />
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100 my-4" />

              {/* Accent colors */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Accent Color</p>
                <div className="flex gap-3">
                  {ACCENT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setAccentColor(c.value)}
                      title={c.name}
                      className={cn(
                        'w-9 h-9 rounded-full transition-all duration-200 flex items-center justify-center',
                        c.bg,
                        accentColor === c.value ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-110'
                      )}
                    >
                      {accentColor === c.value && <Check size={14} className="text-white" />}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Selected: {ACCENT_COLORS.find((c) => c.value === accentColor)?.name}
                </p>
              </div>

              <div className="mt-5 flex justify-end">
                <Button variant="primary" size="sm" icon={Save} onClick={() => showToast()}>
                  Save Appearance
                </Button>
              </div>
            </SectionCard>

            {/* ═══ NOTIFICATIONS ════════════════════════════════════════ */}
            <SectionCard id="notifications" title="Notifications" icon={Bell}>
              <NotifRow
                label="Email Notifications"
                description="Receive updates and alerts to your registered email"
                checked={notifications.email}
                onChange={(v) => setNotifications((n) => ({ ...n, email: v }))}
              />
              <NotifRow
                label="SMS Notifications"
                description="Get important alerts via SMS on your mobile number"
                checked={notifications.sms}
                onChange={(v) => setNotifications((n) => ({ ...n, sms: v }))}
              />
              <NotifRow
                label="Onboarding Updates"
                description="Track progress and stage changes in your onboarding workflow"
                checked={notifications.onboarding}
                onChange={(v) => setNotifications((n) => ({ ...n, onboarding: v }))}
              />
              <NotifRow
                label="Document Reminders"
                description="Reminders for pending document uploads and deadlines"
                checked={notifications.documents}
                onChange={(v) => setNotifications((n) => ({ ...n, documents: v }))}
              />
              <NotifRow
                label="System Alerts"
                description="Critical system maintenance and security notifications"
                checked={notifications.system}
                onChange={(v) => setNotifications((n) => ({ ...n, system: v }))}
              />
              <div className="mt-4 flex justify-end">
                <Button variant="primary" size="sm" icon={Save} onClick={() => showToast()}>
                  Save Notifications
                </Button>
              </div>
            </SectionCard>

            {/* ═══ LANGUAGE & REGION ════════════════════════════════════ */}
            <SectionCard id="region" title="Language & Region" icon={Globe}>
              {/* Language */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  <option value="en">🇬🇧 English (Default)</option>
                  <option value="hi">🇮🇳 Hindi — हिन्दी</option>
                  <option value="ta">🇮🇳 Tamil — தமிழ்</option>
                  <option value="te">🇮🇳 Telugu — తెలుగు</option>
                </select>
              </div>

              {/* Date format */}
              <div className="mb-5 border-t border-slate-50 pt-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Date Format</p>
                <div className="flex flex-col gap-2.5">
                  {['DD/MM/YYYY', 'MM/DD/YYYY'].map((fmt) => (
                    <label key={fmt} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="dateformat"
                        checked={dateFormat === fmt}
                        onChange={() => setDateFormat(fmt)}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className={cn('text-sm', dateFormat === fmt ? 'text-blue-700 font-semibold' : 'text-slate-600')}>
                        {fmt}
                        <span className="text-slate-400 font-normal ml-2">
                          ({fmt === 'DD/MM/YYYY' ? '02/07/2026' : '07/02/2026'})
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Timezone */}
              <div className="border-t border-slate-50 pt-5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  <option value="Asia/Kolkata">IST — Asia/Kolkata (UTC+5:30)</option>
                  <option value="UTC">UTC — Coordinated Universal Time</option>
                  <option value="America/New_York">EST — America/New_York (UTC-5)</option>
                  <option value="Europe/London">GMT — Europe/London (UTC+0)</option>
                  <option value="Asia/Singapore">SGT — Asia/Singapore (UTC+8)</option>
                </select>
              </div>

              <div className="mt-5 flex justify-end">
                <Button variant="primary" size="sm" icon={Save} onClick={() => showToast()}>
                  Save Region Settings
                </Button>
              </div>
            </SectionCard>

            {/* ═══ PRIVACY & SECURITY ═══════════════════════════════════ */}
            <SectionCard id="privacy" title="Privacy & Security" icon={Lock}>
              {/* Visibility toggles */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Profile Privacy</p>
                <div className="space-y-0 divide-y divide-slate-50">
                  <div className="flex items-center justify-between py-3.5">
                    <div>
                      <p className="text-sm font-medium text-slate-800">Profile Visibility</p>
                      <p className="text-xs text-slate-500 mt-0.5">Allow other team members to view your profile</p>
                    </div>
                    <ToggleSwitch checked={profileVisible} onChange={setProfileVisible} />
                  </div>
                  <div className="flex items-center justify-between py-3.5">
                    <div>
                      <p className="text-sm font-medium text-slate-800">Show Online Status</p>
                      <p className="text-xs text-slate-500 mt-0.5">Let others see when you are active</p>
                    </div>
                    <ToggleSwitch checked={showOnline} onChange={setShowOnline} />
                  </div>
                </div>
              </div>

              {/* Active sessions */}
              <div className="border-t border-slate-100 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Sessions</p>
                  <span className="text-xs text-slate-400">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</span>
                </div>
                {sessions.map((s) => (
                  <SessionRow
                    key={s.id}
                    icon={s.icon}
                    device={s.device}
                    location={s.location}
                    time={s.time}
                    isCurrent={s.isCurrent}
                    onTerminate={() => terminateSession(s.id)}
                  />
                ))}
                {sessions.length === 1 && (
                  <p className="text-xs text-slate-400 text-center py-2">No other active sessions</p>
                )}
              </div>

              <div className="mt-5 flex justify-end">
                <Button variant="primary" size="sm" icon={Save} onClick={() => showToast()}>
                  Save Privacy Settings
                </Button>
              </div>
            </SectionCard>

            {/* ═══ PROFILE SETTINGS SHORTCUT ════════════════════════════ */}
            <SectionCard id="profile" title="Profile Settings" icon={User}>
              <div className="flex items-center justify-between p-4 bg-gradient-to-br from-blue-50 to-blue-100/40 rounded-xl border border-blue-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow">
                    <User size={22} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Manage Your Profile</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Edit personal info, view documents, and manage security settings
                    </p>
                  </div>
                </div>
                <Link to="/profile">
                  <Button variant="primary" size="sm" iconRight={ChevronRight}>
                    Go to Profile
                  </Button>
                </Link>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Personal Info',  desc: 'Name, email, phone',         icon: User,   to: '/profile' },
                  { label: 'Documents',       desc: 'View upload status',          icon: Shield, to: '/documents' },
                  { label: 'Security',        desc: 'Password & 2FA',             icon: Lock,   to: '/profile' },
                ].map((link) => (
                  <Link
                    key={link.label}
                    to={link.to}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                      <link.icon size={15} className="text-slate-500 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 group-hover:text-blue-700">{link.label}</p>
                      <p className="text-[10px] text-slate-400">{link.desc}</p>
                    </div>
                    <ChevronRight size={13} className="text-slate-300 group-hover:text-blue-400 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </SectionCard>

          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
