import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PageLoader } from './ui/Loader'

export default function ProtectedRoute({ requiredRole }) {
  const { isAuthenticated, isHR, isEmployee, loading, user } = useAuth()

  if (loading) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (requiredRole === 'hr' && !isHR) {
    return <Navigate to="/employee-dashboard" replace />
  }
  if (requiredRole === 'employee' && !isEmployee) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
