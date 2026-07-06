import { motion } from 'framer-motion'
import { cn } from '../utils/helpers'

export default function Timeline({ items = [], className = '' }) {
  return (
    <div className={cn('relative', className)}>
      {/* Vertical line */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-100" />

      <div className="space-y-6">
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.06, duration: 0.3 }}
            className="relative flex items-start gap-4"
          >
            {/* Icon node */}
            <div
              className={cn(
                'relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2',
                item.status === 'completed' && 'bg-emerald-50 border-emerald-200 text-emerald-600',
                item.status === 'active' && 'bg-blue-50 border-blue-300 text-blue-600',
                item.status === 'pending' && 'bg-slate-50 border-slate-200 text-slate-400',
                item.status === 'rejected' && 'bg-red-50 border-red-200 text-red-500',
              )}
            >
              {item.icon}
              {item.status === 'active' && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={cn(
                    'text-sm font-semibold',
                    item.status === 'completed' && 'text-slate-900',
                    item.status === 'active' && 'text-blue-700',
                    item.status === 'pending' && 'text-slate-400',
                    item.status === 'rejected' && 'text-red-600',
                  )}>
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                  )}
                </div>
                {item.time && (
                  <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">{item.time}</span>
                )}
              </div>
              {item.extra && (
                <div className="mt-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600">
                  {item.extra}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
