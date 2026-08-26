import { ProjectsList } from '@/components/projects/projects-list'

export const metadata = {
  title: 'Projects',
}

export default function ProjectsPage() {
  return (
    <div className="p-2.5">
      <ProjectsList />
    </div>
  )
}