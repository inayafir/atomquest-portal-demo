'use client'

import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const [status, setStatus] = useState('Authenticating...')

  useEffect(() => {
    async function redirect() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile) {
        window.location.href = '/login'
        return
      }

      if (profile.role === 'admin') {
        setStatus('Opening admin console...')
        window.location.href = '/admin/cycles'
      } else if (profile.role === 'manager') {
        setStatus('Loading your team...')
        window.location.href = '/manager/team'
      } else {
        setStatus('Loading your goals...')
        window.location.href = '/employee/goals'
      }
    }
    redirect()
  }, [])

  return (
    <motion.div className="flex min-h-screen flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <LoadingScreen message={status} />
      </motion.div>
    </motion.div>
  )
}
