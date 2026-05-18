'use client'

import { cn } from '@/lib/utils'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { forwardRef } from 'react'
import React from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-accent to-accent-bright text-white shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:brightness-110',
  secondary:
    'glass text-white/90 hover:bg-white/[0.08] hover:border-white/20',
  ghost: 'text-white/70 hover:text-white hover:bg-white/[0.06]',
  danger: 'bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25',
  success:
    'bg-success/15 text-success border border-success/30 hover:bg-success/25',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
}

type ButtonProps = HTMLMotionProps<'button'> & {
  variant?: Variant
  size?: Size
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading,
      disabled,
      children,
      ...props
    },
    ref
  ) => (
    <motion.button
      ref={ref}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
        'disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      )}
      {children as React.ReactNode}
    </motion.button>
  )
)
Button.displayName = 'Button'
