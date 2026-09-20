import type { Metadata } from 'next'
import { MonitorApp } from '@/apps/misc'
import { Desk } from '@/components/shell/Desk'

export const metadata: Metadata = {
  title: 'System monitor',
  description: 'Every number with the method that produced it.',
}

export default function Page() {
  return (
    <Desk entry="/monitor">
      <MonitorApp />
    </Desk>
  )
}
