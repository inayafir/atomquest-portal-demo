'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function PageHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}
    >
      <motion.div>
        <h1 className="text-2xl font-semibold tracking-tight gradient-text sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-sm text-white/45 max-w-xl">{subtitle}</p>
        )}
      </motion.div>
      {action && <div className="flex shrink-0 items-center gap-3">{action}</div>}
    </motion.header>
  )
}
