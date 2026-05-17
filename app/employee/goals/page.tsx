'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input, Label, Select, Textarea } from '@/components/ui/Input'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { createClient } from '@/lib/supabase'
import { validateGoalSheet } from '@/lib/validations'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Lock, Plus, Send, Target, Trash2, Unlock } from 'lucide-react'
import { useEffect, useState } from 'react'

type Goal = {
  id: string
  thrust_area: string
  title: string
  description: string
  uom_type: string
  target_value: number
  target_date: string
  weightage: number
  is_locked: boolean
}

type GoalSheet = {
  id: string
  status: string
  manager_notes: string | null
}

const UOM_LABELS: Record<string, string> = {
  numeric_min: 'Higher is better',
  numeric_max: 'Lower is better',
  timeline: 'Timeline',
  zero: 'Zero target',
}

const THRUST_AREAS = [
  'Revenue Growth',
  'Customer Success',
  'Operational Efficiency',
  'People & Culture',
  'Innovation',
  'Compliance & Risk',
]

export default function EmployeeGoalsPage() {
  const supabase = createClient()

  const [goals, setGoals] = useState<Goal[]>([])
  const [sheet, setSheet] = useState<GoalSheet | null>(null)
  const [cycleId, setCycleId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [requestingRevision, setRequestingRevision] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const [form, setForm] = useState({
    thrust_area: THRUST_AREAS[0],
    title: '',
    description: '',
    uom_type: 'numeric_min',
    target_value: '',
    target_date: '',
    weightage: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: cycle } = await supabase
      .from('cycles')
      .select('id')
      .eq('is_active', true)
      .single()

    if (!cycle) { setLoading(false); return }
    setCycleId(cycle.id)

    const { data: existingSheet } = await supabase
      .from('goal_sheets')
      .select('*')
      .eq('employee_id', user.id)
      .eq('cycle_id', cycle.id)
      .single()

    if (existingSheet) {
      setSheet(existingSheet)
      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('goal_sheet_id', existingSheet.id)
        .order('created_at')
      setGoals(goalsData || [])
    }

    setLoading(false)
  }

  async function createSheetIfNeeded(): Promise<string | null> {
    if (sheet) return sheet.id
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !cycleId) return null

    const { data, error } = await supabase
      .from('goal_sheets')
      .insert({ employee_id: user.id, cycle_id: cycleId, status: 'draft' })
      .select()
      .single()

    if (error || !data) return null
    setSheet(data)
    return data.id
  }

  async function handleRequestRevision() {
    if (!sheet) return
    setRequestingRevision(true)

    await supabase
      .from('goal_sheets')
      .update({
        status: 'draft',
        submitted_at: null,
        approved_at: null,
        approved_by: null,
        manager_notes: null,
      })
      .eq('id', sheet.id)

    await supabase.from('goals').update({ is_locked: false }).eq('goal_sheet_id', sheet.id)

    setSheet((prev) => (prev ? { ...prev, status: 'draft', manager_notes: null } : prev))
    setGoals((prev) => prev.map((g) => ({ ...g, is_locked: false })))
    setRequestingRevision(false)
  }

  async function handleAddGoal() {
    if (!form.title || !form.weightage) {
      setErrors(['Please fill in all required fields'])
      return
    }

    const sheetId = await createSheetIfNeeded()
    if (!sheetId) return

    const { data, error } = await supabase
      .from('goals')
      .insert({
        goal_sheet_id: sheetId,
        thrust_area: form.thrust_area,
        title: form.title,
        description: form.description,
        uom_type: form.uom_type,
        target_value: form.target_value ? Number(form.target_value) : null,
        target_date: form.target_date || null,
        weightage: Number(form.weightage),
      })
      .select()
      .single()

    if (error) { setErrors([error.message]); return }

    setGoals((prev) => [...prev, data])
    setForm({
      thrust_area: THRUST_AREAS[0],
      title: '',
      description: '',
      uom_type: 'numeric_min',
      target_value: '',
      target_date: '',
      weightage: '',
    })
    setShowForm(false)
    setErrors([])
  }

  async function handleDeleteGoal(id: string) {
    await supabase.from('goals').delete().eq('id', id)
    setGoals((prev) => prev.filter((g) => g.id !== id))
  }

  async function handleSubmit() {
    if (goals.length === 0) {
      setErrors(['Please add at least one goal'])
      return
    }
    const validationErrors = validateGoalSheet(goals)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setSubmitting(true)
    await supabase
      .from('goal_sheets')
      .update({ status: 'submitted', submitted_at: new Date().toISOString() })
      .eq('id', sheet!.id)

    setSheet((prev) => (prev ? { ...prev, status: 'submitted' } : prev))
    setSubmitting(false)
    setErrors([])
  }

  const totalWeightage = goals.reduce((sum, g) => sum + Number(g.weightage), 0)
  const isLocked = sheet?.status === 'approved'
  const isSubmitted = sheet?.status === 'submitted'
  const isDraft = !sheet || sheet.status === 'draft' || sheet.status === 'returned'

  if (loading) return <LoadingScreen message="Loading your goals..." />

  return (
    <div>
      <PageHeader
        title="My Goals"
        subtitle="FY 2025-26 · Goal Setting Phase"
        action={
          <div className="flex flex-wrap items-center gap-3">
            {sheet?.status && <Badge status={sheet.status} pulse={sheet.status === 'submitted'} />}
            {isLocked && (
              <Button
                variant="secondary"
                size="sm"
                loading={requestingRevision}
                onClick={handleRequestRevision}
              >
                <Unlock className="h-4 w-4" />
                Request Revision
              </Button>
            )}
            {isDraft && (
              <Button
                size="sm"
                onClick={() => setShowForm(true)}
                disabled={goals.length >= 8}
              >
                <Plus className="h-4 w-4" />
                Add Goal
              </Button>
            )}
          </div>
        }
      />

      <AnimatePresence>
        {sheet?.status === 'returned' && sheet.manager_notes && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <Card className="border-danger/30 bg-danger/5" padding="md">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-danger" />
                <div>
                  <p className="text-sm font-medium text-danger">Returned by manager</p>
                  <p className="mt-1 text-sm text-white/60">{sheet.manager_notes}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {isLocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <Card className="border-success/30 bg-success/5" padding="md">
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                <div>
                  <p className="text-sm font-medium text-success">Goals approved and locked</p>
                  <p className="mt-0.5 text-xs text-white/45">
                    Click &quot;Request Revision&quot; to unlock and make changes.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="mb-8" padding="lg">
        <ProgressBar
          label="Total Weightage"
          value={totalWeightage}
          max={100}
          variant={totalWeightage === 100 ? 'success' : totalWeightage > 100 ? 'danger' : 'warning'}
          hint={`${goals.length}/8 goals · Min 10% per goal · Must total exactly 100%`}
        />
      </Card>

      {errors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3"
        >
          {errors.map((e, i) => (
            <p key={i} className="text-sm text-danger">{e}</p>
          ))}
        </motion.div>
      )}

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description='Click "Add Goal" to define your first quest for this cycle.'
          action={
            isDraft && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4" />
                Add Goal
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {goals.map((goal, i) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card variant="interactive" padding="md">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent-bright">
                          {goal.thrust_area}
                        </span>
                        <span className="text-xs text-white/35">{UOM_LABELS[goal.uom_type]}</span>
                        {goal.is_locked && (
                          <span className="flex items-center gap-1 text-xs text-white/35">
                            <Lock className="h-3 w-3" /> Locked
                          </span>
                        )}
                      </div>
                      <h3 className="font-medium text-white">{goal.title}</h3>
                      {goal.description && (
                        <p className="mt-1 text-sm text-white/45">{goal.description}</p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/40">
                        {goal.target_value != null && <span>Target: {goal.target_value}</span>}
                        {goal.target_date && <span>By: {goal.target_date}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={cn(
                        'text-2xl font-bold tabular-nums',
                        goal.weightage >= 10 ? 'text-cyan' : 'text-danger'
                      )}>
                        {goal.weightage}%
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-white/30">weight</span>
                      {isDraft && !goal.is_locked && (
                        <button
                          type="button"
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="mt-1 rounded-lg p-1.5 text-white/25 hover:bg-danger/10 hover:text-danger transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {goals.length > 0 && isDraft && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 flex justify-end"
        >
          <Button
            size="lg"
            onClick={handleSubmit}
            loading={submitting}
            disabled={totalWeightage !== 100}
          >
            <Send className="h-4 w-4" />
            Submit for Approval
          </Button>
        </motion.div>
      )}

      {isSubmitted && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 text-center text-sm text-white/45"
        >
          Goals submitted — awaiting manager approval
        </motion.p>
      )}

      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setErrors([]) }}
        title="Add New Goal"
        size="lg"
      >
        <div className="space-y-4">
          <Field>
            <Label>Thrust Area</Label>
            <Select
              value={form.thrust_area}
              onChange={(e) => setForm((p) => ({ ...p, thrust_area: e.target.value }))}
            >
              {THRUST_AREAS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label required>Goal Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Increase quarterly revenue by 15%"
            />
          </Field>
          <Field>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={2}
              placeholder="Additional context..."
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <Label required>Measurement Type</Label>
              <Select
                value={form.uom_type}
                onChange={(e) => setForm((p) => ({ ...p, uom_type: e.target.value }))}
              >
                <option value="numeric_min">Higher is better</option>
                <option value="numeric_max">Lower is better</option>
                <option value="timeline">Timeline</option>
                <option value="zero">Zero target</option>
              </Select>
            </Field>
            <Field>
              <Label required>Weightage (%)</Label>
              <Input
                type="number"
                value={form.weightage}
                onChange={(e) => setForm((p) => ({ ...p, weightage: e.target.value }))}
                placeholder="e.g. 25"
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {form.uom_type !== 'zero' && form.uom_type !== 'timeline' && (
              <Field>
                <Label>Target Value</Label>
                <Input
                  type="number"
                  value={form.target_value}
                  onChange={(e) => setForm((p) => ({ ...p, target_value: e.target.value }))}
                  placeholder="e.g. 100"
                />
              </Field>
            )}
            {form.uom_type === 'timeline' && (
              <Field>
                <Label>Target Date</Label>
                <Input
                  type="date"
                  value={form.target_date}
                  onChange={(e) => setForm((p) => ({ ...p, target_date: e.target.value }))}
                />
              </Field>
            )}
          </div>
          {errors.length > 0 && (
            <div className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
              {errors.map((e, i) => (
                <p key={i}>{e}</p>
              ))}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => { setShowForm(false); setErrors([]) }}
            >
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleAddGoal}>
              Add Goal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}