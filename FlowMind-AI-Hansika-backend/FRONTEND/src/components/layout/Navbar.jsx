import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Bell, ChevronDown, LogOut, User, Settings,
  Menu, X, CheckCircle, Clock, AlertCircle
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getInitials, timeAgo } from '../../utils/helpers'

const mockNotifications = [
  { id: 1, type: 'success', text: 'Alex Mitchell completed document upload', time: new Date(Date.now() - 5 * 60000).toISOString(), read: false },
  { id: 2, type: 'warning', text: 'Priya Patel pending HR verification for 3 days', time: new Date(Date.now() - 2 * 3600000).toISOString(), read: false },
  { id: 3, type: 'info', text: 'Manager approval required for 5 employees', time: new Date(Date.now() - 5 * 3600000).toISOString(), read: true },
  { id: 4, type: 'success', text: 'Rahul Gupta onboarding completed', time: new Date(Date.now() - 24 * 3600000).toISOString(), read: true },
]

const notifIcons = {
  success: <CheckCircle size={14} className="text-emerald-500" />,
  warning: <AlertCircle size={14} className="text-amber-500" />,
  info: <Clock size={14} className="text-blue-500" />,
}

export default function Navbar({ onMenuClick, sidebarOpen }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showProfile, setShowProfile] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [notifications, setNotifications] = useState(mockNotifications)
  const [searchQuery, setSearchQuery] = useState('')
  const profileRef = useRef(null)
  const notifRef = useRef(null)

  const unreadCount = notifications.filter(n => !n.read).length

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))

  return (
    <header className="fixed top-0 right-0 left-0 z-40 bg-white border-b border-slate-100 h-16 flex items-center px-4 gap-4"
      style={{ paddingLeft: '1rem' }}>
      {/* Hamburger (mobile) */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500 flex-shrink-0"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
        <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">AI</span>
        </div>
        <span className="font-bold text-slate-900 hidden sm:block text-sm">OnboardIQ</span>
      </Link>

      {/* Search */}
      <div className="flex-1 max-w-sm hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-200 focus-within:border-blue-400 transition-all">
        <Search size={16} className="text-slate-400 flex-shrink-0" />
        <input
          className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
          placeholder="Search employees, docs…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setShowNotif(v => !v); setShowProfile(false) }}
            className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotif && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900">Notifications</p>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {notifications.map(n => (
                    <div key={n.id}
                      className={`flex gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer ${!n.read ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className="mt-0.5 flex-shrink-0">{notifIcons[n.type]}</div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs leading-snug ${n.read ? 'text-slate-500' : 'text-slate-800 font-medium'}`}>{n.text}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(n.time)}</p>
                      </div>
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />}
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-slate-100">
                  <button className="text-xs text-blue-600 hover:text-blue-700 font-medium w-full text-center">
                    View all notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => { setShowProfile(v => !v); setShowNotif(false) }}
            className="flex items-center gap-2 p-1.5 pr-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {getInitials(user?.name || 'U')}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-900 leading-tight">{user?.name?.split(' ')[0]}</p>
              <p className="text-[10px] text-slate-500 capitalize">{user?.role}</p>
            </div>
            <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden"
              >
                {/* User info */}
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                {/* Links */}
                <div className="p-1.5">
                  {[
                    { icon: User, label: 'Profile', to: '/profile' },
                    { icon: Settings, label: 'Settings', to: '/settings' },
                  ].map(({ icon: Icon, label, to }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setShowProfile(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 text-sm text-slate-700 transition-colors"
                    >
                      <Icon size={15} className="text-slate-500" />
                      {label}
                    </Link>
                  ))}
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-red-50 text-sm text-red-500 w-full transition-colors"
                  >
                    <LogOut size={15} />
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
