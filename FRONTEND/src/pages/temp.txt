import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Users, Clock, CheckCircle, XCircle, UserPlus, GitBranch, FileDown, ArrowRight, Sparkles, TrendingUp, TrendingDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import GrowthChart from '../components/charts/GrowthChart'
import DeptChart from '../components/charts/DeptChart'
import WorkflowChart from '../components/charts/WorkflowChart'
import { formatDate, timeAgo } from '../utils/helpers'

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }
const stagger = { show: { transition: { staggerChildren: 0.07 } } }

const stats = [
  { label: 'Total Employees', value: 189, icon: Users, color: 'blue', bg: 'bg-blue-50', trend: '+12%', up: true },
  { label: 'Pending Onboarding', value: 23, icon: Clock, color: 'amber', bg: 'bg-amber-50', trend: '-4%', up: false },
  { label: 'Completed', value: 142, icon: CheckCircle, color: 'emerald', bg: 'bg-emerald-50', trend: '+18%', up: true },
  { label: 'Rejected', value: 12, icon: XCircle, color: 'red', bg: 'bg-red-50', trend: '-2%', up: false },
]

const activities = [
  { dot: 'bg-emerald-500', text: 'Arjun Sharma completed onboarding', time: new Date(Date.now() - 5 * 60000), tag: 'Completed' },
  { dot: 'bg-blue-500', text: 'Priya Patel uploaded Aadhar Card', time: new Date(Date.now() - 28 * 60000), tag: 'Document' },
  { dot: 'bg-amber-500', text: 'Rahul Gupta pending manager approval', time: new Date(Date.now() - 2 * 3600000), tag: 'Pending' },
  { dot: 'bg-purple-500', text: 'Sneha Singh registered as new employee', time: new Date(Date.now() - 4 * 3600000), tag: 'New' },
  { dot: 'bg-red-500', text: 'Vikram Nair document verification rejected', time: new Date(Date.now() - 6 * 3600000), tag: 'Rejected' },
  { dot: 'bg-emerald-500', text: 'Divya Rao IT setup completed', time: new Date(Date.now() - 24 * 3600000), tag: 'Done' },
]

const quickActions = [
  { label: 'Register Employee', icon: UserPlus, to: '/register-employee', color: 'text-blue-600', bg: 'bg-blue-50 hover:bg-blue-100' },
  { label: 'View Workflow', icon: GitBranch, to: '/workflow', color: 'text-purple-600', bg: 'bg-purple-50 hover:bg-purple-100' },
  { label: 'Generate Report', icon: FileDown, to: '#', color: 'text-emerald-600', bg: 'bg-emerald-50 hover:bg-emerald-100' },
  { label: 'View Employees', icon: Users, to: '/employees', color: 'text-orange-600', bg: 'bg-orange-50 hover:bg-orange-100' },
]

const insights = [
  { dot: 'bg-red-400', text: '5 employees need document follow-up by tomorrow' },
  { dot: 'bg-emerald-400', text: 'Engineering dept onboarding 23% faster this month' },
  { dot: 'bg-amber-400', text: '3 pending manager approvals blocking IT setup' },
]

export default function HRDashboard() {
  const { user } = useAuth()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{greeting}, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-slate-500 text-sm mt-0.5">{formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <button className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-sm">
          <Sparkles size={16} /> AI Suggestions
        </button>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, trend, up }) => (
          <motion.div key={label} variants={fadeUp}>
            <Card className="relative overflow-hidden">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center`}>
                  <Icon size={22} className={`text-${color}-600`} />
                </div>
                <span className={`flex items-center gap-1 text-xs font-semibold ${up ? 'text-emerald-600' : 'text-red-500'}`}>
                  {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />} {trend}
                </span>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div variants={fadeUp} className="lg:col-span-1">
          <Card className="h-full">
            <Card.Header>
              <Card.Title>Employee Growth</Card.Title>
              <Badge variant="info">This Year</Badge>
            </Card.Header>
            <GrowthChart />
          </Card>
        </motion.div>
        <motion.div variants={fadeUp} className="lg:col-span-1">
          <Card className="h-full">
            <Card.Header><Card.Title>Department Distribution</Card.Title></Card.Header>
            <DeptChart />
          </Card>
        </motion.div>
        <motion.div variants={fadeUp} className="lg:col-span-1">
          <Card className="h-full">
            <Card.Header><Card.Title>Workflow Progress</Card.Title></Card.Header>
            <WorkflowChart />
            <div className="flex gap-4 mt-2 justify-center">
              {[['bg-emerald-500','Completed'],['bg-amber-400','Pending'],['bg-red-400','Rejected']].map(([c,l]) => (
                <div key={l} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className={`w-2.5 h-2.5 rounded-full ${c}`} />{l}
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Activities + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <Card.Header border>
            <Card.Title>Recent Activities</Card.Title>
            <button className="text-xs text-blue-600 hover:underline font-medium">View all</button>
          </Card.Header>
          <div className="space-y-3">
            {activities.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 truncate">{a.text}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{timeAgo(a.time)}</p>
                </div>
                <Badge variant={a.tag === 'Completed' || a.tag === 'Done' ? 'success' : a.tag === 'Rejected' ? 'danger' : a.tag === 'Pending' ? 'warning' : 'info'} className="flex-shrink-0">
                  {a.tag}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <Card.Header border>
            <Card.Title>Quick Actions</Card.Title>
          </Card.Header>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(({ label, icon: Icon, to, color, bg }) => (
              <Link key={label} to={to}
                className={`flex items-center gap-3 p-4 rounded-xl ${bg} transition-all duration-150 group`}>
                <div className={`w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm`}>
                  <Icon size={18} className={color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 leading-tight">{label}</p>
                </div>
                <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* AI Suggestions */}
      <Card className="border-2 border-transparent" style={{ background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #7C3AED, #2563EB) border-box' }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">AI Onboarding Insights</h3>
              <p className="text-xs text-slate-500">Powered by OnboardIQ AI</p>
            </div>
          </div>
          <button className="text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors">
            Get Detailed Report
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {insights.map(({ dot, text }, i) => (
            <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-full px-4 py-2 text-sm text-slate-700">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
              {text}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
