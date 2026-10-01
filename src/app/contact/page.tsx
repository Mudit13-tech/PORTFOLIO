import type { Metadata } from 'next'
import { ContactApp } from '@/apps/misc'
import { Desk } from '@/components/shell/Desk'
import { channels, profile } from '~/data'

export const metadata: Metadata = {
  title: 'Contact',
  description: `Reach ${profile.name} by ${new Intl.ListFormat('en', { type: 'disjunction' }).format(
    channels.filter((c) => c.href).map((c) => (c.id === 'email' ? 'email' : c.label)),
  )}.`,
}

export default function Page() {
  return (
    <Desk entry="/contact">
      <ContactApp />
    </Desk>
  )
}
