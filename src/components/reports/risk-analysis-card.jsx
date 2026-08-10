'use client'

import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react'

export function RiskAnalysisCard() {
  const risks = [
    {
      title: 'Sprint Deadline Risk',
      level: 'High',
      icon: AlertTriangle,
      color: 'text-red-500',
      bg: 'bg-red-50',
    },
    {
      title: 'Resource Availability',
      level: 'Medium',
      icon: ShieldAlert,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
    },
    {
      title: 'Project Health',
      level: 'Low',
      icon: CheckCircle2,
      color: 'text-green-500',
      bg: 'bg-green-50',
    },
  ]

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-foreground">
          Risk Analysis
        </h3>

        <p className="text-sm text-muted-foreground">
          Project risk indicators
        </p>
      </div>

      <div className="space-y-4">
        {risks.map((risk) => {
          const Icon = risk.icon

          return (
            <div
              key={risk.title}
              className={`flex items-center gap-3 p-3 rounded-lg ${risk.bg}`}
            >
              <div>
                <Icon className={`w-5 h-5 ${risk.color}`} />
              </div>

              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {risk.title}
                </p>

                <p className={`text-xs font-medium ${risk.color}`}>
                  {risk.level} Risk
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}