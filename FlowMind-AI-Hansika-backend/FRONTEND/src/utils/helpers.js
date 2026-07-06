// ─── Class Utilities ──────────────────────────────────────────────────────────

/** Merge Tailwind class names, filtering falsy values */
export const cn = (...classes) => classes.filter(Boolean).join(' ')

// ─── Date Utilities ───────────────────────────────────────────────────────────

export const formatDate = (date, options = {}) => {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d)) return '—'
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', ...options,
  })
}

export const formatDateTime = (date) => {
  if (!date) return '—'
  const d = new Date(date)
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export const timeAgo = (date) => {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(date)
}

// ─── Validation ───────────────────────────────────────────────────────────────

export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export const isValidPhone = (phone) =>
  /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''))

export const isValidPAN = (pan) =>
  /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase())

// ─── String Utilities ─────────────────────────────────────────────────────────

export const getInitials = (name = '') => {
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export const truncate = (str, max = 40) =>
  str && str.length > max ? str.slice(0, max) + '…' : str

export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : ''

// ─── File Utilities ───────────────────────────────────────────────────────────

export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export const getFileExtension = (filename) =>
  filename ? filename.split('.').pop().toUpperCase() : ''

export const isImageFile = (filename) =>
  /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename)

// ─── Number Utilities ─────────────────────────────────────────────────────────

export const formatNumber = (n) =>
  new Intl.NumberFormat('en-IN').format(n)

export const percentage = (part, total) =>
  total === 0 ? 0 : Math.round((part / total) * 100)

// ─── Status Utilities ─────────────────────────────────────────────────────────

export const getStatusColor = (status) => {
  const map = {
    completed: 'success',
    approved: 'success',
    active: 'success',
    pending: 'warning',
    processing: 'warning',
    'in-progress': 'warning',
    rejected: 'danger',
    failed: 'danger',
    inactive: 'danger',
    draft: 'muted',
  }
  return map[status?.toLowerCase()] || 'muted'
}

// ─── Mock Data Generators ─────────────────────────────────────────────────────

export const DEPARTMENTS = [
  'Engineering', 'Human Resources', 'Finance', 'Marketing',
  'Operations', 'Sales', 'Legal', 'Product', 'Design', 'Support',
]

export const ROLES = {
  Engineering: ['Software Engineer', 'Senior Engineer', 'Tech Lead', 'DevOps Engineer'],
  'Human Resources': ['HR Executive', 'HR Manager', 'Talent Acquisition'],
  Finance: ['Accountant', 'Finance Manager', 'Analyst'],
  Marketing: ['Marketing Executive', 'Content Writer', 'SEO Specialist'],
}

export const ONBOARDING_STATUSES = ['Pending', 'In Progress', 'Completed', 'Rejected']

export const EMPLOYMENT_TYPES = ['Full-Time', 'Part-Time', 'Contract', 'Internship']

export const generateMockEmployees = (count = 20) =>
  Array.from({ length: count }, (_, i) => ({
    id: `EMP${String(i + 1).padStart(3, '0')}`,
    name: ['Arjun Sharma', 'Priya Patel', 'Rahul Gupta', 'Sneha Singh', 'Vikram Nair',
      'Divya Rao', 'Amit Kumar', 'Neha Verma', 'Suresh Reddy', 'Ananya Das',
      'Rohan Mehta', 'Kavita Joshi', 'Deepak Malhotra', 'Pooja Iyer', 'Harsh Agarwal',
      'Meera Pillai', 'Sanjay Tiwari', 'Ritu Saxena', 'Kiran Nambiar', 'Aditya Bhatt'][i % 20],
    email: `emp${i + 1}@company.com`,
    department: DEPARTMENTS[i % DEPARTMENTS.length],
    role: 'Software Engineer',
    joiningDate: new Date(2024, i % 12, (i % 28) + 1).toISOString(),
    status: ONBOARDING_STATUSES[i % 4],
    progress: [20, 40, 60, 80, 100][i % 5],
    phone: `98${String(i).padStart(8, '0')}`,
    manager: 'Sarah Johnson',
  }))
