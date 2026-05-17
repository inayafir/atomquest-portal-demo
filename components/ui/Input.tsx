import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'

export function Field({ children, className }: { children: React.ReactNode; className?: string }) {
  return <motion.div className={cn('space-y-1', className)}>{children}</motion.div>
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white',
        'placeholder:text-white/30 transition-all duration-200',
        'focus:border-accent/50 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-accent/20',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white resize-none',
      'placeholder:text-white/30 transition-all duration-200',
      'focus:border-accent/50 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-accent/20',
      className
    )}
    {...props}
  />
))
Textarea.displayName = 'Textarea'

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'w-full rounded-xl border border-white/10 bg-elevated px-4 py-2.5 text-sm text-white',
        'focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
)
Select.displayName = 'Select'

export function Label({
  children,
  className,
  required,
}: {
  children: React.ReactNode
  className?: string
  required?: boolean
}) {
  return (
    <label className={cn('mb-1.5 block text-xs font-medium text-white/50', className)}>
      {children}
      {required && <span className="ml-0.5 text-danger">*</span>}
    </label>
  )
}
