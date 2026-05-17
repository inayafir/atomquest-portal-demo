'use client'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { PageHeader } from '@/components/ui/PageHeader'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { TabGroup } from '@/components/ui/TabGroup'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { ClipboardList, MessageSquare, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

type Employee = { id: string; full_name: string; email: string }
type Goal = {
  id: string
  title: string
  thrust_area: string
  uom_type: string
  target_value: number | null
  weightage: number
}
type Achievement = {
  id: string
  goal_id: string
  quarter: string
  actual_value: number | null
  status: string
  employee_notes: string
  computed_score: number | null
}
type Comment = { id: string; achievement_id: string; comment: string; created_at: string }

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const

export default function ManagerCheckinsPage() {
  const supabase = createClient()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selected, setSelected] = useState<Employee | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [achievements, setAchievements] = useState<Record<string, Record<string, Achievement>>>({})
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [activeQuarter, setActiveQuarter] = useState<string>('Q1')
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    loadTeam()
  }, [])

  async function loadTeam() {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data: team } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('manager_id', user.id)

    setEmployees(team || [])
    setLoading(false)
  }

  async function loadEmployee(emp: Employee) {
    setSelected(emp)
    setGoals([])
    setAchievements({})
    setComments({})

    const { data: cycle } = await supabase.from('cycles').select('id').eq('is_active', true).single()
    if (!cycle) return

    const { data: sheet } = await supabase
      .from('goal_sheets')
      .select('id')
      .eq('employee_id', emp.id)
      .eq('cycle_id', cycle.id)
      .single()
    if (!sheet) return

    const { data: goalsData } = await supabase
      .from('goals')
      .select('*')
      .eq('goal_sheet_id', sheet.id)
      .order('created_at')
    setGoals(goalsData || [])
    if (!goalsData?.length) return

    const { data: achData } = await supabase
      .from('achievements')
      .select('*')
      .in(
        'goal_id',
        goalsData.map((g: Goal) => g.id)
      )

    const achMap: Record<string, Record<string, Achievement>> = {}
    achData?.forEach((a: Achievement) => {
      if (!achMap[a.goal_id]) achMap[a.goal_id] = {}
      achMap[a.goal_id][a.quarter] = a
    })
    setAchievements(achMap)

    const { data: commentsData } = await supabase
      .from('checkin_comments')
      .select('*')
      .eq('goal_sheet_id', sheet.id)
      .order('created_at')

    const commMap: Record<string, Comment[]> = {}
    commentsData?.forEach((c: Comment) => {
      if (!commMap[c.achievement_id]) commMap[c.achievement_id] = []
      commMap[c.achievement_id].push(c)
    })
    setComments(commMap)
  }

  async function handleAddComment(goal: Goal, achievement: Achievement) {
    const key = `${goal.id}-${activeQuarter}`
    const text = commentText[key]?.trim()
    if (!text) return

    setSaving(key)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: cycle } = await supabase.from('cycles').select('id').eq('is_active', true).single()
    const { data: sheet } = await supabase
      .from('goal_sheets')
      .select('id')
      .eq('employee_id', selected!.id)
      .eq('cycle_id', cycle!.id)
      .single()

    const { data: newComment } = await supabase
      .from('checkin_comments')
      .insert({
        achievement_id: achievement.id,
        goal_sheet_id: sheet?.id,
        manager_id: user?.id,
        quarter: activeQuarter,
        comment: text,
      })
      .select()
      .single()

    if (newComment) {
      setComments((prev) => ({
        ...prev,
        [achievement.id]: [...(prev[achievement.id] || []), newComment],
      }))
    }
    setCommentText((prev) => ({ ...prev, [key]: '' }))
    setSaving(null)
  }

  if (loading) return <LoadingScreen message="Loading team..." />

  return (
    <motion.div>
      <PageHeader
        title="Check-ins"
        subtitle="Review team progress and add coaching comments"
      />

      <motion.div className="mb-8 flex flex-wrap gap-2">
        {employees.map((emp) => (
          <button
            key={emp.id}
            type="button"
            onClick={() => loadEmployee(emp)}
            className={cn(
              'rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200',
              selected?.id === emp.id
                ? 'bg-gradient-to-r from-accent to-accent-bright text-white shadow-lg shadow-accent/25'
                : 'glass text-white/60 hover:text-white hover:bg-white/[0.06]'
            )}
          >
            {emp.full_name}
          </button>
        ))}
      </motion.div>

      {!selected && (
        <EmptyState
          icon={Users}
          title="Select a team member"
          description="Choose someone above to review their quarterly check-ins."
        />
      )}

      {selected && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div className="mb-8">
            <TabGroup
              tabs={QUARTERS.map((q) => ({ id: q, label: q }))}
              active={activeQuarter}
              onChange={setActiveQuarter}
            />
          </motion.div>

          {goals.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No approved goals"
              description={`No approved goals found for ${selected.full_name}.`}
            />
          ) : (
            <motion.div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {goals.map((goal, i) => {
                  const achievement = achievements[goal.id]?.[activeQuarter]
                  const key = `${goal.id}-${activeQuarter}`
                  const goalComments = achievement ? comments[achievement.id] || [] : []

                  return (
                    <motion.div
                      key={goal.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Card padding="md">
                        <motion.div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <motion.div>
                            <p className="text-xs font-medium text-accent-bright">{goal.thrust_area}</p>
                            <h3 className="mt-1 font-medium text-white">{goal.title}</h3>
                            <p className="mt-1 text-xs text-white/40">
                              Target: {goal.target_value ?? '—'} · {goal.weightage}% weight
                            </p>
                          </motion.div>
                          {achievement?.computed_score != null && (
                            <ScoreRing score={achievement.computed_score} size={52} />
                          )}
                        </motion.div>

                        <motion.div className="mt-6 grid gap-4 sm:grid-cols-2">
                          <motion.div className="rounded-xl bg-white/[0.03] p-4">
                            <p className="text-[10px] uppercase tracking-wider text-white/35">Target</p>
                            <p className="mt-1 text-lg font-semibold text-white">
                              {goal.target_value ?? '—'}
                            </p>
                          </motion.div>
                          <motion.div className="rounded-xl bg-white/[0.03] p-4">
                            <p className="text-[10px] uppercase tracking-wider text-white/35">
                              Actual ({activeQuarter})
                            </p>
                            <p className="mt-1 text-lg font-semibold text-cyan">
                              {achievement?.actual_value ?? 'Not logged'}
                            </p>
                          </motion.div>
                        </motion.div>

                        {achievement?.employee_notes && (
                          <p className="mt-4 text-sm text-white/50 rounded-xl bg-white/[0.02] p-3">
                            {achievement.employee_notes}
                          </p>
                        )}

                        {goalComments.map((c) => (
                          <motion.div
                            key={c.id}
                            className="mt-3 flex gap-3 rounded-xl border border-cyan/20 bg-cyan/5 p-3"
                          >
                            <MessageSquare className="h-4 w-4 shrink-0 text-cyan" />
                            <p className="text-sm text-white/60">{c.comment}</p>
                          </motion.div>
                        ))}

                        {achievement ? (
                          <motion.div className="mt-4 flex gap-2">
                            <Input
                              value={commentText[key] || ''}
                              onChange={(e) =>
                                setCommentText((prev) => ({ ...prev, [key]: e.target.value }))
                              }
                              placeholder="Add a comment..."
                              onKeyDown={(e) =>
                                e.key === 'Enter' && handleAddComment(goal, achievement)
                              }
                              className="flex-1"
                            />
                            <Button
                              onClick={() => handleAddComment(goal, achievement)}
                              loading={saving === key}
                            >
                              Add
                            </Button>
                          </motion.div>
                        ) : (
                          <p className="mt-4 text-sm text-white/35">
                            Employee hasn&apos;t logged {activeQuarter} yet
                          </p>
                        )}
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
