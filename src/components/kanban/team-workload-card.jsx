'use client'

export function TeamWorkloadCard() {
  const members = [
    { name: 'Priya Sharma', progress: 78 },
    { name: 'Rahul Verma', progress: 65 },
    { name: 'Sneha Iyer', progress: 82 },
    { name: 'Vikram Singh', progress: 45 },
    { name: 'Anil Kumar', progress: 70 },
  ]

  return (
    <div className="bg-card rounded-xl border border-border p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">
          Team Workload
        </h3>

        <button className="text-xs text-violet-600">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {members.map((member) => (
          <div
            key={member.name}
            className="flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-xs font-semibold">
              {member.name.charAt(0)}
            </div>

            <div className="flex-1">
              <p className="text-sm text-foreground">
                {member.name}
              </p>

              <div className="h-2 bg-slate-100 rounded-full mt-1">
                <div
                  className="h-2 bg-violet-600 rounded-full"
                  style={{
                    width: `${member.progress}%`,
                  }}
                />
              </div>
            </div>

            <span className="text-xs text-muted-foreground">
              {member.progress}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}