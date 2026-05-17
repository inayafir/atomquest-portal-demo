'use client'

import { BackgroundMesh } from '@/components/BackgroundMesh'
import Sidebar from '@/components/Sidebar'
import { motion } from 'framer-motion'

type Role = 'employee' | 'manager' | 'admin'

export function AppShell({
  role,
  fullName,
  children,
}: {
  role: Role
  fullName: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <BackgroundMesh />
      <Sidebar role={role} fullName={fullName} />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex-1 overflow-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mx-auto max-w-6xl px-6 py-8 lg:px-10 lg:py-10"
        >
          {children}
        </motion.div>
      </motion.main>
    </div>
  )
}