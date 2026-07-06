import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  FileText,
  Activity,
  Shield,
  Edit3,
  Save,
  X,
  Eye,
  Download,
  CreditCard,
  BookOpen,
  GraduationCap,
  Briefcase,
  FileCheck,
  LogIn,
  Upload,
  Settings,
  CheckCircle,
  Lock,
  Trash2,
  AlertTriangle,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Building2,
  IdCard,
  Users,
  LayoutGrid,
  ShieldCheck,
  ShieldOff,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import Timeline from '../components/Timeline'
import { cn, getInitials, formatDate } from '../utils/helpers'

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'profile',   label: 'Profile',   icon: User      },
  { id: 'documents', label: 'Documents', icon: FileText  },
  { id: 'activity',  label: 'Activity',  icon: Activity  },
  { id: 'security',  label: 'Security',  icon: Shield    },
]

// ── Mock profile data ─────────────────────────────────────────────────────────
const DEFAULT_PROFILE = {
  fullName:       'Alex Mitchell',
  email:          'employee@company.com',
  phone:          '+91-9876543210',
  dob:            '1998-03-15',
  gender:         'Male',
  address:        '204, Green Valley Apartments, Whitefield, Bengaluru – 560066',
  employeeId:     'EMP042',
  department:     'Engineering',
  role:           'Software Engineer',
  manager:        'Sarah Johnson',
  joiningDate:    '2026-07-01',
  employmentType: 'Full-Time',
}

// ── Document rows ─────────────────────────────────────────────────────────────
const DOCUMENTS = [
  { label: 'Aadhar Card',            icon: CreditCard,    status: 'Uploaded', date: '2026-06-20' },
  { label: 'PAN Card',               icon: CreditCard,    status: 'Uploaded', date: '2026-06-20' },
  { label: 'Passport',               icon: BookOpen,      status: 'Pending',  date: null         },
  { label: 'Degree Certificate',     icon: GraduationCap, status: 'Uploaded', date: '2026-06-22' },
  { label: 'Experience Certificate', icon: Briefcase,     status: 'Pending',  date: null         },
  { label: 'Offer Letter',           icon: FileCheck,     status: 'Uploaded', date: '2026-06-18' },
]

// ── Timeline items ────────────────────────────────────────────────────────────
const TIMELINE_ITEMS = [
  {
    title:       'Profile created',
    description: 'Your employee profile was created in the system',
    time:        '2 Jul 2026, 10:05 AM',
    status:      'completed',
    icon:        <User size={16} />,
  },
  {
    title:       'Document uploaded: Aadhar Card',
    description: 'Document verified and accepted',
    time:        '2 Jul 2026, 10:22 AM',
    status:      'completed',
    icon:        <Upload size={16} />,
  },
  {
    title:       'Workflow stage: Background Check',
    description: 'Background verification initiated by HR',
    time:        '2 Jul 2026, 11:00 AM',
    status:      'active',
    icon:        <ShieldCheck size={16} />,
  },
  {
    title:       'Document uploaded: PAN Card',
    description: 'Document accepted after re-submission',
    time:        '30 Jun 2026, 3:14 PM',
    status:      'completed',
    icon:        <Upload size={16} />,
  },
  {
    title:       'Profile updated',
    description: 'Phone number and address details updated',
    time:        '29 Jun 2026, 9:48 AM',
    status:      'completed',
    icon:        <Settings size={16} />,
  },
  {
    title:       'Login — Chrome / Windows',
    description: 'Successful login from Bengaluru, India',
    time:        '28 Jun 2026, 8:30 AM',
    status:      'completed',
    icon:        <LogIn size={16} />,
  },
  {
    title:       'Offer Letter uploaded',
    description: 'Signed offer letter accepted',
    time:        '27 Jun 2026, 5:02 PM',
    status:      'completed',
    icon:        <FileCheck size={16} />,
  },
  {
    title:       'Account created',
    description: 'Welcome email sent to employee@company.com',
    time:        '26 Jun 2026, 10:00 AM',
    status:      'completed',
    icon:        <CheckCircle size={16} />,
  },
]

// ── Password strength ─────────────────────────────────────────────────────────
const getPasswordStrength = (pw) => {
  if (!pw) return { level: 0, label: '', color: '' }
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { level: 1, label: 'Weak',   color: 'bg-red-500'   }
  if (score === 2) return { level: 2, label: 'Fair',   color: 'bg-amber-500' }
  if (score === 3) return { level: 3, label: 'Good',   color: 'bg-blue-500'  }
  return              { level: 4, label: 'Strong', color: 'bg-emerald-500' }
}

// ── Field row ─────────────────────────────────────────────────────────────────
function FieldRow({ label, value, icon: Icon, editMode, name, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 mb-0.5">
        {Icon && <Icon size={12} className="text-slate-400" />}
        <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</span>
      </div>
      {editMode ? (
        <Input
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          inputClassName="text-sm"
        />
      ) : (
        <p className="text-sm font-medium text-slate-900">{value || '—'}</p>
      )}
    </div>
  )
}

// ── Animation helpers ─────────────────────────────────────────────────────────
const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
  transition: { duration: 0.25 },
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Profile() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')

  // Profile state
  const [profile, setProfile]     = useState(DEFAULT_PROFILE)
  const [editMode, setEditMode]   = useState(false)
  const [draft, setDraft]         = useState(profile)
  const [savingProfile, setSavingProfile] = useState(false)

  // Security state
  const [passwords, setPasswords] = useState({ current: '', newPw: '', confirm: '' })
  const [twoFA, setTwoFA]         = useState(false)
  const [savingPw, setSavingPw]   = useState(false)
  const [pwSaved, setPwSaved]     = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const strength = getPasswordStrength(passwords.newPw)

  const handleProfileSave = async () => {
    setSavingProfile(true)
    await new Promise((r) => setTimeout(r, 1000))
    setProfile(draft)
    setEditMode(false)
    setSavingProfile(false)
  }

  const handlePasswordSave = async () => {
    if (!passwords.current || !passwords.newPw || passwords.newPw !== passwords.confirm) return
    setSavingPw(true)
    await new Promise((r) => setTimeout(r, 1200))
    setSavingPw(false)
    setPwSaved(true)
    setPasswords({ current: '', newPw: '', confirm: '' })
    setTimeout(() => setPwSaved(false), 3000)
  }

  const displayName = user?.name || profile.fullName
  const initials    = getInitials(displayName)

  return (
    <motion.div
      className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Page heading */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
            My Profile
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage your personal information and account settings</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-slate-100 card-shadow p-1.5 flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              )}
            >
              <tab.icon size={15} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">

          {/* ═══ PROFILE TAB ═══════════════════════════════════════════════ */}
          {activeTab === 'profile' && (
            <motion.div key="profile" {...fadeSlide} className="space-y-5">

              {/* Avatar header card */}
              <div className="bg-white rounded-xl border border-slate-100 card-shadow p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
                      <span className="text-3xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {initials}
                      </span>
                    </div>
                    <span className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white" />
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {displayName}
                    </h2>
                    <p className="text-slate-500 text-sm mt-0.5">{profile.role}</p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                      <Badge variant="info" dot>{profile.department}</Badge>
                      <Badge variant="muted">{profile.employeeId}</Badge>
                      <Badge variant="success" dot>Active</Badge>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {!editMode ? (
                      <Button variant="secondary" size="sm" icon={Edit3} onClick={() => { setDraft(profile); setEditMode(true) }}>
                        Edit Profile
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="primary" size="sm" icon={Save} loading={savingProfile} onClick={handleProfileSave}>
                          Save Changes
                        </Button>
                        <Button variant="secondary" size="sm" icon={X} onClick={() => setEditMode(false)}>
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Info grid */}
              <div className="bg-white rounded-xl border border-slate-100 card-shadow p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-5 flex items-center gap-2">
                  <LayoutGrid size={15} className="text-blue-500" />
                  Personal & Employment Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                  <FieldRow label="Full Name"       value={editMode ? draft.fullName       : profile.fullName}       icon={User}       editMode={editMode} name="fullName"       onChange={(k,v) => setDraft(d => ({...d,[k]:v}))} />
                  <FieldRow label="Email Address"   value={editMode ? draft.email          : profile.email}          icon={Mail}       editMode={false}    name="email"         onChange={() => {}} />
                  <FieldRow label="Phone Number"    value={editMode ? draft.phone          : profile.phone}          icon={Phone}      editMode={editMode} name="phone"         onChange={(k,v) => setDraft(d => ({...d,[k]:v}))} />
                  <FieldRow label="Date of Birth"   value={editMode ? draft.dob            : formatDate(profile.dob)} icon={Calendar}  editMode={editMode} name="dob"           onChange={(k,v) => setDraft(d => ({...d,[k]:v}))} />
                  <FieldRow label="Gender"          value={editMode ? draft.gender         : profile.gender}         icon={User}       editMode={editMode} name="gender"        onChange={(k,v) => setDraft(d => ({...d,[k]:v}))} />
                  <FieldRow label="Address"         value={editMode ? draft.address        : profile.address}        icon={MapPin}     editMode={editMode} name="address"       onChange={(k,v) => setDraft(d => ({...d,[k]:v}))} />

                  <div className="sm:col-span-2 border-t border-slate-100 pt-4 mt-1" />

                  <FieldRow label="Employee ID"     value={profile.employeeId}    icon={IdCard}     editMode={false}    name="employeeId"     onChange={() => {}} />
                  <FieldRow label="Department"      value={profile.department}    icon={Building2}  editMode={false}    name="department"     onChange={() => {}} />
                  <FieldRow label="Role / Position" value={profile.role}          icon={Briefcase}  editMode={false}    name="role"           onChange={() => {}} />
                  <FieldRow label="Reporting Manager" value={profile.manager}     icon={Users}      editMode={false}    name="manager"        onChange={() => {}} />
                  <FieldRow label="Joining Date"    value={formatDate(profile.joiningDate)} icon={Calendar} editMode={false} name="joiningDate" onChange={() => {}} />
                  <FieldRow label="Employment Type" value={profile.employmentType} icon={Briefcase} editMode={false}    name="employmentType" onChange={() => {}} />
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ DOCUMENTS TAB ══════════════════════════════════════════════ */}
          {activeTab === 'documents' && (
            <motion.div key="documents" {...fadeSlide}>
              <div className="bg-white rounded-xl border border-slate-100 card-shadow p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-5 flex items-center gap-2">
                  <FileText size={15} className="text-blue-500" />
                  Onboarding Documents
                </h3>
                <div className="space-y-3">
                  {DOCUMENTS.map((doc, i) => (
                    <motion.div
                      key={doc.label}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.3 }}
                      className="flex items-center gap-4 p-3.5 rounded-xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all duration-200"
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                        doc.status === 'Uploaded' ? 'bg-emerald-50' : 'bg-amber-50'
                      )}>
                        <doc.icon size={18} className={doc.status === 'Uploaded' ? 'text-emerald-600' : 'text-amber-500'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{doc.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {doc.date ? `Uploaded on ${formatDate(doc.date)}` : 'Not yet uploaded'}
                        </p>
                      </div>
                      <Badge variant={doc.status === 'Uploaded' ? 'success' : 'warning'} dot>
                        {doc.status}
                      </Badge>
                      {doc.status === 'Uploaded' && (
                        <div className="flex gap-1.5">
                          <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Eye size={15} />
                          </button>
                          <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Download size={15} />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ ACTIVITY TAB ═══════════════════════════════════════════════ */}
          {activeTab === 'activity' && (
            <motion.div key="activity" {...fadeSlide}>
              <div className="bg-white rounded-xl border border-slate-100 card-shadow p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-6 flex items-center gap-2">
                  <Activity size={15} className="text-blue-500" />
                  Recent Activity
                </h3>
                <Timeline items={TIMELINE_ITEMS} />
              </div>
            </motion.div>
          )}

          {/* ═══ SECURITY TAB ═══════════════════════════════════════════════ */}
          {activeTab === 'security' && (
            <motion.div key="security" {...fadeSlide} className="space-y-5">

              {/* Change password */}
              <div className="bg-white rounded-xl border border-slate-100 card-shadow p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-5 flex items-center gap-2">
                  <Lock size={15} className="text-blue-500" />
                  Change Password
                </h3>

                {pwSaved && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-lg text-sm mb-4"
                  >
                    <CheckCircle size={15} />
                    Password updated successfully!
                  </motion.div>
                )}

                <div className="space-y-4">
                  <Input
                    label="Current Password"
                    type="password"
                    placeholder="Enter current password"
                    value={passwords.current}
                    onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                  />
                  <Input
                    label="New Password"
                    type="password"
                    placeholder="Enter new password"
                    value={passwords.newPw}
                    onChange={(e) => setPasswords((p) => ({ ...p, newPw: e.target.value }))}
                  />

                  {/* Strength indicator */}
                  {passwords.newPw && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Password strength</span>
                        <span className={cn(
                          'text-xs font-semibold',
                          strength.level === 1 && 'text-red-500',
                          strength.level === 2 && 'text-amber-500',
                          strength.level === 3 && 'text-blue-500',
                          strength.level === 4 && 'text-emerald-500',
                        )}>
                          {strength.label}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {[1,2,3,4].map((lvl) => (
                          <div
                            key={lvl}
                            className={cn(
                              'h-1.5 flex-1 rounded-full transition-all duration-300',
                              lvl <= strength.level ? strength.color : 'bg-slate-100'
                            )}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}

                  <Input
                    label="Confirm New Password"
                    type="password"
                    placeholder="Re-enter new password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                    error={
                      passwords.confirm && passwords.newPw !== passwords.confirm
                        ? 'Passwords do not match'
                        : undefined
                    }
                  />

                  <Button
                    variant="primary"
                    size="md"
                    icon={Lock}
                    loading={savingPw}
                    disabled={!passwords.current || !passwords.newPw || passwords.newPw !== passwords.confirm}
                    onClick={handlePasswordSave}
                  >
                    Update Password
                  </Button>
                </div>
              </div>

              {/* 2FA */}
              <div className="bg-white rounded-xl border border-slate-100 card-shadow p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-1 flex items-center gap-2">
                  <ShieldCheck size={15} className="text-blue-500" />
                  Two-Factor Authentication
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Add an extra layer of security to your account using an authenticator app.
                </p>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      twoFA ? 'bg-emerald-100' : 'bg-slate-200'
                    )}>
                      {twoFA
                        ? <ShieldCheck size={18} className="text-emerald-600" />
                        : <ShieldOff   size={18} className="text-slate-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {twoFA ? '2FA Enabled' : '2FA Disabled'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {twoFA
                          ? 'Your account is protected with 2FA'
                          : 'Enable to secure your account further'}
                      </p>
                    </div>
                  </div>

                  {/* Toggle switch */}
                  <button
                    onClick={() => setTwoFA((v) => !v)}
                    className={cn(
                      'relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none',
                      twoFA ? 'bg-blue-600' : 'bg-slate-200'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300',
                        twoFA && 'translate-x-6'
                      )}
                    />
                  </button>
                </div>
              </div>

              {/* Danger zone */}
              <div className="bg-white rounded-xl border border-red-200 card-shadow p-6">
                <h3 className="text-sm font-semibold text-red-600 mb-1 flex items-center gap-2">
                  <AlertTriangle size={15} />
                  Danger Zone
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                {!showDeleteConfirm ? (
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete Account
                  </Button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4"
                  >
                    <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700 flex-1">
                      Are you absolutely sure? This action cannot be undone.
                    </p>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button variant="danger"    size="sm" onClick={() => {}}>Yes, Delete</Button>
                      <Button variant="secondary" size="sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                    </div>
                  </motion.div>
                )}
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  )
}
