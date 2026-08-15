'use client'

import { useCallback, useEffect, useState } from 'react'
import { usersApi } from '@/lib/api/users.api'

/**
 * Loads the user directory once for pickers (project manager, project members,
 * task assignee). GET /users is Admin/Manager-only on the backend, so only
 * render components that use this behind the same role gate.
 */
export function useUsers() {
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(false)
    try {
      const list = await usersApi.getAll()
      setUsers(Array.isArray(list) ? list : [])
    } catch {
      setUsers([])
      setError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // load only calls setState after its internal await; the linter can't
    // trace that through useCallback (same pattern as notification-bell.jsx).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  return { users, isLoading, error, reload: load }
}

/** Only active users can be meaningfully assigned or notified. */
export function activeUsers(users) {
  return (users || []).filter((u) => u.status === 'active')
}

/**
 * Splits users for a grouped manager dropdown. The backend puts no role
 * constraint on projects.manager_id, so employees stay selectable — they are
 * just listed separately so the common case is easy to find.
 */
export function groupUsersForManagerPicker(users) {
  const active = activeUsers(users)
  return {
    privileged: active.filter((u) => u.role === 'admin' || u.role === 'manager'),
    employees: active.filter((u) => u.role === 'employee'),
  }
}
