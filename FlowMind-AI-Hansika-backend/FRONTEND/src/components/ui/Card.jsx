import { cn } from '../../utils/helpers'

export default function Card({
  children,
  className = '',
  padding = 'md',
  hover = false,
  onClick,
  ...props
}) {
  const paddings = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6', xl: 'p-8' }
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl border border-slate-100 card-shadow',
        paddings[padding],
        hover && 'hover:elevated-shadow hover:-translate-y-0.5 transition-all duration-200 cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

Card.Header = function CardHeader({ children, className = '', border = false }) {
  return (
    <div className={cn('flex items-center justify-between mb-5', border && 'pb-4 border-b border-slate-100', className)}>
      {children}
    </div>
  )
}

Card.Title = function CardTitle({ children, className = '' }) {
  return <h3 className={cn('font-semibold text-slate-900 text-base', className)}>{children}</h3>
}

Card.Body = function CardBody({ children, className = '' }) {
  return <div className={cn(className)}>{children}</div>
}
