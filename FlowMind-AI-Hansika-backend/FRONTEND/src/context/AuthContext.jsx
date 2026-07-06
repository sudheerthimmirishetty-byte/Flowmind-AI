import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

// Mock users for demo purposes
const MOCK_USERS = {
  'hr@company.com': { password: 'hr123', role: 'hr', name: 'Sarah Johnson', avatar: null, id: 'HR001', department: 'Human Resources' },
  'employee@company.com': { password: 'emp123', role: 'employee', name: 'Alex Mitchell', avatar: null, id: 'EMP042', department: 'Engineering' },
  'admin@company.com': { password: 'admin123', role: 'hr', name: 'Admin User', avatar: null, id: 'ADM001', department: 'Administration' },
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('onboarding_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch { localStorage.removeItem('onboarding_user') }
    }
    setLoading(false)
  }, [])

  const login = async (email, password, remember = false) => {
    // Simulate API call delay
    await new Promise(r => setTimeout(r, 1000))

    const mockUser = MOCK_USERS[email.toLowerCase()]
    if (!mockUser || mockUser.password !== password) {
      throw new Error('Invalid email or password')
    }

    const userData = {
      email,
      name: mockUser.name,
      role: mockUser.role,
      id: mockUser.id,
      department: mockUser.department,
      avatar: null,
      token: `mock_token_${Date.now()}`,
    }

    setUser(userData)
    if (remember) localStorage.setItem('onboarding_user', JSON.stringify(userData))
    else sessionStorage.setItem('onboarding_user', JSON.stringify(userData))
    return userData
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('onboarding_user')
    sessionStorage.removeItem('onboarding_user')
  }

  const isAuthenticated = !!user
  const isHR = user?.role === 'hr'
  const isEmployee = user?.role === 'employee'

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isHR, isEmployee, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
