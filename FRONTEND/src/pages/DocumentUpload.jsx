import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  User,
  ChevronDown,
  Eye,
  Download,
  RefreshCw,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react'
import UploadCard from '../components/UploadCard'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { useAuth } from '../context/AuthContext'
import { employeesAPI, documentsAPI } from '../services/api'

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

/* ───────────────────────────────────────────────────────────────────────────────
   HR GENERATED DOCUMENTS VIEW
   ─────────────────────────────────────────────────────────────────────────────── */
function HRDocumentsView() {
  const [employees, setEmployees] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [documents, setDocuments] = useState([])
  const [loadingEmployees, setLoadingEmployees] = useState(true)
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [regeneratingId, setRegeneratingId] = useState(null)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [error, setError] = useState(null)

  // Fetch employees
  useEffect(() => {
    setLoadingEmployees(true)
    employeesAPI.getAll()
      .then(res => {
        const raw = res.data?.data?.data || []
        setEmployees(raw)
        if (raw.length > 0) {
          setSelectedId(raw[0].id)
        }
      })
      .catch(err => {
        console.error('Failed to load employees:', err)
        setError('Failed to load employees list.')
      })
      .finally(() => setLoadingEmployees(false))
  }, [])

  const employee = employees.find(e => e.id === selectedId)

  // Fetch documents for the selected employee's workflow
  useEffect(() => {
    if (!employee || !employee.workflow_id) {
      setDocuments([])
      return
    }

    setLoadingDocs(true)
    documentsAPI.getByWorkflow(employee.workflow_id)
      .then(res => {
        setDocuments(res.data?.data || [])
      })
      .catch(err => {
        console.error('Failed to load documents:', err)
        setDocuments([])
      })
      .finally(() => setLoadingDocs(false))
  }, [employee])

  const handleRegenerate = async (docId) => {
    setRegeneratingId(docId)
    try {
      const res = await documentsAPI.regenerate(docId)
      const updated = res.data?.data
      setDocuments(prev => prev.map(d => d.id === docId ? updated : d))
      if (selectedDoc && selectedDoc.id === docId) {
        setSelectedDoc(updated)
      }
    } catch (err) {
      console.error('Failed to regenerate document:', err)
      alert('AI document regeneration failed. Please verify Gemini API status.')
    } finally {
      setRegeneratingId(null)
    }
  }

  const handleDownload = (doc) => {
    const element = document.createElement("a");
    const file = new Blob([doc.generated_content || ""], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = doc.document_name || `${doc.document_type.replace(/\s+/g, "_")}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  const statusBadge = (status) => {
    const map = {
      Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      Pending: 'bg-amber-50 text-amber-700 border-amber-200',
      Rejected: 'bg-red-50 text-red-700 border-red-200',
    }
    const cls = map[status] || 'bg-slate-50 text-slate-600 border-slate-200'
    const label = status === 'Pending' ? 'Generating' : status === 'Rejected' ? 'Failed' : status
    return <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${cls}`}>{label}</span>
  }

  if (loadingEmployees) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 p-20 flex items-center justify-center shadow-sm">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Selector */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-center gap-4 flex-wrap">
        <label className="text-sm font-semibold text-slate-600 flex items-center gap-1.5"><User size={15}/> Select Employee</label>
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full appearance-none border border-slate-200 rounded-lg px-4 py-2.5 pr-10 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.employee_name} — {emp.id}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
        </div>
      </div>

      {loadingDocs ? (
        <div className="bg-white rounded-xl border border-slate-100 p-20 flex justify-center items-center shadow-sm">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : !employee ? (
        <div className="bg-white rounded-xl border border-slate-100 p-20 text-center shadow-sm">
          <Info className="text-slate-300 mx-auto mb-4" size={48} />
          <h3 className="text-base font-bold text-slate-700 mb-1">No Employees Registered</h3>
          <p className="text-sm text-slate-400">Add an employee first to see AI-generated onboarding letters.</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-20 text-center shadow-sm">
          <AlertCircle className="text-slate-300 mx-auto mb-4" size={48} />
          <h3 className="text-base font-bold text-slate-700 mb-1">No Onboarding Documents Generated</h3>
          <p className="text-sm text-slate-400">This employee does not have active onboarding documents. Verify workflow status.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Document Type</th>
                <th className="px-6 py-4">Document Name</th>
                <th className="px-6 py-4">Generated Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">{doc.document_type}</td>
                  <td className="px-6 py-4 font-mono text-xs">{doc.document_name}</td>
                  <td className="px-6 py-4 text-slate-500">{new Date(doc.created_at || doc.generated_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">{statusBadge(doc.status)}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 border border-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all"
                    >
                      <Eye size={13} /> View
                    </button>
                    <button
                      onClick={() => handleDownload(doc)}
                      disabled={doc.status !== 'Approved'}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download size={13} /> Download
                    </button>
                    <button
                      onClick={() => handleRegenerate(doc.id)}
                      disabled={regeneratingId === doc.id}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 border border-purple-100 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-all disabled:opacity-50"
                    >
                      {regeneratingId === doc.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <RefreshCw size={13} />
                      )}
                      Regenerate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View modal */}
      <AnimatePresence>
        {selectedDoc && (
          <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-100 w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{selectedDoc.document_type}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedDoc.document_name}</p>
                </div>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 font-mono text-sm bg-slate-50 text-slate-800 whitespace-pre-wrap leading-relaxed select-text">
                {selectedDoc.generated_content}
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
                <div>
                  <span className="text-xs text-slate-400">Status: </span>
                  {statusBadge(selectedDoc.status)}
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => handleDownload(selectedDoc)}
                    disabled={selectedDoc.status !== 'Approved'}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition-all disabled:opacity-50"
                  >
                    <Download size={15} /> Download
                  </button>
                  <button
                    onClick={() => handleRegenerate(selectedDoc.id)}
                    disabled={regeneratingId === selectedDoc.id}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl transition-all disabled:opacity-50"
                  >
                    {regeneratingId === selectedDoc.id ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <RefreshCw size={15} />
                    )}
                    Regenerate
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ───────────────────────────────────────────────────────────────────────────────
   EMPLOYEE UPLOAD DOCUMENTS VIEW
   ─────────────────────────────────────────────────────────────────────────────── */
function EmployeeUploadView() {
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
    <>
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
    </>
  )
}

/* ───────────────────────────────────────────────────────────────────────────────
   MAIN EXPORT
   ─────────────────────────────────────────────────────────────────────────────── */
export default function DocumentUpload() {
  const { isHR } = useAuth()

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
                {isHR ? 'AI Document Center' : 'Document Center'}
              </h1>
            </div>
            <p className="text-slate-500 text-sm ml-10">
              {isHR ? 'View and regenerate onboarding letters generated by Gemini AI' : 'Upload and manage your onboarding documents'}
            </p>
          </div>
        </motion.div>

        {isHR ? <HRDocumentsView /> : <EmployeeUploadView />}

      </div>
    </motion.div>
  )
}
