'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { reportsApi } from '@/lib/api/reports.api'
import { getInitials } from '@/utils'

function Shell({ children }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Team Workload</h3>
        <Link href="/users" className="text-xs text-violet-600 hover:underline">
          View All
        </Link>
      </div>
      {children}
    </div>
  )
}

export function TeamWorkloadCard() {
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await reportsApi.getMemberWorkload()
        if (cancelled) return
        // Only show people who actually carry work; a workload card padded
        // with zero-task members says nothing useful.
        const active = (data ?? [])
          .map((m) => {
            const total = (m.completed ?? 0) + (m.inProgress ?? 0) + (m.todo ?? 0)
            return {
              name: m.name,
              total,
              completed: m.completed ?? 0,
              // Share of that person's own work that is finished.
              progress: total > 0 ? Math.round(((m.completed ?? 0) / total) * 100) : 0,
            }
          })
          .filter((m) => m.total > 0)
          .sort((a, b) => b.total - a.total)
          .slice(0, 5)
        setMembers(active)
      } catch {
        if (!cancelled) setError('Failed to load team workload.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (isLoading) {
    return (
      <Shell>
        <div className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-slate-100" />
              <div className="h-2 flex-1 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </Shell>
    )
  }

  if (error) {
    return (
      <Shell>
        <p className="text-sm text-muted-foreground">{error}</p>
      </Shell>
    )
  }

  if (members.length === 0) {
    return (
      <Shell>
        <p className="py-4 text-sm text-muted-foreground">
          No tasks assigned to any member yet.
        </p>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="space-y-4">
        {members.map((member) => (
          <div key={member.name} className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
              {getInitials(member.name || '?')}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm text-foreground">{member.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {member.completed}/{member.total}
                </span>
              </div>

              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-violet-500"
                  style={{ width: `${member.progress}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Shell>
  )
}
