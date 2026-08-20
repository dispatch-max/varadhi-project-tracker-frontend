'use client'

import { useState } from 'react'
import { Loader2, UserPlus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { projectsApi } from '@/lib/api/projects.api'
import { useUsers, activeUsers } from '@/hooks/use-users'

/**
 * Adds a member to a project via the existing POST /projects/:id/members
 * endpoint. That endpoint already notifies the person added and the project
 * manager — no notification logic is added here.
 *
 * Render behind the same admin/manager gate as the rest of the project
 * actions: GET /users is Admin/Manager-only.
 */
export function AddProjectMember({ projectId, existingMemberIds = [], onAdded }) {
  const { users, isLoading: usersLoading, error: usersError, reload } = useUsers()
  const [selectedId, setSelectedId] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [status, setStatus] = useState(null)

  // Anyone already on the project is filtered out — adding them again is a
  // no-op server-side (ON CONFLICT DO NOTHING) and would notify nobody.
  const candidates = activeUsers(users).filter((u) => !existingMemberIds.includes(u.id))

  async function handleAdd() {
    if (!selectedId || isAdding) return

    setIsAdding(true)
    setStatus(null)
    try {
      await projectsApi.addMember(projectId, selectedId)
      setSelectedId('')
      setStatus({ type: 'success', text: 'Member added and notified.' })
      onAdded?.()
    } catch (err) {
      setStatus({
        type: 'error',
        text: err?.response?.data?.message || 'Could not add that member. Try again.',
      })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <Label htmlFor="addMember" className="text-sm font-semibold text-slate-700">
        Add a team member
      </Label>

      <div className="flex items-center gap-3 mt-2">
        <select
          id="addMember"
          value={selectedId}
          onChange={(e) => {
            setSelectedId(e.target.value)
            setStatus(null)
          }}
          disabled={isAdding || usersLoading || candidates.length === 0}
          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
        >
          <option value="">
            {usersLoading
              ? 'Loading users...'
              : candidates.length === 0
                ? 'Everyone is already on this project'
                : 'Select a person...'}
          </option>
          {candidates.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} — {u.role}
            </option>
          ))}
        </select>

        <Button type="button" onClick={handleAdd} disabled={!selectedId || isAdding}>
          {isAdding ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-2" />
              Add
            </>
          )}
        </Button>
      </div>

      {usersError && (
        <p className="text-amber-600 text-xs mt-2">
          Couldn&apos;t load users.{' '}
          <button type="button" onClick={reload} className="underline font-medium">
            Retry
          </button>
        </p>
      )}

      {status && (
        <p
          className={
            status.type === 'success'
              ? 'text-xs text-emerald-600 mt-2'
              : 'text-xs text-destructive mt-2'
          }
          role="status"
        >
          {status.text}
        </p>
      )}
    </div>
  )
}
