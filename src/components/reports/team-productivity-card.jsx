'use client'

import {
  TrendingUp,
  Users,
  Palette,
  ShieldCheck,
  Briefcase
} from 'lucide-react'

export function TeamProductivityCard() {
  const teams = [
    {
      name: 'Developers',
      progress: 92,
      icon: Users,
      color: 'bg-violet-600',
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
    },
    {
      name: 'Design Team',
      progress: 85,
      icon: Palette,
      color: 'bg-emerald-500',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
    {
      name: 'QA Team',
      progress: 78,
      icon: ShieldCheck,
      color: 'bg-amber-500',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
    {
      name: 'Managers',
      progress: 88,
      icon: Briefcase,
      color: 'bg-blue-500',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
  ]

  return (
    <div className="bg-card rounded-2xl border border-border p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Team Productivity
          </h3>

          <p className="text-sm text-muted-foreground">
            Tasks completed this sprint
          </p>
        </div>

        <button className="text-xs font-medium text-violet-600 hover:text-violet-700">
          View Details
        </button>
      </div>

      <div className="space-y-5">
        {teams.map((team) => {
          const Icon = team.icon

          return (
            <div
              key={team.name}
              className="flex items-center gap-3"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${team.iconBg}`}
              >
                <Icon
                  className={`w-4 h-4 ${team.iconColor}`}
                />
              </div>

              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">
                    {team.name}
                  </span>

                  <span className="text-sm font-semibold text-muted-foreground">
                    {team.progress}%
                  </span>
                </div>

                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${team.color}`}
                    style={{
                      width: `${team.progress}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}