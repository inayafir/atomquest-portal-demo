'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export function TabGroup<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[]
  active: T
  onChange: (id: T) => void
}) {
  return (
    <div className="inline-flex gap-1 rounded-xl glass p-1">
      {tabs.map((tab) => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              isActive ? 'text-white' : 'text-white/45 hover:text-white/70'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="tab-pill"
                className="absolute inset-0 rounded-lg bg-gradient-to-r from-accent/80 to-accent-bright/80 shadow-lg shadow-accent/20"
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}