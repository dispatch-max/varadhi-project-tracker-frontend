'use client'

import { cn } from '@/utils'

export function UsersStats({ users = [] }) {
  const stats = [
    {
      label: 'Total Members',
      value: users.length,
      color: 'text-foreground',
    },
    {
      label: 'Active',
      value: users.filter((u) => u.status === 'active').length,
      color: 'text-green-600',
    },
    {
      label: 'Managers',
      value: users.filter((u) => u.role === 'manager').length,
      color: 'text-blue-600',
    },
    {
      label: 'Pending Invites',
      value: users.filter((u) => u.status === 'invited').length,
      color: 'text-amber-600',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-card rounded-2xl border border-border p-5"
        >
          <p className={cn(
            'text-3xl font-bold',
            stat.color
          )}>
            {stat.value}
          </p>

          <p className="text-sm font-medium text-foreground mt-2">
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  )
}