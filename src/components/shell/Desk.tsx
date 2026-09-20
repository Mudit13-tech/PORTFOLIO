'use client'

import { Boot } from './Boot'
import { Shell } from './Shell'

/**
 * The single client entry point.
 *
 * Every route renders `<Desk entry={...}>` around its own server-rendered
 * content. The content arrives as `children` — a Server Component passed as a
 * prop — so it is never pulled into the client bundle, and a deep link's HTML
 * becomes the body of the window that opens.
 */
export function Desk({ entry, children }: { entry: string; children: React.ReactNode }) {
  return (
    <>
      <Boot />
      <Shell entry={entry} serverContent={children} />
    </>
  )
}
