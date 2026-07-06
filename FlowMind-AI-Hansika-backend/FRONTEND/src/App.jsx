import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import AuthLayout from './layouts/AuthLayout'
import DashboardLayout from './layouts/DashboardLayout'
import Login from './pages/Login'
import HRDashboard from './pages/HRDashboard'
import EmployeeDashboard from './pages/EmployeeDashboard'
import EmployeeRegistration from './pages/EmployeeRegistration'
import DocumentUpload from './pages/DocumentUpload'
import Workflow from './pages/Workflow'
import StatusTracker from './pages/StatusTracker'
import EmployeeList from './pages/EmployeeList'
import Chatbot from './pages/Chatbot'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import './index.css'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Public auth routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
            </Route>

            {/* HR-only routes */}
            <Route element={<ProtectedRoute requiredRole="hr" />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<HRDashboard />} />
                <Route path="/employees" element={<EmployeeList />} />
                <Route path="/register-employee" element={<EmployeeRegistration />} />
                <Route path="/workflow" element={<Workflow />} />
                <Route path="/status-tracker" element={<StatusTracker />} />
              </Route>
            </Route>

            {/* Employee-only routes */}
            <Route element={<ProtectedRoute requiredRole="employee" />}>
              <Route element={<DashboardLayout />}>
                <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
                <Route path="/documents" element={<DocumentUpload />} />
              </Route>
            </Route>

            {/* Shared protected routes (any authenticated user) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/chatbot" element={<Chatbot />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>

            {/* Default redirects */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
