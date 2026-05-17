'use client'

import { cn } from '@/lib/utils'
import { motion, type HTMLMotionProps } from 'framer-motion'

type CardProps = HTMLMotionProps<'div'> & {
  variant?: 'default' | 'strong' | 'interactive'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function Card({
  className,
  variant = 'default',
  padding = 'md',
  children,
  ...props
}: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'rounded-2xl',
        variant === 'default' && 'glass',
        variant === 'strong' && 'glass-strong',
        variant === 'interactive' &&
          'glass hover:bg-white/[0.06] hover:border-white/15 transition-all duration-300 cursor-pointer',
        paddingMap[padding],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
