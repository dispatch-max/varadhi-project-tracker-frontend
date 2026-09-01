import { StatsCards } from '@/components/dashboard/stats-cards'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { ProjectProgress } from '@/components/dashboard/project-progress'
import { CalendarSyncWidget } from '@/components/dashboard/calendar-sync-widget'
import { ProjectHealth } from '@/components/dashboard/ProjectHealth'
import { TasksOverview } from '@/components/dashboard/TasksOverview'
import { UpcomingDeadlines } from '@/components/dashboard/UpcomingDeadlines'
import { NotificationsCard } from '@/components/dashboard/NotificationsCard'
import { GanttPreview } from '@/components/dashboard/GanttPreview'

import { ChevronDown } from 'lucide-react'

export const metadata = {
  title: 'Dashboard',
}

export default function DashboardPage() {
  return (
    <main className="w-full min-w-0 bg-slate-50">
      <div className="mx-auto w-full max-w-[1800px] min-w-0 px-5 py-6 lg:px-6 xl:px-7">

        {/* =====================================================
            DASHBOARD HEADER
        ===================================================== */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-[30px] font-semibold leading-tight tracking-tight text-slate-900">
              Project Dashboard
            </h1>

            <p className="mt-1 text-[16px] text-slate-500">
              Welcome back, Varadhi Team
            </p>
          </div>

          <button
            type="button"
            className="
              flex h-11 items-center gap-2
              rounded-xl border border-slate-200
              bg-white px-5
              text-[14px] font-medium text-slate-700
              shadow-sm
              transition
              hover:bg-slate-50
            "
          >
            This week
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>

        {/* =====================================================
            STATS
        ===================================================== */}
        <section className="mb-6 w-full">
          <StatsCards />
        </section>

        {/* =====================================================
            ROW 1
            Project Health / Tasks / Upcoming Deadlines
        ===================================================== */}
        <section
          className="
            mb-6
            grid
            w-full
            min-w-0
            gap-5
            lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.7fr)]
          "
        >
          <div className="min-w-0 min-h-[300px] h-[300px]">
            <ProjectHealth />
          </div>

          <div className="min-w-0 min-h-[300px] h-[300px]">
            <TasksOverview />
          </div>

          <div className="min-w-0 min-h-[300px] h-[300px]">
            <UpcomingDeadlines />
          </div>
        </section>

        {/* =====================================================
            ROW 2
            Recent Activity / Project Progress /
            Notifications / Calendar Sync
        ===================================================== */}
        <section
          className="
            mb-6
            grid
            w-full
            min-w-0
            gap-5
            lg:grid-cols-4
          "
        >
          <div className="min-w-0 min-h-[330px]">
            <RecentActivity />
          </div>

          <div className="min-w-0 min-h-[330px]">
            <ProjectProgress />
          </div>

          <div className="min-w-0 min-h-[330px]">
            <NotificationsCard />
          </div>

          <div className="min-w-0 min-h-[330px]">
            <CalendarSyncWidget />
          </div>
        </section>

        {/* =====================================================
            GANTT TIMELINE
        ===================================================== */}
        <section className="mb-6 w-full min-w-0">
          <div className="min-h-[330px] w-full min-w-0">
            <GanttPreview />
          </div>
        </section>

      </div>
    </main>
  )
}