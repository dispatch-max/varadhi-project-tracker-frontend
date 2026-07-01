import { StatsCards } from '@/components/dashboard/stats-cards'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { ProjectProgress } from '@/components/dashboard/project-progress'

export const metadata = {
  title: 'Dashboard',
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-800">
          Dashboard
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Welcome back! Here&apos;s what&apos;s happening.
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Bottom Row — Activity + Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity />
        <ProjectProgress />
      </div>

    </div>
  )
}