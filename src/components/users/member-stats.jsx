'use client'

import {
  Users,
  UserCheck,
  Shield,
  Mail
} from 'lucide-react'

function StatCard({
  title,
  value,
  icon: Icon,
  color
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-2xl font-bold text-foreground">
            {value}
          </h3>

          <p className="text-sm text-muted-foreground">
            {title}
          </p>
        </div>
      </div>
    </div>
  )
}

export function MemberStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

      <StatCard
        title="Total Members"
        value="13"
        icon={Users}
        color="bg-violet-100 text-violet-600"
      />

      <StatCard
        title="Active Members"
        value="11"
        icon={UserCheck}
        color="bg-green-100 text-green-600"
      />

      <StatCard
        title="Managers"
        value="4"
        icon={Shield}
        color="bg-blue-100 text-blue-600"
      />

      <StatCard
        title="Pending Invites"
        value="1"
        icon={Mail}
        color="bg-orange-100 text-orange-600"
      />

    </div>
  )
}