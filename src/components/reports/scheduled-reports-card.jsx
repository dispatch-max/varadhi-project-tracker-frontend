'use client'

import { CalendarDays, Clock, FileText } from 'lucide-react'

export function ScheduledReportsCard() {
  const reports = [
    {
      name: 'Weekly Sprint Report',
      schedule: 'Every Monday',
      time: '09:00 AM',
    },
    {
      name: 'Project Health Summary',
      schedule: 'Every Friday',
      time: '05:00 PM',
    },
    {
      name: 'Monthly Analytics',
      schedule: '1st of Month',
      time: '08:00 AM',
    },
  ]

  return (
    <div className="bg-card rounded-2xl border border-slate-100 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Scheduled Reports
          </h3>

          <p className="text-sm text-muted-foreground">
            Automated report delivery
          </p>
        </div>

        <CalendarDays className="w-5 h-5 text-violet-500" />
      </div>

      <div className="space-y-3">
        {reports.map((report) => (
          <div
            key={report.name}
            className="border border-border rounded-lg p-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-violet-500" />

              <p className="text-sm font-medium text-foreground">
                {report.name}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{report.schedule}</span>

              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {report.time}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}