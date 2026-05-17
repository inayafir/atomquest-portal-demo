'use client'

import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import { useEffect, useState } from 'react'

type Profile = {
  id: string
  full_name: string
  email: string
  role: string
  manager_id: string | null
  department: string | null
}

export default function AdminUsersPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Profile>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('*').order('full_name')
    setUsers(data || [])
    setLoading(false)
  }

  async function handleSave(id: string) {
    setSaving(true)
    await supabase
      .from('profiles')
      .update({
        role: editForm.role,
        manager_id: editForm.manager_id || null,
        department: editForm.department || null,
      })
      .eq('id', id)
    setSaving(false)
    setEditingId(null)
    loadUsers()
  }

  const managers = users.filter((u) => u.role === 'manager' || u.role === 'admin')

  if (loading) return <LoadingScreen message="Loading users..." />

  return (
    <motion.div>
      <PageHeader title="Users" subtitle="Manage roles and reporting relationships" />

      <Card padding="none" className="overflow-hidden">
        <motion.div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="px-6 py-4 text-left font-medium text-white/50">Name</th>
                <th className="px-6 py-4 text-left font-medium text-white/50">Role</th>
                <th className="px-6 py-4 text-left font-medium text-white/50">Manager</th>
                <th className="px-6 py-4 text-left font-medium text-white/50">Department</th>
                <th className="px-6 py-4 text-right font-medium text-white/50">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02]"
                >
                  <td className="px-6 py-4">
                    <p className="font-medium text-white">{user.full_name}</p>
                    <p className="text-xs text-white/40">{user.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    {editingId === user.id ? (
                      <Select
                        value={editForm.role}
                        onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}
                      >
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </Select>
                    ) : (
                      <Badge status={user.role} />
                    )}
                  </td>
                  <td className="px-6 py-4 text-white/60">
                    {editingId === user.id ? (
                      <Select
                        value={editForm.manager_id || ''}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, manager_id: e.target.value || null }))
                        }
                      >
                        <option value="">None</option>
                        {managers
                          .filter((m) => m.id !== user.id)
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.full_name}
                            </option>
                          ))}
                      </Select>
                    ) : (
                      users.find((u) => u.id === user.manager_id)?.full_name || '—'
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === user.id ? (
                      <input
                        value={editForm.department || ''}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, department: e.target.value }))
                        }
                        className="w-32 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-sm text-white"
                        placeholder="Department"
                      />
                    ) : (
                      <span className="text-white/60">{user.department || '—'}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingId === user.id ? (
                      <motion.div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="text-xs text-white/40 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSave(user.id)}
                          disabled={saving}
                          className="text-xs font-medium text-accent-bright hover:underline"
                        >
                          Save
                        </button>
                      </motion.div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(user.id)
                          setEditForm(user)
                        }}
                        className="text-xs text-white/40 hover:text-accent-bright"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </Card>

      {users.length === 0 && (
        <motion.div className="mt-8">
          <EmptyState icon={Users} title="No users found" />
        </motion.div>
      )}
    </motion.div>
  )
}
