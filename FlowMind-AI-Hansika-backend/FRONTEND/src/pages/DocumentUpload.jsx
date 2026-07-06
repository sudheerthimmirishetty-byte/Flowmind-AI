import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  CreditCard,
  FileText,
  BookOpen,
  GraduationCap,
  Briefcase,
  FileCheck,
  Info,
  CheckCircle2,
  Clock,
  FolderOpen,
  Send,
  Mail,
} from 'lucide-react'
import UploadCard from '../components/UploadCard'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'

// ── Document definitions ──────────────────────────────────────────────────────
const docs = [
  { id: 'aadhar',    label: 'Aadhar Card',            description: 'Government-issued identity proof',     icon: CreditCard    },
  { id: 'pan',       label: 'PAN Card',               description: 'Permanent Account Number card',        icon: FileText      },
  { id: 'passport',  label: 'Passport',               description: 'Valid passport (if available)',         icon: BookOpen      },
  { id: 'degree',    label: 'Degree Certificate',     description: 'Highest educational qualification',    icon: GraduationCap },
  { id: 'exp',       label: 'Experience Certificate', description: 'Previous employment letter',           icon: Briefcase     },
  { id: 'offer',     label: 'Offer Letter',           description: 'Signed offer letter copy',             icon: FileCheck     },
]

const guidelines = [
  'Accepted formats: PDF, JPG, PNG (max 10 MB per file)',
  'Ensure all documents are clearly legible and not expired',
  'Scanned copies must be at minimum 300 DPI resolution',
  'Password-protected PDFs cannot be processed — remove protection first',
  'Each document must show your full name exactly as on official records',
  'Blurred, cropped, or watermarked files will be rejected',
]

// ── Animation helpers ─────────────────────────────────────────────────────────
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}
const item = {
  hidden: { opacity: 0, y: 22 },
  show:  { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DocumentUpload() {
  const [uploaded, setUploaded] = useState(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleUpload = (id) =>
    setUploaded((prev) => new Set([...prev, id]))

  const totalRequired = docs.length
  const totalUploaded = uploaded.size
  const totalPending  = totalRequired - totalUploaded

  const handleSubmit = async () => {
    if (totalUploaded === 0) return
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 1800))
    setSubmitting(false)
    setSubmitted(true)
  }

  return (
    <motion.div
      className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <FolderOpen size={16} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Document Center
              </h1>
            </div>
            <p className="text-slate-500 text-sm ml-10">Upload and manage your onboarding documents</p>
          </div>

          {submitted && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-sm font-medium"
            >
              <CheckCircle2 size={16} />
              Documents submitted successfully!
            </motion.div>
          )}
        </motion.div>

        {/* Summary bar */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-3 gap-4"
        >
          {[
            {
              label: 'Total Required',
              value: totalRequired,
              badge: 'info',
              icon:  <FolderOpen size={18} className="text-blue-500" />,
              bg:    'from-blue-50 to-blue-100/40',
              ring:  'ring-blue-100',
            },
            {
              label: 'Uploaded',
              value: totalUploaded,
              badge: 'success',
              icon:  <CheckCircle2 size={18} className="text-emerald-500" />,
              bg:    'from-emerald-50 to-emerald-100/40',
              ring:  'ring-emerald-100',
            },
            {
              label: 'Pending',
              value: totalPending,
              badge: 'warning',
              icon:  <Clock size={18} className="text-amber-500" />,
              bg:    'from-amber-50 to-amber-100/40',
              ring:  'ring-amber-100',
            },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              variants={item}
              className={`bg-gradient-to-br ${stat.bg} rounded-xl p-4 border border-white ring-1 ${stat.ring} card-shadow flex items-center gap-3`}
            >
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                {stat.icon}
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-bold text-slate-900">{stat.value}</span>
                  <Badge variant={stat.badge} className="text-[10px] px-1.5 py-0">
                    {stat.value === 1 ? 'doc' : 'docs'}
                  </Badge>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
          style={{ originX: 0 }}
          className="bg-white rounded-xl border border-slate-100 card-shadow px-5 py-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">Upload Progress</span>
            <span className="text-sm font-bold text-blue-600">
              {Math.round((totalUploaded / totalRequired) * 100)}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(totalUploaded / totalRequired) * 100}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            {totalUploaded} of {totalRequired} documents uploaded
          </p>
        </motion.div>

        {/* Upload grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {docs.map((doc) => (
            <motion.div key={doc.id} variants={item}>
              <UploadCard
                label={doc.label}
                description={doc.description}
                icon={doc.icon}
                onUpload={() => handleUpload(doc.id)}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Guidelines card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="bg-white rounded-xl border border-blue-100 card-shadow p-6"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Info size={18} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Upload Guidelines
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Please read carefully before uploading your documents
              </p>
            </div>
          </div>

          <ul className="space-y-2.5 mb-5">
            {guidelines.map((g, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                <span className="mt-1 w-4 h-4 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                {g}
              </li>
            ))}
          </ul>

          <div className="border-t border-slate-100 pt-4 flex items-center gap-2 text-sm text-slate-500">
            <Mail size={14} className="text-blue-500" />
            <span>Questions? </span>
            <a
              href="mailto:hr@company.com"
              className="text-blue-600 font-medium hover:underline"
            >
              Contact HR at hr@company.com
            </a>
          </div>
        </motion.div>

        {/* Submit button row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl border border-slate-100 card-shadow p-5"
        >
          <div>
            <p className="text-sm font-semibold text-slate-800">Ready to submit?</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {totalUploaded === 0
                ? 'Upload at least one document to continue'
                : `${totalUploaded} document${totalUploaded > 1 ? 's' : ''} ready — ${
                    totalPending > 0
                      ? `${totalPending} still pending`
                      : 'all documents uploaded!'
                  }`}
            </p>
          </div>
          <Button
            variant={submitted ? 'success' : 'primary'}
            size="lg"
            icon={submitted ? CheckCircle2 : Send}
            disabled={totalUploaded === 0 || submitted}
            loading={submitting}
            onClick={handleSubmit}
            className="min-w-[200px]"
          >
            {submitted ? 'Submitted!' : 'Submit All Documents'}
          </Button>
        </motion.div>

      </div>
    </motion.div>
  )
}
