import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '../utils/helpers'

export default function Stepper({ steps, currentStep, orientation = 'horizontal', className = '' }) {
  return (
    <div
      className={cn(
        orientation === 'horizontal'
          ? 'flex items-center w-full'
          : 'flex flex-col gap-0',
        className
      )}
    >
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isActive = index === currentStep
        const isLast = index === steps.length - 1

        return (
          <div
            key={index}
            className={cn(
              orientation === 'horizontal' ? 'flex items-center flex-1 last:flex-none' : 'flex items-start'
            )}
          >
            {/* Step node */}
            <div className={cn('flex flex-col items-center', orientation === 'horizontal' ? '' : 'items-center')}>
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: isCompleted ? '#10B981' : isActive ? '#2563EB' : '#E2E8F0',
                  scale: isActive ? 1.1 : 1,
                }}
                transition={{ duration: 0.3 }}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 font-semibold text-sm transition-colors z-10 flex-shrink-0',
                  isCompleted && 'border-emerald-500 text-white',
                  isActive && 'border-blue-600 text-white shadow-lg shadow-blue-200',
                  !isCompleted && !isActive && 'border-slate-200 text-slate-400'
                )}
              >
                {isCompleted ? <Check size={18} /> : <span>{index + 1}</span>}
              </motion.div>
              {orientation === 'horizontal' && (
                <div className="mt-2 text-center min-w-0 px-1">
                  <p className={cn('text-xs font-semibold whitespace-nowrap', isActive ? 'text-blue-600' : isCompleted ? 'text-emerald-600' : 'text-slate-400')}>
                    {step.label}
                  </p>
                  {step.sublabel && (
                    <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">{step.sublabel}</p>
                  )}
                </div>
              )}
            </div>

            {/* Connector */}
            {!isLast && (
              <div
                className={cn(
                  orientation === 'horizontal'
                    ? 'flex-1 h-0.5 mx-2 rounded-full transition-colors duration-500 mt-[-1.25rem]'
                    : 'w-0.5 h-8 ml-5 rounded-full transition-colors duration-500'
                )}
                style={{ backgroundColor: isCompleted ? '#10B981' : '#E2E8F0' }}
              />
            )}

            {/* Vertical label */}
            {orientation === 'vertical' && (
              <div className="ml-4 pb-8">
                <p className={cn('text-sm font-semibold', isActive ? 'text-blue-600' : isCompleted ? 'text-emerald-600' : 'text-slate-500')}>
                  {step.label}
                </p>
                {step.sublabel && <p className="text-xs text-slate-400 mt-0.5">{step.sublabel}</p>}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
