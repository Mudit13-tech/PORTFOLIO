import type { Metadata } from 'next'
import { BinApp } from '@/apps/misc'
import { Desk } from '@/components/shell/Desk'

export const metadata: Metadata = {
  title: 'Recycle bin',
  description: 'Abandoned work, kept because it is still instructive.',
}

export default function Page() {
  return (
    <Desk entry="/bin">
      <BinApp />
    </Desk>
  )
}
