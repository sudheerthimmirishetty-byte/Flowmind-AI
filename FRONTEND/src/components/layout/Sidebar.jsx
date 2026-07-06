import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, UserPlus, GitBranch, FileText,
  Activity, MessageSquare, Settings, LogOut, ChevronLeft, ChevronRight, X
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { cn, getInitials } from '../../utils/helpers'

const HR_NAV = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
  { icon: Users, label: 'Employees', to: '/employees' },
  { icon: UserPlus, label: 'Register Employee', to: '/register-employee' },
  { icon: GitBranch, label: 'Workflow', to: '/workflow' },
  { icon: FileText, label: 'Documents', to: '/documents' },
  { icon: Activity, label: 'Status Tracker', to: '/status-tracker' },
]

const SHARED_NAV = [
  { icon: MessageSquare, label: 'Chatbot', to: '/chatbot' },
  { icon: Settings, label: 'Settings', to: '/settings' },
]

const EMP_NAV = [
  { icon: LayoutDashboard, label: 'My Dashboard', to: '/employee-dashboard' },
  { icon: FileText, label: 'Documents', to: '/documents' },
  { icon: Activity, label: 'My Status', to: '/status-tracker' },
]

export default function Sidebar({ collapsed, onCollapse, mobileOpen, onMobileClose }) {
  const { user, logout, isHR } = useAuth()
  const navigate = useNavigate()

  const navItems = isHR ? [...HR_NAV, ...SHARED_NAV] : [...EMP_NAV, ...SHARED_NAV]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={cn('flex items-center px-4 h-16 border-b border-slate-100 flex-shrink-0', collapsed && !isMobile && 'justify-center px-2')}>
        {(!collapsed || isMobile) && (
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 text-sm truncate">OnboardIQ</p>
              <p className="text-[10px] text-slate-400 capitalize">{user?.role} Portal</p>
            </div>
          </div>
        )}
        {collapsed && !isMobile && (
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
        )}
        {isMobile && (
          <button onClick={onMobileClose} className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            onClick={isMobile ? onMobileClose : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-xl transition-all duration-150 group relative',
                collapsed && !isMobile ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className="flex-shrink-0" />
                {(!collapsed || isMobile) && (
                  <span className="text-sm font-medium truncate">{label}</span>
                )}
                {/* Tooltip for collapsed state */}
                {collapsed && !isMobile && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                    {label}
                    <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Card & Logout */}
      <div className={cn('flex-shrink-0 border-t border-slate-100 p-3', collapsed && !isMobile && 'px-2')}>
        {(!collapsed || isMobile) && (
          <div className="flex items-center gap-2.5 px-2 py-2 mb-2 rounded-xl bg-slate-50">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {getInitials(user?.name || 'U')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.department}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-2.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors px-3 py-2 w-full',
            collapsed && !isMobile && 'justify-center px-2.5'
          )}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {(!collapsed || isMobile) && 'Logout'}
        </button>

        {/* Collapse toggle (desktop) */}
        {!isMobile && (
          <button
            onClick={onCollapse}
            className="mt-1 flex items-center gap-2 text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5 w-full rounded-lg hover:bg-slate-100 transition-colors"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            {!collapsed && <span>Collapse</span>}
          </button>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col fixed top-0 left-0 h-full bg-white border-r border-slate-100 z-30 sidebar-transition',
          collapsed ? 'w-[72px]' : 'w-60'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-slate-900/40 z-40"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="lg:hidden fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-100 z-50"
            >
              <SidebarContent isMobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
