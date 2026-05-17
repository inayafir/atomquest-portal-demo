'use client'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import {
  Atom,
  BarChart3,
  ClipboardList,
  LogOut,
  RefreshCw,
  Search,
  Target,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'

type Role = 'employee' | 'manager' | 'admin'

const navItems: Record<Role, { label: string; href: string; icon: LucideIcon }[]> = {
  employee: [
    { label: 'My Goals', href: '/employee/goals', icon: Target },
    { label: 'Check-ins', href: '/employee/checkins', icon: ClipboardList },
  ],
  manager: [
    { label: 'My Team', href: '/manager/team', icon: Users },
    { label: 'Check-ins', href: '/manager/checkins', icon: ClipboardList },
  ],
  admin: [
    { label: 'Cycles', href: '/admin/cycles', icon: RefreshCw },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
    { label: 'Audit Log', href: '/admin/audit', icon: Search },
  ],
}

export default function Sidebar({
  role,
  fullName,
}: {
  role: Role
  fullName: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  console.log('Sidebar role received:', JSON.stringify(role))
  const items = navItems[role] ?? []

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const roleLabel = {
    employee: 'Employee',
    manager: 'Manager',
    admin: 'Administrator',
  }[role]

  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <aside className="sticky top-0 flex h-screen w-[260px] shrink-0 flex-col border-r border-white/[0.06] bg-ink/80 backdrop-blur-2xl">
      {/* Logo — was closing as </motion.div> but opened as <div> */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-6">
        <motion.div
          whileHover={{ rotate: 180 }}
          transition={{ duration: 0.5 }}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-cyan shadow-lg shadow-accent/30"
        >
          <Atom className="h-5 w-5 text-white" />
        </motion.div>
        <div>
          <p className="text-sm font-semibold tracking-tight text-white">AtomQuest</p>
          <p className="text-[10px] font-medium uppercase tracking-widest text-white/35">
            Portal
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        {items.map((item, i) => {
          const active = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={item.href}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  active
                    ? 'text-white'
                    : 'text-white/45 hover:text-white/80 hover:bg-white/[0.04]'
                )}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-accent/20 to-cyan/10 border border-accent/20"
                    transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                  />
                )}
                <Icon
                  className={cn(
                    'relative z-10 h-4 w-4 transition-colors',
                    active ? 'text-accent-bright' : 'text-white/40 group-hover:text-white/60'
                  )}
                />
                <span className="relative z-10">{item.label}</span>
              </Link>
            </motion.div>
          )
        })}
      </nav>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="border-t border-white/[0.06] p-4"
      >
        {/* User info — was closing as </motion.div> but opened as <div> */}
        <div className="mb-3 flex items-center gap-3 rounded-xl glass px-3 py-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent/40 to-cyan/30 text-xs font-bold text-white"
          >
            {initials}
          </motion.div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{fullName}</p>
            <p className="text-xs text-white/40">{roleLabel}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/40 transition-colors hover:bg-white/[0.04] hover:text-white/70"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </motion.div>
    </aside>
  )
}