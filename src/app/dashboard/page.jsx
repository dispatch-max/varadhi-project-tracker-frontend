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
    <main
      className="
        box-border
        h-[calc(100dvh-60px)]
        max-h-[calc(100dvh-60px)]
        min-h-0
        w-full
        min-w-0
        overflow-hidden
        overscroll-none
        bg-slate-50
      "
    >
      {/* =====================================================
          DASHBOARD WRAPPER

          IMPORTANT:
          h-full + min-h-0 + overflow-hidden

          Nothing inside this wrapper is allowed to increase
          the page height.
      ====================================================== */}

      <div
        className="
          mx-auto
          flex
          h-full
          max-h-full
          min-h-0
          w-full
          min-w-0
          max-w-[1500px]
          flex-col
          overflow-hidden
          px-4
          pb-2
        "
      >
        {/* =================================================
            TOP FILTER
        ================================================== */}

        <div
          className="
            mb-2
            flex
            h-7
            min-h-0
            shrink-0
            items-center
            justify-end
            overflow-hidden
          "
        >
          <button
            type="button"
            className="
              flex
              h-7
              shrink-0
              items-center
              gap-1.5
              rounded-lg
              border
              border-slate-200
              bg-white
              px-3
              text-[11px]
              font-medium
              text-slate-700
              shadow-sm
              transition
              hover:bg-slate-50
            "
          >
            This week

            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          </button>
        </div>

        {/* =================================================
            STATS
            FIXED HEIGHT
        ================================================== */}

        <section
          className="
            mb-2
            h-[82px]
            min-h-[82px]
            shrink-0
            overflow-hidden
          "
        >
          <div className="h-full min-h-0 w-full min-w-0 overflow-hidden">
            <StatsCards />
          </div>
        </section>

        {/* =================================================
            MAIN DASHBOARD

            Uses ALL remaining height.
            No page-level scrolling.
        ================================================== */}

        <section
          className="
            grid
            h-full
            min-h-0
            min-w-0
            flex-1
            gap-2
            overflow-hidden
          "
          style={{
            gridTemplateRows:
              'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)',
          }}
        >
          {/* =================================================
              ROW 1

              Project Health
              Tasks Overview
              Upcoming Deadlines
          ================================================== */}

          <div
            className="
              grid
              h-full
              min-h-0
              min-w-0
              gap-2
              overflow-hidden
            "
            style={{
              gridTemplateColumns:
                'minmax(0,1fr) minmax(0,1fr) minmax(0,1.7fr)',
            }}
          >
            {/* PROJECT HEALTH */}

            <div
              className="
                h-full
                max-h-full
                min-h-0
                min-w-0
                overflow-hidden
              "
            >
              <ProjectHealth />
            </div>

            {/* TASKS OVERVIEW */}

            <div
              className="
                h-full
                max-h-full
                min-h-0
                min-w-0
                overflow-hidden
              "
            >
              <TasksOverview />
            </div>

            {/* UPCOMING DEADLINES */}

            <div
              className="
                h-full
                max-h-full
                min-h-0
                min-w-0
                overflow-hidden
              "
            >
              <UpcomingDeadlines />
            </div>
          </div>

          {/* =================================================
              ROW 2

              Recent Activity
              Project Progress
              Notifications
              Calendar Sync
          ================================================== */}

          <div
            className="
              grid
              h-full
              min-h-0
              min-w-0
              gap-2
              overflow-hidden
            "
            style={{
              gridTemplateColumns:
                'repeat(4,minmax(0,1fr))',
            }}
          >
            {/* RECENT ACTIVITY */}

            <div
              className="
                h-full
                max-h-full
                min-h-0
                min-w-0
                overflow-hidden
              "
            >
              <RecentActivity />
            </div>

            {/* PROJECT PROGRESS */}

            <div
              className="
                h-full
                max-h-full
                min-h-0
                min-w-0
                overflow-hidden
              "
            >
              <ProjectProgress />
            </div>

            {/* NOTIFICATIONS */}

            <div
              className="
                h-full
                max-h-full
                min-h-0
                min-w-0
                overflow-hidden
              "
            >
              <NotificationsCard />
            </div>

            {/* CALENDAR SYNC */}

            <div
              className="
                h-full
                max-h-full
                min-h-0
                min-w-0
                overflow-hidden
              "
            >
              <CalendarSyncWidget />
            </div>
          </div>

          {/* =================================================
              ROW 3

              GANTT — FULL WIDTH
          ================================================== */}

          <div
            className="
              h-full
              max-h-full
              min-h-0
              min-w-0
              overflow-hidden
            "
          >
            <GanttPreview />
          </div>
        </section>
      </div>
    </main>
  )
}