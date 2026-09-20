import type { Metadata } from 'next'
import { ProjectsApp } from '@/apps/projects'
import { Desk } from '@/components/shell/Desk'

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Six real repositories, with the crash reports each one produced.',
}

export default function Page() {
  return (
    <Desk entry="/projects">
      <ProjectsApp />
    </Desk>
  )
}
