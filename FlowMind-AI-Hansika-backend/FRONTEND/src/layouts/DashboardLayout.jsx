import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import { ToastProvider } from '../components/ui/Toast'
import { cn } from '../utils/helpers'

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50">
        <Navbar
          onMenuClick={() => setMobileOpen(v => !v)}
          sidebarOpen={mobileOpen}
        />
        <Sidebar
          collapsed={collapsed}
          onCollapse={() => setCollapsed(v => !v)}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        {/* Main content area */}
        <main
          className={cn(
            'min-h-screen pt-16 transition-all duration-300',
            collapsed ? 'lg:pl-[72px]' : 'lg:pl-60'
          )}
        >
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="p-4 sm:p-6 max-w-screen-2xl mx-auto"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </ToastProvider>
  )
}
