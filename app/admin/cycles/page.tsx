'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input, Label } from '@/components/ui/Input'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Calendar, Plus, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'

type Cycle = {
  id: string
  name: string
  goal_setting_opens: string
  q1_opens: string
  q2_opens: string
  q3_opens: string
  q4_opens: string
  is_active: boolean
}

const empty = {
  name: '',
  goal_setting_opens: '',
  q1_opens: '',
  q2_opens: '',
  q3_opens: '',
  q4_opens: '',
}

const dateFields = [
  { key: 'goal_setting_opens' as const, label: 'Goal Setting Opens' },
  { key: 'q1_opens' as const, label: 'Q1 Opens' },
  { key: 'q2_opens' as const, label: 'Q2 Opens' },
  { key: 'q3_opens' as const, label: 'Q3 Opens' },
  { key: 'q4_opens' as const, label: 'Q4 Opens' },
]

export default function AdminCyclesPage() {
  const supabase = createClient()
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCycles()
  }, [])

  async function loadCycles() {
    const { data } = await supabase.from('cycles').select('*').order('created_at', { ascending: false })
    setCycles(data || [])
    setLoading(false)
  }

  async function handleCreate() {
    setSaving(true)
    await supabase.from('cycles').insert({ ...form, is_active: false })
    setForm(empty)
    setShowForm(false)
    setSaving(false)
    loadCycles()
  }

  async function toggleActive(cycle: Cycle) {
    await supabase.from('cycles').update({ is_active: false }).neq('id', '')
    await supabase.from('cycles').update({ is_active: !cycle.is_active }).eq('id', cycle.id)
    loadCycles()
  }

  if (loading) return <LoadingScreen message="Loading cycles..." />

  return (
    <motion.div>
      <PageHeader
        title="Goal Cycles"
        subtitle="Manage goal-setting windows and quarterly check-in dates"
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            New Cycle
          </Button>
        }
      />

      {cycles.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No cycles yet"
          description="Create your first performance cycle to get started."
          action={
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />
              New Cycle
            </Button>
          }
        />
      ) : (
        <motion.div className="grid gap-4 md:grid-cols-2">
          {cycles.map((cycle, i) => (
            <motion.div
              key={cycle.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card padding="md" className={cycle.is_active ? 'border-accent/40 glow-accent' : ''}>
                <motion.div className="flex items-start justify-between gap-4">
                  <motion.div>
                    <motion.div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{cycle.name}</h3>
                      {cycle.is_active && <Badge status="approved" />}
                    </motion.div>
                    <motion.div className="mt-4 space-y-1.5 text-xs text-white/45">
                      <p>Goal Setting: {cycle.goal_setting_opens || '—'}</p>
                      <p>Q1: {cycle.q1_opens || '—'} · Q2: {cycle.q2_opens || '—'}</p>
                      <p>Q3: {cycle.q3_opens || '—'} · Q4: {cycle.q4_opens || '—'}</p>
                    </motion.div>
                  </motion.div>
                  <Button
                    variant={cycle.is_active ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => toggleActive(cycle)}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {cycle.is_active ? 'Deactivate' : 'Set Active'}
                  </Button>
                </motion.div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Cycle" size="lg">
        <motion.div className="space-y-4">
          <Field>
            <Label required>Cycle Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. FY 2026-27"
            />
          </Field>
          {dateFields.map(({ key, label }) => (
            <Field key={key}>
              <Label>{label}</Label>
              <Input
                type="date"
                value={form[key]}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
              />
            </Field>
          ))}
          <motion.div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleCreate} loading={saving}>
              Create Cycle
            </Button>
          </motion.div>
        </motion.div>
      </Modal>
    </motion.div>
  )
}
