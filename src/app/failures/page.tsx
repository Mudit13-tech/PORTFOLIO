import type { Metadata } from 'next'
import { FailuresApp } from '@/apps/failures'
import { Desk } from '@/components/shell/Desk'

export const metadata: Metadata = {
  title: 'Failed builds',
  description: 'Crash reports, each drafted from a named commit anyone can open.',
}

export default function Page() {
  return (
    <Desk entry="/failures">
      <FailuresApp />
    </Desk>
  )
}
