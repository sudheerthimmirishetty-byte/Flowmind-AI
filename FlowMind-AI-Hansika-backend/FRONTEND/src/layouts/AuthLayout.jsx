import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PageLoader } from '../components/ui/Loader'

export default function AuthLayout() {
  const { isAuthenticated, isHR, loading } = useAuth()

  if (loading) return <PageLoader />
  if (isAuthenticated) {
    return <Navigate to={isHR ? '/dashboard' : '/employee-dashboard'} replace />
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Outlet />
    </div>
  )
}
