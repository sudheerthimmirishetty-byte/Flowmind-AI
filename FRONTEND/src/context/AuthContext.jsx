import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore user from storage on page refresh
    const stored = localStorage.getItem('onboarding_user') || sessionStorage.getItem('onboarding_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch { localStorage.removeItem('onboarding_user') }
    }
    setLoading(false)
  }, [])

  const login = async (email, password, remember = false) => {
    try {
      const response = await authAPI.login(email, password)
      const { token, user: userData } = response.data.data

      const userObj = {
        ...userData,
        token,
        name: userData.full_name,
        // Normalize role: backend uses 'hr'/'employee', keep as-is
      }

      setUser(userObj)
      const storage = remember ? localStorage : sessionStorage
      storage.setItem('onboarding_user', JSON.stringify(userObj))
      return userObj
    } catch (error) {
      const msg = error?.response?.data?.message || 'Invalid email or password'
      throw new Error(msg)
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch {
      // ignore logout errors
    }
    setUser(null)
    localStorage.removeItem('onboarding_user')
    sessionStorage.removeItem('onboarding_user')
  }

  const updateUser = (updates) => {
    const updated = { ...user, ...updates }
    setUser(updated)
    const inLocal = !!localStorage.getItem('onboarding_user')
    const storage = inLocal ? localStorage : sessionStorage
    storage.setItem('onboarding_user', JSON.stringify(updated))
  }

  const isAuthenticated = !!user
  const isHR = user?.role === 'hr'
  const isEmployee = user?.role === 'employee'

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isAuthenticated, isHR, isEmployee, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
