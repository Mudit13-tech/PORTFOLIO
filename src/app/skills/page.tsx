import type { Metadata } from 'next'
import { SkillsApp } from '@/apps/skills'
import { Desk } from '@/components/shell/Desk'

export const metadata: Metadata = {
  title: 'Installed modules',
  description: 'Usage frequency anchored to evidence, not self-rated percentages.',
}

export default function Page() {
  return (
    <Desk entry="/skills">
      <SkillsApp />
    </Desk>
  )
}
