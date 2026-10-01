import type { Metadata } from 'next'
import { ProjectsApp } from '@/apps/projects'
import { Desk } from '@/components/shell/Desk'
import { counts } from '@/lib/derived'

export const metadata: Metadata = {
  title: 'Projects',
  description: `${counts.projects} real repositories, with the crash reports each one produced.`,
}

export default function Page() {
  return (
    <Desk entry="/projects">
      <ProjectsApp />
    </Desk>
  )
}
