import { motion } from 'framer-motion'
import { cn } from '../utils/helpers'

export default function ProgressBar({
  value = 0,
  max = 100,
  label,
  showPercent = true,
  size = 'md',
  color = 'blue',
  animated = true,
  className = '',
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  const heights = { xs: 'h-1', sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' }

  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-400 to-amber-500',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    gradient: 'from-blue-500 via-indigo-500 to-purple-500',
  }

  return (
    <div className={cn('w-full', className)}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm text-slate-600 font-medium">{label}</span>}
          {showPercent && (
            <span className="text-sm font-semibold text-slate-700">{Math.round(pct)}%</span>
          )}
        </div>
      )}
      <div className={cn('w-full bg-slate-100 rounded-full overflow-hidden', heights[size])}>
        <motion.div
          className={cn('h-full rounded-full bg-gradient-to-r', colors[color])}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: animated ? 0.8 : 0, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
    </div>
  )
}
