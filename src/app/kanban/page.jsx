import { KanbanBoard } from '@/components/kanban/kanban-board'
import { AIInsightsCard } from '@/components/kanban/ai-insights-card'
import { TeamWorkloadCard } from '@/components/kanban/team-workload-card'
import { UpcomingDeadlinesCard } from '@/components/kanban/upcoming-deadlines-card'
import { KanbanStats } from '@/components/kanban/kanban-stats'

export const metadata = {
  title: 'Kanban Board',
}

export default function KanbanPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Kanban Board
        </h2>

        <p className="text-sm text-muted-foreground mt-0.5">
          Drag and drop tasks across columns to update their status.
        </p>
      </div>

           {/* Stats Row */}
      <KanbanStats />

      {/* Kanban Board */}
      <KanbanBoard />

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <AIInsightsCard />
        <TeamWorkloadCard />
        <UpcomingDeadlinesCard />
      </div>
    </div>
  )
}