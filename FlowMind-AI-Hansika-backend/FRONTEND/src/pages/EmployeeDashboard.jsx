import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Upload, MessageSquare, Activity, CheckCircle, XCircle, Calendar, AlertCircle, Info } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ProgressBar'
import { formatDate, timeAgo } from '../utils/helpers'

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }
const stagger = { show: { transition: { staggerChildren: 0.06 } } }

const workflowSteps = [
  { label: 'HR Verification', status: 'completed' },
  { label: 'Document Upload', status: 'active' },
  { label: 'AI Verification', status: 'pending' },
  { label: 'Manager Approval', status: 'pending' },
  { label: 'IT Setup', status: 'pending' },
  { label: 'Orientation', status: 'pending' },
  { label: 'Completed', status: 'pending' },
]

const tasks = [
  { label: 'Upload Aadhar Card', priority: 'High', due: 'Due tomorrow', variant: 'danger' },
  { label: 'Upload PAN Card', priority: 'High', due: 'Due tomorrow', variant: 'danger' },
  { label: 'Complete Emergency Contact', priority: 'Medium', due: 'Due in 3 days', variant: 'warning' },
  { label: 'Digital Signature', priority: 'Low', due: 'Due in 7 days', variant: 'success' },
]

const profileItems = [
  { label: 'Personal Info', done: true },
  { label: 'Employment Details', done: true },
  { label: 'Emergency Contact', done: false },
  { label: 'Documents', done: false },
  { label: 'Digital Signature', done: false },
]

const notifications = [
  { type: 'success', icon: CheckCircle, text: 'HR verification completed successfully', time: new Date(Date.now() - 10 * 60000) },
  { type: 'warning', icon: AlertCircle, text: 'Document upload deadline approaching', time: new Date(Date.now() - 2 * 3600000) },
  { type: 'info', icon: Info, text: 'Orientation scheduled for July 15, 2026', time: new Date(Date.now() - 5 * 3600000) },
  { type: 'success', icon: CheckCircle, text: 'Your profile was reviewed by HR', time: new Date(Date.now() - 24 * 3600000) },
]

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const [checkedTasks, setCheckedTasks] = useState([])

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* Welcome Card */}
      <motion.div variants={fadeUp}>
        <Card padding="none" className="overflow-hidden gradient-primary text-white">
          <div className="flex flex-col sm:flex-row items-center justify-between p-6 gap-6">
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
              <p className="text-blue-100 text-sm mb-4">Your onboarding is in progress. Keep up the great work!</p>
              <Link to="/profile" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                Complete Profile
              </Link>
            </div>
            {/* Circular progress */}
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 40 * 0.65} ${2 * Math.PI * 40 * 0.35}`}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">65%</span>
                <span className="text-xs text-blue-100">Profile</span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Info + Workflow + Completion */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Employee Info */}
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <Card.Header border><Card.Title>Employee Information</Card.Title></Card.Header>
            <div className="space-y-3">
              {[
                ['Employee ID', user?.id || 'EMP042'],
                ['Department', user?.department || 'Engineering'],
                ['Role', 'Software Engineer'],
                ['Manager', 'Sarah Johnson'],
                ['Joining Date', 'July 1, 2026'],
                ['Employment Type', 'Full-Time'],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between items-start gap-2">
                  <span className="text-xs text-slate-500 flex-shrink-0">{l}</span>
                  <span className="text-xs font-medium text-slate-900 text-right">{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Workflow Status */}
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <Card.Header border><Card.Title>Workflow Status</Card.Title></Card.Header>
            <div className="space-y-2.5">
              {workflowSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold
                    ${step.status === 'completed' ? 'bg-emerald-500 text-white' :
                      step.status === 'active' ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                      'bg-slate-100 text-slate-400'}`}>
                    {step.status === 'completed' ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs font-medium ${step.status === 'completed' ? 'text-emerald-700' : step.status === 'active' ? 'text-blue-700' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                  {step.status === 'active' && <span className="ml-auto text-[10px] bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full">Active</span>}
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Profile Completion */}
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <Card.Header border><Card.Title>Profile Completion</Card.Title></Card.Header>
            <div className="mb-4">
              <ProgressBar value={65} color="gradient" size="md" />
            </div>
            <div className="space-y-2.5">
              {profileItems.map(({ label, done }) => (
                <div key={label} className="flex items-center gap-2.5">
                  {done
                    ? <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
                    : <XCircle size={16} className="text-slate-300 flex-shrink-0" />}
                  <span className={`text-sm ${done ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>{label}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Pending Tasks + Orientation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <Card className="h-full">
            <Card.Header border>
              <Card.Title>Pending Tasks</Card.Title>
              <Badge variant="warning" dot>{tasks.length} remaining</Badge>
            </Card.Header>
            <div className="space-y-3">
              {tasks.map((t, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${checkedTasks.includes(i) ? 'bg-slate-50 border-slate-100 opacity-60' : 'border-slate-100 hover:border-slate-200'}`}>
                  <input type="checkbox" checked={checkedTasks.includes(i)} onChange={() => setCheckedTasks(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${checkedTasks.includes(i) ? 'line-through text-slate-400' : 'text-slate-900'}`}>{t.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{t.due}</p>
                  </div>
                  <Badge variant={t.variant}>{t.priority}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="h-full bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={18} className="text-blue-600" />
              <h3 className="font-semibold text-slate-900 text-sm">Upcoming Orientation</h3>
            </div>
            <div className="space-y-3">
              <div className="bg-white rounded-xl p-3 border border-blue-100 text-center">
                <p className="text-3xl font-bold text-blue-600">15</p>
                <p className="text-sm text-slate-600 font-medium">July 2026</p>
              </div>
              <div className="space-y-2 text-sm">
                {[['🕙', '10:00 AM – 12:00 PM IST'], ['📍', 'Conference Room A'], ['💻', 'Teams Link available']].map(([icon, text]) => (
                  <p key={text} className="text-slate-600 flex items-center gap-2"><span>{icon}</span>{text}</p>
                ))}
              </div>
              <button className="w-full text-sm font-medium text-blue-600 border border-blue-200 rounded-lg py-2 hover:bg-blue-50 transition-colors">
                Add to Calendar
              </button>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Notifications */}
      <motion.div variants={fadeUp}>
        <Card>
          <Card.Header border><Card.Title>Recent Notifications</Card.Title></Card.Header>
          <div className="space-y-3">
            {notifications.map(({ type, icon: Icon, text, time }, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <Icon size={16} className={`mt-0.5 flex-shrink-0 ${type === 'success' ? 'text-emerald-500' : type === 'warning' ? 'text-amber-500' : 'text-blue-500'}`} />
                <p className="flex-1 text-sm text-slate-700">{text}</p>
                <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">{timeAgo(time)}</span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={fadeUp}>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Upload Documents', icon: Upload, to: '/documents', color: 'bg-blue-600 hover:bg-blue-700' },
            { label: 'Chat with AI', icon: MessageSquare, to: '/chatbot', color: 'bg-purple-600 hover:bg-purple-700' },
            { label: 'Track Status', icon: Activity, to: '/status-tracker', color: 'bg-emerald-600 hover:bg-emerald-700' },
          ].map(({ label, icon: Icon, to, color }) => (
            <Link key={label} to={to} className={`flex items-center gap-2 ${color} text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm`}>
              <Icon size={16} /> {label}
            </Link>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
