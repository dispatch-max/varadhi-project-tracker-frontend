import { SummaryCards }            from '@/components/reports/summary-cards'
import { TaskStatusChart }        from '@/components/reports/task-status-chart'
import { BurndownChart }          from '@/components/reports/burndown-chart'
import { MemberWorkloadChart }    from '@/components/reports/member-workload-chart'
import { ProjectCompletionChart } from '@/components/reports/project-completion-chart'

export const metadata = {
  title: 'Reports',
}

// // Summary stat cards at the top
// function SummaryCard({ label, value, sub, color }) {
//   return (
//     <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
//       <p className={`text-2xl font-semibold ${color}`}>{value}</p>
//       <p className="text-sm font-medium text-slate-700 mt-0.5">{label}</p>
//       <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
//     </div>
//   )
// }

export default function ReportsPage() {
  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-800">
          Reports & Analytics
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Track team performance, sprint progress and project health.
        </p>
      </div>

      {/* Summary Cards (live data) */}
      <SummaryCards />
      {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Tasks Completed"
          value="38"
          sub="This sprint"
          color="text-green-600"
        />
        <SummaryCard
          label="Completion Rate"
          value="59%"
          sub="vs 52% last sprint"
          color="text-violet-600"
        />
        <SummaryCard
          label="Avg per Member"
          value="7.6"
          sub="Tasks this sprint"
          color="text-blue-600"
        />
        <SummaryCard
          label="Overdue Tasks"
          value="3"
          sub="Need attention"
          color="text-red-500"
        />
      </div> */}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <BurndownChart />
        <TaskStatusChart />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <MemberWorkloadChart />
        <ProjectCompletionChart />
      </div>

    </div>
  )
}