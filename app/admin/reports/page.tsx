'use client'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { PageHeader } from '@/components/ui/PageHeader'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { BarChart3, Download } from 'lucide-react'
import { useEffect, useState } from 'react'

type Employee = { id: string; full_name: string; email: string }
type ScoreMap = Record<string, Record<string, number | null>>

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']

export default function AdminReportsPage() {
  const supabase = createClient()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [scoreMap, setScoreMap] = useState<ScoreMap>({})
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

    const { data: cycle } = await supabase
      .from('cycles')
      .select('id')
      .eq('is_active', true)
      .single()

    if (!cycle) {
      setLoading(false)
      return
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'employee')

    if (!profiles?.length) {
      setLoading(false)
      return
    }
    setEmployees(profiles)

    const { data: sheets } = await supabase
      .from('goal_sheets')
      .select('id, employee_id')
      .eq('cycle_id', cycle.id)
      .in(
        'employee_id',
        profiles.map((p) => p.id)
      )

    if (!sheets?.length) {
      setLoading(false)
      return
    }

    const sheetToEmployee: Record<string, string> = {}
    sheets.forEach((s) => {
      sheetToEmployee[s.id] = s.employee_id
    })

    const { data: goals } = await supabase
      .from('goals')
      .select('id, goal_sheet_id')
      .in('goal_sheet_id', sheets.map((s) => s.id))

    if (!goals?.length) {
      setLoading(false)
      return
    }

    const goalToSheet: Record<string, string> = {}
    goals.forEach((g) => {
      goalToSheet[g.id] = g.goal_sheet_id
    })

    const { data: achievements } = await supabase
      .from('achievements')
      .select('goal_id, quarter, computed_score')
      .in(
        'goal_id',
        goals.map((g) => g.id)
      )

    const accum: Record<string, Record<string, number[]>> = {}
    achievements?.forEach((a) => {
      const sheetId = goalToSheet[a.goal_id]
      const empId = sheetToEmployee[sheetId]
      if (!empId || a.computed_score === null) return
      if (!accum[empId]) accum[empId] = {}
      if (!accum[empId][a.quarter]) accum[empId][a.quarter] = []
      accum[empId][a.quarter].push(a.computed_score)
    })

    const map: ScoreMap = {}
    profiles.forEach((p) => {
      map[p.id] = {}
      QUARTERS.forEach((q) => {
        const scores = accum[p.id]?.[q]
        map[p.id][q] =
          scores && scores.length > 0
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : null
      })
    })

    setScoreMap(map)
    setLoading(false)
  }

  async function handleExport() {
    setExporting(true)
    const XLSX = await import('xlsx')

    const rows = employees.map((emp) => {
      const row: Record<string, string> = {
        Employee: emp.full_name,
        Email: emp.email,
      }
      QUARTERS.forEach((q) => {
        row[q] = scoreMap[emp.id]?.[q] != null ? `${scoreMap[emp.id][q]}%` : 'No data'
      })
      return row
    })

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Achievement Report')
    XLSX.writeFile(wb, 'AtomQuest_Report.xlsx')
    setExporting(false)
  }

  function cellClass(score: number | null) {
    if (score === null) return 'text-white/30'
    if (score >= 80) return 'text-success font-medium'
    if (score >= 50) return 'text-warning font-medium'
    return 'text-danger font-medium'
  }

  if (loading) return <LoadingScreen message="Loading reports..." />

  return (
    <motion.div>
      <PageHeader
        title="Reports"
        subtitle="Achievement scores by employee and quarter"
        action={
          <Button onClick={handleExport} loading={exporting} disabled={employees.length === 0}>
            <Download className="h-4 w-4" />
            Export to Excel
          </Button>
        }
      />

      {employees.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No employee data found"
          description="Scores will appear once employees log check-ins."
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <motion.div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="px-6 py-4 text-left font-medium text-white/50">Employee</th>
                  {QUARTERS.map((q) => (
                    <th key={q} className="px-6 py-4 text-center font-medium text-white/50">
                      {q}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, i) => (
                  <motion.tr
                    key={emp.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-white/[0.04]"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{emp.full_name}</p>
                      <p className="text-xs text-white/40">{emp.email}</p>
                    </td>
                    {QUARTERS.map((q) => {
                      const score = scoreMap[emp.id]?.[q] ?? null
                      return (
                        <td key={q} className="px-6 py-4 text-center">
                          <span className={cn('tabular-nums', cellClass(score))}>
                            {score !== null ? `${score}%` : '—'}
                          </span>
                        </td>
                      )
                    })}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </Card>
      )}
    </motion.div>
  )
}
