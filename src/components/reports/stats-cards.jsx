import {
  FolderKanban,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

export function StatsCards() {
  const stats = [
    {
      title: 'Total Projects',
      value: 24,
      icon: FolderKanban
    },
    {
      title: 'Completed',
      value: 18,
      icon: CheckCircle
    },
    {
      title: 'On Track',
      value: 5,
      icon: Clock
    },
    {
      title: 'Delayed',
      value: 1,
      icon: AlertCircle
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {stats.map((item) => {
        const Icon = item.icon

        return (
          <div
            key={item.title}
            className="bg-card border rounded-2xl p-5 shadow-sm"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {item.title}
                </p>

                <h2 className="text-3xl font-bold mt-2">
                  {item.value}
                </h2>
              </div>

              <Icon className="w-10 h-10 text-violet-600" />
            </div>
          </div>
        )
      })}
    </div>
  )
}