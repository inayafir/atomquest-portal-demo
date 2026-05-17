'use client'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { PageHeader } from '@/components/ui/PageHeader'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'

type AuditLog = {
  id: string
  table_name: string
  record_id: string
  change_type: string
  created_at: string
}

const PAGE_SIZE = 20

export default function AdminAuditPage() {
  const supabase = createClient()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)

  useEffect(() => {
    loadLogs()
  }, [page])

  async function loadLogs() {
    setLoading(true)
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    setLogs(data || [])
    setLoading(false)
  }

  if (loading && logs.length === 0) return <LoadingScreen message="Loading audit log..." />

  return (
    <motion.div>
      <PageHeader title="Audit Log" subtitle="Full history of system changes" />

      {logs.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No audit entries yet"
          description="Changes to goals and approvals will appear here."
        />
      ) : (
        <>
          <Card padding="none" className="overflow-hidden">
            <motion.div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="px-6 py-4 text-left font-medium text-white/50">Time</th>
                    <th className="px-6 py-4 text-left font-medium text-white/50">Table</th>
                    <th className="px-6 py-4 text-left font-medium text-white/50">Change</th>
                    <th className="px-6 py-4 text-left font-medium text-white/50">Record ID</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-white/[0.04] font-mono text-xs"
                    >
                      <td className="px-6 py-4 text-white/60">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-accent-bright">{log.table_name}</td>
                      <td className="px-6 py-4">
                        <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-white/70">
                          {log.change_type || 'CHANGE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white/40 truncate max-w-[200px]">
                        {log.record_id}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </Card>

          <motion.div className="mt-6 flex items-center justify-center gap-4">
            <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-sm text-white/40">Page {page + 1}</span>
            <Button
              variant="secondary"
              size="sm"
              disabled={logs.length < PAGE_SIZE}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}
