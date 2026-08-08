import { SummaryCards } from '@/components/reports/summary-cards'
import { TaskStatusChart } from '@/components/reports/task-status-chart'
import { BurndownChart } from '@/components/reports/burndown-chart'
import { MemberWorkloadChart } from '@/components/reports/member-workload-chart'
import { ProjectCompletionChart } from '@/components/reports/project-completion-chart'
import { ProjectProgressChart } from '@/components/reports/project-progress-chart'
import { TeamProductivityCard } from '@/components/reports/team-productivity-card'
import { TaskCompletionChart } from '@/components/reports/task-completion-chart'
import { ResourceUtilizationCard } from '@/components/reports/resource-utilization-card'
import { RiskAnalysisCard } from '@/components/reports/risk-analysis-card'
import { ScheduledReportsCard } from '@/components/reports/scheduled-reports-card'
import { ExportCenterCard } from '@/components/reports/export-center-card'
import { BusinessIntelligenceCard } from '@/components/reports/business-intelligence-card'
import { AIReportInsightsCard } from '@/components/reports/ai-report-insights-card'
import { AIForecastingCard } from '@/components/reports/ai-forecasting-card'
export const metadata = {
  title: 'Reports',
}

export default function ReportsPage() {
  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Reports & Analytics
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track team performance, sprint progress and project health.
        </p>
      </div>

      <SummaryCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <BurndownChart />
        <TaskStatusChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <MemberWorkloadChart />
        <ProjectCompletionChart />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
  <ProjectProgressChart />
  <TeamProductivityCard />
  <TaskCompletionChart />
</div>

<div className="grid lg:grid-cols-3 gap-5">
  <ResourceUtilizationCard />
  <AIReportInsightsCard />
  <RiskAnalysisCard />
  
</div>

<div className="grid lg:grid-cols-4 gap-5">
  <ScheduledReportsCard />
<ExportCenterCard />
<BusinessIntelligenceCard />
  <AIForecastingCard />

</div>




    </div>
  )
}