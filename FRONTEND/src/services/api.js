import axios from 'axios'

// Base API configuration - backend is at /api/v1
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
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
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.put('/auth/change-password', data),
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
  getStats: () => api.get('/employees/stats'),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  updateStatus: (id, status) => api.patch(`/employees/${id}/status`, { employee_status: status }),
  delete: (id) => api.delete(`/employees/${id}`),
}

// ─── Documents ───────────────────────────────────────────────────────────────
export const documentsAPI = {
  getByWorkflow: (workflowId) => api.get(`/documents/workflow/${workflowId}`),
  upload: (formData) =>
    api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (docId) => api.delete(`/documents/${docId}`),
  regenerate: (id) => api.post(`/documents/${id}/regenerate`),
  download: (id) => api.get(`/documents/${id}/download`),
}

// ─── Workflows ───────────────────────────────────────────────────────────────
export const workflowAPI = {
  getAll: () => api.get('/workflows'),
  getById: (id) => api.get(`/workflows/${id}`),
  create: (data) => api.post('/workflows', data),
  update: (id, data) => api.put(`/workflows/${id}`, data),
  delete: (id) => api.delete(`/workflows/${id}`),
  getStatus: (id) => api.get(`/workflows/${id}/status`),
  getProgress: (id) => api.get(`/workflows/${id}/progress`),
  getHistory: (id) => api.get(`/workflows/${id}/history`),
  getTimeline: (id) => api.get(`/workflows/${id}/timeline`),
  getSummary: (id) => api.get(`/workflows/${id}/summary`),
  retryAutomation: (id) => api.post(`/workflows/${id}/retry-automation`),
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const tasksAPI = {
  getByWorkflow: (workflowId) => api.get(`/tasks/workflow/${workflowId}`),
  getByDepartment: (deptId) => api.get(`/tasks/department/${deptId}`),
  getPending: () => api.get('/tasks/pending'),
  getCompleted: () => api.get('/tasks/completed'),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  complete: (id) => api.patch(`/tasks/${id}/complete`),
  delete: (id) => api.delete(`/tasks/${id}`),
}

// ─── Companies ───────────────────────────────────────────────────────────────
export const companiesAPI = {
  getAll: (params) => api.get('/companies', { params }),
  getList: () => api.get('/companies/list'),
  getById: (id) => api.get(`/companies/${id}`),
  create: (data) => api.post('/companies', data),
  update: (id, data) => api.put(`/companies/${id}`, data),
  delete: (id) => api.delete(`/companies/${id}`),
}

// ─── Departments ─────────────────────────────────────────────────────────────
export const departmentsAPI = {
  getAll: (params) => api.get('/departments', { params }),
  getByCompany: (companyId) => api.get(`/departments/company/${companyId}`),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
}

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
}

// ─── Onboarding ──────────────────────────────────────────────────────────────
export const onboardingAPI = {
  getDetails: (employeeId) => api.get(`/onboarding/${employeeId}`),
  update: (employeeId, data) => api.put(`/onboarding/${employeeId}`, data),
}

// ─── AI / Chat ────────────────────────────────────────────────────────────────
export const aiAPI = {
  processCommand: (command) => api.post('/ai/process', { command }),
  chat: (message, context) => api.post('/ai/chat', { message, context }),
  parseCommand: (command) => api.post('/ai/parse', { command }),
  getAgents: () => api.get('/ai/agents'),
  getAgent: (id) => api.get(`/ai/agents/${id}`),
  updateAgentStatus: (id, status) => api.put(`/ai/agents/${id}/status`, { status }),
}

export default api
