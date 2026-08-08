import { ProjectsList } from '@/components/projects/projects-list'

export const metadata = {
  title: 'Projects',
}

export default function ProjectsPage() {
  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Projects
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage and track all your team projects.
        </p>
      </div>

      {/* Projects List */}
      <ProjectsList />

    </div>
  )
}