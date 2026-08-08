'use client'

export function ProjectProgressChart() {
  const projects = [
    { name: 'CRM System', progress: 82 },
    { name: 'Mobile App', progress: 65 },
    { name: 'Website Redesign', progress: 91 },
    { name: 'Analytics Platform', progress: 48 },
  ]

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-foreground">
          Project Progress
        </h3>
        <p className="text-sm text-muted-foreground">
          Completion status across projects
        </p>
      </div>

      <div className="space-y-4">
        {projects.map((project) => (
          <div key={project.name}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                {project.name}
              </span>

              <span className="text-sm text-muted-foreground">
                {project.progress}%
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-violet-600 h-2 rounded-full transition-all"
                style={{
                  width: `${project.progress}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}