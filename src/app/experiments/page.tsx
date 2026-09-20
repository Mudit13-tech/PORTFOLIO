import type { Metadata } from 'next'
import { ExperimentsApp } from '@/apps/misc'
import { Desk } from '@/components/shell/Desk'

export const metadata: Metadata = {
  title: 'Experiments',
  description: 'Test builds: what was tested, and what came back.',
}

export default function Page() {
  return (
    <Desk entry="/experiments">
      <ExperimentsApp />
    </Desk>
  )
}
