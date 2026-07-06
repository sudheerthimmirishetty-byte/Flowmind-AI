import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, File, Eye, Trash2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { cn, formatFileSize } from '../utils/helpers'
import ProgressBar from './ProgressBar'

export default function UploadCard({
  label,
  description,
  icon: Icon = File,
  accept = { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg'] },
  maxSize = 10 * 1024 * 1024, // 10 MB
  onUpload,
  className = '',
}) {
  const [file, setFile] = useState(null)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('idle') // idle | uploading | done | error
  const [preview, setPreview] = useState(null)

  const onDrop = useCallback(async (accepted) => {
    const f = accepted[0]
    if (!f) return
    setFile(f)
    setStatus('uploading')
    setProgress(0)

    if (f.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target.result)
      reader.readAsDataURL(f)
    } else {
      setPreview(null)
    }

    // Simulate upload progress
    let p = 0
    const interval = setInterval(() => {
      p += Math.random() * 20 + 5
      if (p >= 100) {
        p = 100
        clearInterval(interval)
        setProgress(100)
        setStatus('done')
        onUpload?.(f)
      } else {
        setProgress(Math.round(p))
      }
    }, 200)
  }, [onUpload])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
  })

  const handleRemove = (e) => {
    e.stopPropagation()
    setFile(null)
    setProgress(0)
    setStatus('idle')
    setPreview(null)
  }

  const isError = fileRejections.length > 0

  return (
    <div className={cn('bg-white rounded-xl border border-slate-100 card-shadow p-5', className)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
          <Icon size={20} className="text-blue-600" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">{label}</h4>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
        {status === 'done' && (
          <CheckCircle size={20} className="ml-auto text-emerald-500 flex-shrink-0" />
        )}
        {isError && (
          <AlertCircle size={20} className="ml-auto text-red-500 flex-shrink-0" />
        )}
      </div>

      {/* Drop zone or preview */}
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200',
              isDragActive ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50',
              isError && 'border-red-300 bg-red-50'
            )}
          >
            <input {...getInputProps()} />
            <Upload size={28} className={cn('mx-auto mb-3', isDragActive ? 'text-blue-500' : 'text-slate-300')} />
            <p className="text-sm font-medium text-slate-600">
              {isDragActive ? 'Drop file here' : 'Drag & drop or click to upload'}
            </p>
            <p className="text-xs text-slate-400 mt-1">PDF, PNG, JPG up to {formatFileSize(maxSize)}</p>
            {isError && (
              <p className="text-xs text-red-500 mt-1">{fileRejections[0]?.errors[0]?.message}</p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="file"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="border border-slate-100 rounded-xl overflow-hidden"
          >
            {/* Preview */}
            {preview ? (
              <div className="relative aspect-video overflow-hidden bg-slate-100">
                <img src={preview} alt="Preview" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-slate-50">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <File size={20} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
            )}

            {/* Progress */}
            {status === 'uploading' && (
              <div className="p-3">
                <ProgressBar value={progress} size="sm" color="blue" label="Uploading…" />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 p-3 border-t border-slate-100">
              {preview && (
                <button className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 transition-colors">
                  <Eye size={14} /> Preview
                </button>
              )}
              <div {...getRootProps()} className="contents">
                <input {...getInputProps()} />
                <button className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 transition-colors">
                  <RefreshCw size={14} /> Replace
                </button>
              </div>
              <button
                onClick={handleRemove}
                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition-colors ml-auto"
              >
                <Trash2 size={14} /> Remove
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
