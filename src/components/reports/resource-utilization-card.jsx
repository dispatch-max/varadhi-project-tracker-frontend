'use client'

export function ResourceUtilizationCard() {
  const resources = [
    {
      name: 'Frontend Team',
      value: 82,
    },
    {
      name: 'Backend Team',
      value: 74,
    },
    {
      name: 'QA Team',
      value: 65,
    },
    {
      name: 'DevOps',
      value: 58,
    },
  ]

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-foreground">
          Resource Utilization
        </h3>
        <p className="text-sm text-muted-foreground">
          Team capacity usage
        </p>
      </div>

      <div className="space-y-5">
        {resources.map((item) => (
          <div key={item.name}>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-foreground">
                {item.name}
              </span>

              <span className="text-sm font-medium text-muted-foreground">
                {item.value}%
              </span>
            </div>

            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-600 rounded-full"
                style={{
                  width: `${item.value}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}