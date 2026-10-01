import type { Metadata } from 'next'
import { AboutApp } from '@/apps/misc'
import { Desk } from '@/components/shell/Desk'
import { profile } from '~/data'

export const metadata: Metadata = {
  title: 'About',
  description: `${profile.name} — ${profile.discipline} at ${profile.institution}. ${profile.role}.`,
}

export default function Page() {
  return (
    <Desk entry="/about">
      <AboutApp />
    </Desk>
  )
}
