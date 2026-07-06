import axios from 'axios'

// Base API configuration
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — attach auth token
api.interceptors.request.use(
  (config) => {
    const userStr = localStorage.getItem('onboarding_user') || sessionStorage.getItem('onboarding_user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        if (user.token) config.headers.Authorization = `Bearer ${user.token}`
      } catch {}
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('onboarding_user')
      sessionStorage.removeItem('onboarding_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentActivities: () => api.get('/dashboard/activities'),
  getGrowthData: () => api.get('/dashboard/growth'),
  getDepartmentData: () => api.get('/dashboard/departments'),
  getWorkflowData: () => api.get('/dashboard/workflow-stats'),
  getAISuggestions: () => api.get('/dashboard/ai-suggestions'),
}

// ─── Employees ───────────────────────────────────────────────────────────────
export const employeesAPI = {
  getAll: (params) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  search: (query) => api.get('/employees/search', { params: { q: query } }),
}

// ─── Documents ───────────────────────────────────────────────────────────────
export const documentsAPI = {
  getByEmployee: (employeeId) => api.get(`/documents/${employeeId}`),
  upload: (employeeId, formData) =>
    api.post(`/documents/upload/${employeeId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => Math.round((e.loaded * 100) / e.total),
    }),
  delete: (docId) => api.delete(`/documents/${docId}`),
  preview: (docId) => api.get(`/documents/${docId}/preview`),
}

// ─── Workflow ─────────────────────────────────────────────────────────────────
export const workflowAPI = {
  getByEmployee: (employeeId) => api.get(`/workflow/${employeeId}`),
  updateStep: (employeeId, stepId, data) =>
    api.put(`/workflow/${employeeId}/step/${stepId}`, data),
  getAll: () => api.get('/workflow'),
}

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
}

// ─── Profile ─────────────────────────────────────────────────────────────────
export const profileAPI = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
  uploadAvatar: (formData) =>
    api.post('/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  changePassword: (data) => api.put('/profile/password', data),
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
export const chatAPI = {
  sendMessage: (message, context) => api.post('/chat', { message, context }),
  getHistory: () => api.get('/chat/history'),
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
}

export default api
