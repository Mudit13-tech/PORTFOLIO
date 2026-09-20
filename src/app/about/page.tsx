import type { Metadata } from 'next'
import { AboutApp } from '@/apps/misc'
import { Desk } from '@/components/shell/Desk'

export const metadata: Metadata = {
  title: 'About',
  description: 'User profile.',
}

export default function Page() {
  return (
    <Desk entry="/about">
      <AboutApp />
    </Desk>
  )
}
