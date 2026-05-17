'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input, Textarea } from '@/components/ui/Input'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { PageHeader } from '@/components/ui/PageHeader'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, RotateCcw, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'

type Employee = {
  id: string
  full_name: string
  email: string
  department: string | null
}

type GoalSheet = {
  id: string
  status: string
  submitted_at: string | null
  employee_id: string
}

type Goal = {
  id: string
  thrust_area: string
  title: string
  description: string
  uom_type: string
  target_value: number | null
  target_date: string | null
  weightage: number
}

const UOM_LABELS: Record<string, string> = {
  numeric_min: 'Higher is better',
  numeric_max: 'Lower is better',
  timeline: 'Timeline',
  zero: 'Zero target',
}

export default function ManagerTeamPage() {
  const supabase = createClient()

  const [employees, setEmployees] = useState<Employee[]>([])
  const [sheets, setSheets] = useState<Record<string, GoalSheet>>({})
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Employee | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [loadingGoals, setLoadingGoals] = useState(false)
  const [managerNotes, setManagerNotes] = useState('')
  const [acting, setActing] = useState(false)
  const [editingGoal, setEditingGoal] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})

  useEffect(() => {
    loadTeam()
  }, [])

  async function loadTeam() {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data: teamMembers } = await supabase
      .from('profiles')
      .select('*')
      .eq('manager_id', user.id)

    if (!teamMembers || teamMembers.length === 0) {
      setLoading(false)
      return
    }
    setEmployees(teamMembers)

    const { data: cycle } = await supabase
      .from('cycles')
      .select('id')
      .eq('is_active', true)
      .single()

    if (!cycle) {
      setLoading(false)
      return
    }

    const { data: goalSheets } = await supabase
      .from('goal_sheets')
      .select('*')
      .in(
        'employee_id',
        teamMembers.map((e: Employee) => e.id)
      )
      .eq('cycle_id', cycle.id)

    const sheetsMap: Record<string, GoalSheet> = {}
    goalSheets?.forEach((s: GoalSheet) => {
      sheetsMap[s.employee_id] = s
    })
    setSheets(sheetsMap)
    setLoading(false)
  }

  async function openEmployee(employee: Employee) {
    setSelected(employee)
    setManagerNotes('')
    setEditingGoal(null)
    setLoadingGoals(true)

    const sheet = sheets[employee.id]
    if (!sheet) {
      setLoadingGoals(false)
      return
    }

    const { data: goalsData } = await supabase
      .from('goals')
      .select('*')
      .eq('goal_sheet_id', sheet.id)
      .order('created_at')

    setGoals(goalsData || [])
    setLoadingGoals(false)
  }

  async function handleApprove() {
    const sheet = sheets[selected!.id]
    if (!sheet) return
    setActing(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    await supabase
      .from('goal_sheets')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user?.id,
        manager_notes: managerNotes || null,
      })
      .eq('id', sheet.id)

    await supabase.from('goals').update({ is_locked: true }).eq('goal_sheet_id', sheet.id)

    setSheets((prev) => ({
      ...prev,
      [selected!.id]: { ...sheet, status: 'approved' },
    }))
    setActing(false)
    setSelected(null)
  }

  async function handleReturn() {
    const sheet = sheets[selected!.id]
    if (!sheet || !managerNotes) return
    setActing(true)

    await supabase
      .from('goal_sheets')
      .update({ status: 'returned', manager_notes: managerNotes })
      .eq('id', sheet.id)

    setSheets((prev) => ({
      ...prev,
      [selected!.id]: { ...sheet, status: 'returned' },
    }))
    setActing(false)
    setSelected(null)
  }

  async function handleSaveGoalEdit(goalId: string) {
    const updates: Record<string, number> = {}
    if (editValues.target_value) updates.target_value = Number(editValues.target_value)
    if (editValues.weightage) updates.weightage = Number(editValues.weightage)

    await supabase.from('goals').update(updates).eq('id', goalId)
    setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, ...updates } : g)))
    setEditingGoal(null)
  }

  if (loading) return <LoadingScreen message="Loading your team..." />

  return (
    <div>
      <PageHeader title="My Team" subtitle="Review and approve goal sheets" />

      {employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No direct reports found"
          description="Team members assigned to you will appear here."
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="px-6 py-4 text-left font-medium text-white/50">Employee</th>
                  <th className="px-6 py-4 text-left font-medium text-white/50">Department</th>
                  <th className="px-6 py-4 text-left font-medium text-white/50">Status</th>
                  <th className="px-6 py-4 text-left font-medium text-white/50">Submitted</th>
                  <th className="px-6 py-4 text-right font-medium text-white/50">Action</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, i) => {
                  const sheet = sheets[emp.id]
                  return (
                    <motion.tr
                      key={emp.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-white">{emp.full_name}</p>
                        <p className="text-xs text-white/40">{emp.email}</p>
                      </td>
                      <td className="px-6 py-4 text-white/60">{emp.department || '—'}</td>
                      <td className="px-6 py-4">
                        {sheet ? (
                          <Badge status={sheet.status} pulse={sheet.status === 'submitted'} />
                        ) : (
                          <span className="text-white/30">No sheet</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-white/50">
                        {sheet?.submitted_at
                          ? new Date(sheet.submitted_at).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {sheet?.status === 'submitted' && (
                          <Button size="sm" onClick={() => openEmployee(emp)}>
                            Review →
                          </Button>
                        )}
                        {sheet?.status === 'approved' && (
                          <Button variant="ghost" size="sm" onClick={() => openEmployee(emp)}>
                            View
                          </Button>
                        )}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-void/70 backdrop-blur-sm"
              onClick={() => setSelected(null)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-white/10 bg-ink/95 backdrop-blur-2xl shadow-2xl"
            >
              <motion.div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                <motion.div>
                  <h2 className="text-lg font-semibold text-white">{selected.full_name}&apos;s Goals</h2>
                  <p className="text-xs text-white/40">
                    {sheets[selected.id]?.status === 'approved'
                      ? 'Approved'
                      : 'Awaiting your review'}
                  </p>
                </motion.div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-lg p-2 text-white/40 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </motion.div>

              <motion.div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loadingGoals ? (
                  <LoadingScreen message="Loading goals..." />
                ) : goals.length === 0 ? (
                  <p className="text-center text-white/40 py-12">No goals found</p>
                ) : (
                  goals.map((goal) => (
                    <Card key={goal.id} padding="md">
                      <div className="mb-2 flex flex-wrap gap-2 text-xs">
                        <span className="text-accent-bright">{goal.thrust_area}</span>
                        <span className="text-white/30">{UOM_LABELS[goal.uom_type]}</span>
                      </div>
                      <h3 className="font-medium text-white">{goal.title}</h3>
                      {goal.description && (
                        <p className="mt-1 text-sm text-white/45">{goal.description}</p>
                      )}
                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-xs text-white/40">
                          {goal.target_value != null && <span>Target: {goal.target_value}</span>}
                          {goal.target_date && <span className="ml-2">By: {goal.target_date}</span>}
                        </div>
                        <div className="text-right">
                          {editingGoal === goal.id ? (
                            <Input
                              value={editValues.weightage}
                              onChange={(e) =>
                                setEditValues((p) => ({ ...p, weightage: e.target.value }))
                              }
                              className="w-16 text-right"
                            />
                          ) : (
                            <span className="text-lg font-bold text-cyan">{goal.weightage}%</span>
                          )}
                          <p className="text-[10px] text-white/30">weight</p>
                        </div>
                      </div>
                      {sheets[selected.id]?.status === 'submitted' && (
                        <div className="mt-3 flex gap-2">
                          {editingGoal === goal.id ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleSaveGoalEdit(goal.id)}
                                className="text-xs text-success hover:underline"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingGoal(null)}
                                className="text-xs text-white/40 hover:underline"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingGoal(goal.id)
                                setEditValues({
                                  target_value: String(goal.target_value ?? ''),
                                  weightage: String(goal.weightage),
                                })
                              }}
                              className="text-xs text-white/40 hover:text-accent-bright"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </motion.div>

              {sheets[selected.id]?.status === 'submitted' && (
                <div className="border-t border-white/10 p-6 space-y-4">
                  <Field>
                    <Textarea
                      value={managerNotes}
                      onChange={(e) => setManagerNotes(e.target.value)}
                      placeholder="Add notes (required to return, optional to approve)..."
                      rows={2}
                    />
                  </Field>
                  <motion.div className="flex gap-3">
                    <Button
                      variant="danger"
                      className="flex-1"
                      onClick={handleReturn}
                      disabled={!managerNotes || acting}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Return
                    </Button>
                    <Button className="flex-1" onClick={handleApprove} loading={acting}>
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                  </motion.div>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
