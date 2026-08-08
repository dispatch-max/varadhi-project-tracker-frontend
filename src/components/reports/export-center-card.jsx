'use client'

import {
  Download,
  FileSpreadsheet,
  FileText,
  FileBarChart
} from 'lucide-react'

export function ExportCenterCard() {
  const exports = [
    {
      icon: FileSpreadsheet,
      title: 'Excel Report',
      description: 'Detailed spreadsheet export'
    },
    {
      icon: FileText,
      title: 'PDF Report',
      description: 'Executive summary document'
    },
{
  icon: FileBarChart,
  title: 'CSV Data',
  description: 'Raw analytics dataset'
}
  ]

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Export Center
          </h3>

          <p className="text-sm text-muted-foreground">
            Download reports and analytics
          </p>
        </div>

        <Download className="w-5 h-5 text-green-500" />
      </div>

      <div className="space-y-3">
        {exports.map((item) => {
          const Icon = item.icon

          return (
            <button
              key={item.title}
              className="w-full flex items-center justify-between border border-border rounded-lg p-3 hover:bg-background transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>

                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">
                    {item.title}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>

              <Download className="w-4 h-4 text-slate-400" />
            </button>
          )
        })}
      </div>
    </div>
  )
}