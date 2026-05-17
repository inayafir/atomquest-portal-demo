'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input, Label, Select, Textarea } from '@/components/ui/Input'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { PageHeader } from '@/components/ui/PageHeader'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { TabGroup } from '@/components/ui/TabGroup'
import { computeScore } from '@/lib/scoring'
import { createClient } from '@/lib/supabase'
import { AnimatePresence, motion } from 'framer-motion'
import { ClipboardList, MessageSquare, Pencil, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'

type Goal = {
  id: string
  title: string
  thrust_area: string
  uom_type: string
  target_value: number | null
  target_date: string | null
  weightage: number
}

type Achievement = {
  id?: string
  goal_id: string
  quarter: string
  actual_value: number | null
  actual_date: string | null
  status: string
  employee_notes: string
  computed_score: number | null
}

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const

export default function EmployeeCheckinsPage() {
  const supabase = createClient()

  const [goals, setGoals] = useState<Goal[]>([])
  const [achievements, setAchievements] = useState<Record<string, Record<string, Achievement>>>({})
  const [managerComments, setManagerComments] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [activeQuarter, setActiveQuarter] = useState<string>('Q1')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Achievement>>({})

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data: cycle } = await supabase
      .from('cycles')
      .select('id')
      .eq('is_active', true)
      .single()

    if (!cycle) {
      setLoading(false)
      return
    }

    const { data: sheet } = await supabase
      .from('goal_sheets')
      .select('id, status')
      .eq('employee_id', user.id)
      .eq('cycle_id', cycle.id)
      .single()

    if (!sheet || sheet.status !== 'approved') {
      setLoading(false)
      return
    }

    const { data: goalsData } = await supabase
      .from('goals')
      .select('*')
      .eq('goal_sheet_id', sheet.id)
      .order('created_at')

    setGoals(goalsData || [])

    const goalIds = (goalsData || []).map((g: Goal) => g.id)

    const { data: achievementsData } = await supabase
      .from('achievements')
      .select('*')
      .in('goal_id', goalIds)

    const map: Record<string, Record<string, Achievement>> = {}
    achievementsData?.forEach((a: Achievement) => {
      if (!map[a.goal_id]) map[a.goal_id] = {}
      map[a.goal_id][a.quarter] = a
    })
    setAchievements(map)

    const achievementIds =
      achievementsData?.map((a: Achievement) => a.id).filter(Boolean) || []

    const { data: commentRows } = await supabase
      .from('checkin_comments')
      .select('achievement_id, comment, quarter')
      .in('achievement_id', achievementIds)

    const commentMap: Record<string, string> = {}
    achievementsData?.forEach((a: Achievement) => {
      const comment = commentRows?.find((c: { achievement_id: string }) => c.achievement_id === a.id)
      if (comment) {
        commentMap[`${a.goal_id}-${a.quarter}`] = comment.comment
      }
    })
    setManagerComments(commentMap)

    setLoading(false)
  }

  function startEdit(goal: Goal, quarter: string) {
    const existing = achievements[goal.id]?.[quarter]
    setEditingId(`${goal.id}-${quarter}`)
    setForm({
      goal_id: goal.id,
      quarter,
      actual_value: existing?.actual_value ?? null,
      actual_date: existing?.actual_date ?? null,
      status: existing?.status ?? 'on_track',
      employee_notes: existing?.employee_notes ?? '',
    })
  }

  async function handleSave(goal: Goal) {
    setSaving(`${goal.id}-${activeQuarter}`)

    const score = computeScore(
      goal.uom_type,
      goal.target_value ?? 0,
      form.actual_value ?? 0,
      goal.target_date ?? undefined,
      form.actual_date ?? undefined
    )

    const payload = {
      goal_id: goal.id,
      quarter: activeQuarter,
      actual_value: form.actual_value,
      actual_date: form.actual_date,
      status: form.status,
      employee_notes: form.employee_notes,
      computed_score: score,
      updated_at: new Date().toISOString(),
    }

    const existing = achievements[goal.id]?.[activeQuarter]

    if (existing?.id) {
      await supabase.from('achievements').update(payload).eq('id', existing.id)
    } else {
      await supabase.from('achievements').insert(payload)
    }

    setAchievements((prev) => ({
      ...prev,
      [goal.id]: {
        ...prev[goal.id],
        [activeQuarter]: {
          id: existing?.id,
          goal_id: goal.id,
          quarter: activeQuarter,
          actual_value: form.actual_value ?? null,
          actual_date: form.actual_date ?? null,
          status: form.status ?? 'on_track',
          employee_notes: form.employee_notes ?? '',
          computed_score: score,
        },
      },
    }))

    setEditingId(null)
    setSaving(null)
  }

  if (loading) return <LoadingScreen message="Loading check-ins..." />

  if (goals.length === 0) {
    return (
      <div>
        <PageHeader title="Check-ins" subtitle="Quarterly progress tracking" />
        <EmptyState
          icon={ClipboardList}
          title="No approved goals yet"
          description="Goals must be approved by your manager before you can log check-ins."
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Check-ins"
        subtitle="Log your quarterly progress against each goal"
      />

      <div className="mb-8">
        <TabGroup
          tabs={QUARTERS.map((q) => ({ id: q, label: q }))}
          active={activeQuarter}
          onChange={(q) => {
            setActiveQuarter(q)
            setEditingId(null)
          }}
        />
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {goals.map((goal, i) => {
            const achievement = achievements[goal.id]?.[activeQuarter]
            const isEditing = editingId === `${goal.id}-${activeQuarter}`
            const isSaving = saving === `${goal.id}-${activeQuarter}`
            const managerComment = managerComments[`${goal.id}-${activeQuarter}`]

            return (
              <motion.div
                key={goal.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card padding="md">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <motion.div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-accent-bright">{goal.thrust_area}</span>
                        <span className="text-xs text-white/30">{goal.weightage}% weight</span>
                      </motion.div>
                      <h3 className="font-medium text-white">{goal.title}</h3>
                      <p className="mt-1 text-xs text-white/40">
                        Target: {goal.target_value ?? goal.target_date ?? '—'}
                      </p>
                    </div>
                    {achievement?.computed_score != null && (
                      <ScoreRing score={achievement.computed_score} size={56} />
                    )}
                  </div>

                  {isEditing ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-6 space-y-4 border-t border-white/10 pt-6"
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        {goal.uom_type !== 'zero' && goal.uom_type !== 'timeline' && (
                          <Field>
                            <Label>Actual Value</Label>
                            <Input
                              type="number"
                              value={form.actual_value ?? ''}
                              onChange={(e) =>
                                setForm((p) => ({ ...p, actual_value: Number(e.target.value) }))
                              }
                              placeholder="Enter actual"
                            />
                          </Field>
                        )}
                        {goal.uom_type === 'timeline' && (
                          <Field>
                            <Label>Actual Date</Label>
                            <Input
                              type="date"
                              value={form.actual_date ?? ''}
                              onChange={(e) =>
                                setForm((p) => ({ ...p, actual_date: e.target.value }))
                              }
                            />
                          </Field>
                        )}
                        {goal.uom_type === 'zero' && (
                          <Field>
                            <Label>Actual Value (target: 0)</Label>
                            <Input
                              type="number"
                              value={form.actual_value ?? ''}
                              onChange={(e) =>
                                setForm((p) => ({ ...p, actual_value: Number(e.target.value) }))
                              }
                              placeholder="0 = 100% score"
                            />
                          </Field>
                        )}
                        <Field>
                          <Label>Status</Label>
                          <Select
                            value={form.status}
                            onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                          >
                            <option value="not_started">Not Started</option>
                            <option value="on_track">On Track</option>
                            <option value="completed">Completed</option>
                          </Select>
                        </Field>
                      </div>
                      <Field>
                        <Label>Notes</Label>
                        <Textarea
                          value={form.employee_notes}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, employee_notes: e.target.value }))
                          }
                          rows={2}
                          placeholder="Any context or blockers..."
                        />
                      </Field>
                      <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                        <Button onClick={() => handleSave(goal)} loading={!!isSaving}>
                          Save
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="mt-4">
                      {achievement ? (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="space-y-2">
                            <motion.div className="flex flex-wrap gap-3 text-sm text-white/60">
                              {achievement.actual_value !== null && (
                                <span>Actual: {achievement.actual_value}</span>
                              )}
                              {achievement.actual_date && <span>Date: {achievement.actual_date}</span>}
                            </motion.div>
                            <Badge status={achievement.status} />
                            {achievement.employee_notes && (
                              <p className="text-sm text-white/45">{achievement.employee_notes}</p>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => startEdit(goal, activeQuarter)}>
                            <Pencil className="h-4 w-4" />
                            Edit
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between rounded-xl border border-dashed border-white/10 py-6 px-4">
                          <p className="text-sm text-white/40">No data logged for {activeQuarter}</p>
                          <Button size="sm" onClick={() => startEdit(goal, activeQuarter)}>
                            <Plus className="h-4 w-4" />
                            Log progress
                          </Button>
                        </div>
                      )}

                      {managerComment && (
                        <div className="mt-4 flex gap-3 rounded-xl bg-cyan/5 border border-cyan/20 p-4">
                          <MessageSquare className="h-4 w-4 shrink-0 text-cyan" />
                          <div>
                            <p className="text-xs font-medium text-cyan">Manager comment</p>
                            <p className="mt-1 text-sm text-white/60">{managerComment}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
