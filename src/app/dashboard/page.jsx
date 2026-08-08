import { StatsCards } from '@/components/dashboard/stats-cards'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { ProjectProgress } from '@/components/dashboard/project-progress'
import { ProjectHealth } from '@/components/dashboard/ProjectHealth'
import { TasksOverview } from '@/components/dashboard/TasksOverview'
import {UpcomingDeadlines} from '@/components/dashboard/UpcomingDeadlines'
import { AICompanion } from '@/components/dashboard/AICompanion'
import { NotificationsCard } from '@/components/dashboard/NotificationsCard'
import { CalendarCard } from '@/components/dashboard/CalendarCard'
import { GithubActivity } from '@/components/dashboard/GithubActivity'
import { GanttPreview } from '@/components/dashboard/GanttPreview'
import {
  Plus,
  Bell,
  Sparkles,
  ChevronDown,
} from "lucide-react";

export const metadata = {
  title: 'Dashboard',
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
{/* Page Header */}
<div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">

  {/* Left Side */}
  <div>
    <h1 className="text-3xl font-bold text-foreground">
      Project Dashboard
    </h1>

    <p className="mt-1 text-sm text-muted-foreground">
      Welcome back, Varadhi Team
    </p>
  </div>

  {/* Right Side */}
  <div className="flex items-center gap-3">

    {/* This Week */}
    <button className="flex items-center gap-2 px-4 h-10 bg-card border border-border rounded-xl text-sm text-foreground hover:bg-background">
      This week
      <ChevronDown className="w-4 h-4" />
    </button>

  </div>

</div>

      {/* Stats Cards */}
      <StatsCards />
<div className="grid grid-cols-12 gap-6">

  {/* Project Health */}
  <div className="col-span-12 lg:col-span-3">
    <ProjectHealth />
  </div>

  {/* Tasks Overview */}
  <div className="col-span-12 lg:col-span-3">
    <TasksOverview />
  </div>

  {/* Upcoming Deadlines */}
  <div className="col-span-12 lg:col-span-6">
    <UpcomingDeadlines />
  </div>

</div>

      {/* Bottom Row — Activity + Projects */}
<div className="grid grid-cols-12 gap-6">
  <div className="col-span-12 lg:col-span-3">
    <RecentActivity />
  </div>

  <div className="col-span-12 lg:col-span-3">
    <AICompanion />
  </div>

  <div className="col-span-12 lg:col-span-3">
    <NotificationsCard />
  </div>

      {/* CalendarCard */}
  <div className="col-span-12 lg:col-span-3">
    <CalendarCard />
  </div>
</div>

      {/* Stats Cards */}
<div className="grid grid-cols-12 gap-6">

  {/* GithubActivity */}
  <div className="col-span-12 lg:col-span-6">
    <GithubActivity />
  </div>

  {/* GanttPreview */}
  <div className="col-span-12 lg:col-span-6">
    <GanttPreview />
  </div>

</div>
    </div>
  )
}