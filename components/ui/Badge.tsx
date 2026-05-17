import { cn, formatStatus } from '@/lib/utils'

const statusStyles: Record<string, string> = {
  approved: 'bg-success/15 text-success border-success/30',
  submitted: 'bg-cyan/15 text-cyan border-cyan/30',
  returned: 'bg-danger/15 text-danger border-danger/30',
  draft: 'bg-white/5 text-white/50 border-white/10',
  on_track: 'bg-cyan/15 text-cyan border-cyan/30',
  completed: 'bg-success/15 text-success border-success/30',
  not_started: 'bg-white/5 text-white/40 border-white/10',
}

export function Badge({
  status,
  className,
  pulse,
}: {
  status: string
  className?: string
  pulse?: boolean
}) {
  const key = status.toLowerCase().replace(' ', '_')
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        statusStyles[key] ?? 'bg-white/5 text-white/60 border-white/10',
        pulse && 'animate-pulse',
        className
      )}
    >
      {pulse && (
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      )}
      {formatStatus(status)}
    </span>
  )
}
