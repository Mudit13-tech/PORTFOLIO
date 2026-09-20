import type { Metadata } from 'next'
import { ContactApp } from '@/apps/misc'
import { Desk } from '@/components/shell/Desk'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Open a channel.',
}

export default function Page() {
  return (
    <Desk entry="/contact">
      <ContactApp />
    </Desk>
  )
}
