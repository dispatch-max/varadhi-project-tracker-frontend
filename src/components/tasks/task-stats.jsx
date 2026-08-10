'use client'

import {
  CheckSquare,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Ban,
} from 'lucide-react'

import { StatsCard } from './stats-card'

export function TaskStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">

      <StatsCard
        title="Total Tasks"
        value="156"
        subtitle="+12 this week"
        icon={CheckSquare}
      />

      <StatsCard
        title="Completed"
        value="98"
        subtitle="63% of total"
        icon={CheckCircle2}
      />

      <StatsCard
        title="In Progress"
        value="41"
        subtitle="26% of total"
        icon={Clock3}
      />

      <StatsCard
        title="Overdue"
        value="8"
        subtitle="5% of total"
        icon={AlertTriangle}
      />

      <StatsCard
        title="Blocked"
        value="9"
        subtitle="6% of total"
        icon={Ban}
      />

    </div>
  )
}