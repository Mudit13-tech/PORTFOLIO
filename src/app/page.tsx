import { Desk } from '@/components/shell/Desk'
import { StaticDocument } from '@/components/shell/StaticDocument'

export default function Page() {
  return (
    <Desk entry="/">
      <StaticDocument />
    </Desk>
  )
}
