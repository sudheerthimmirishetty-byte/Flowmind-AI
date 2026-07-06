import { cn } from '../../utils/helpers'

export function Spinner({ size = 'md', className = '' }) {
  const sizes = { xs: 'w-3 h-3', sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8', xl: 'w-12 h-12' }
  return (
    <div
      className={cn(
        'border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin',
        sizes[size],
        className
      )}
    />
  )
}

export function PageLoader() {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-3 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-slate-500 text-sm font-medium">Loading…</p>
    </div>
  )
}

export function SkeletonLine({ className = '' }) {
  return <div className={cn('h-4 bg-slate-200 rounded animate-pulse', className)} />
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-100 card-shadow space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-200 rounded-lg" />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="w-3/4" />
          <SkeletonLine className="w-1/2 h-3" />
        </div>
      </div>
      <SkeletonLine />
      <SkeletonLine className="w-4/5" />
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="flex gap-4 pb-3 border-b border-slate-100">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLine key={i} className={`flex-1 h-3 ${i === 0 ? 'w-8' : ''}`} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-2">
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonLine key={c} className="flex-1 h-4" />
          ))}
        </div>
      ))}
    </div>
  )
}

export default Spinner
