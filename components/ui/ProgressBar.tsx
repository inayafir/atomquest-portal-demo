'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export function ProgressBar({
  value,
  max = 100,
  label,
  hint,
  variant = 'default',
}: {
  value: number
  max?: number
  label?: string
  hint?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
}) {
  const pct = Math.min((value / max) * 100, 100)
  const barColor = {
    default: 'from-accent to-cyan',
    success: 'from-success to-mint',
    warning: 'from-warning to-amber-400',
    danger: 'from-danger to-rose-400',
  }[variant]

  const textColor = {
    default: value > max ? 'text-danger' : value === max ? 'text-success' : 'text-cyan',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
  }[variant]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-2"
    >
      {(label || hint) && (
        <motion.div className="flex items-end justify-between gap-4">
          {label && <span className="text-sm font-medium text-white/70">{label}</span>}
          <span className={cn('text-lg font-semibold tabular-nums', textColor)}>
            {value}% <span className="text-sm font-normal text-white/30">/ {max}%</span>
          </span>
        </motion.div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className={cn('h-full rounded-full bg-gradient-to-r', barColor)}
        />
      </div>
      {hint && <p className="text-xs text-white/35">{hint}</p>}
    </motion.div>
  )
}
