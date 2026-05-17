'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export function ScoreRing({
  score,
  size = 48,
}: {
  score: number | null
  size?: number
}) {
  if (score === null || score === undefined) {
    return (
      <span className="text-xs text-white/30 font-mono">—</span>
    )
  }

  const rounded = Math.round(score)
  const color =
    rounded >= 80 ? 'text-success' : rounded >= 50 ? 'text-warning' : 'text-danger'
  const stroke =
    rounded >= 80 ? '#34d399' : rounded >= 50 ? '#fbbf24' : '#f87171'
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (rounded / 100) * circ

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={3}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <span className={cn('absolute text-xs font-semibold tabular-nums', color)}>
        {rounded}%
      </span>
    </div>
  )
}
