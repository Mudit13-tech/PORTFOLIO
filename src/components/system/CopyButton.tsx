'use client'

import { useState } from 'react'

export function CopyButton({ value }: { value: string }) {
  const [done, setDone] = useState(false)

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setDone(true)
          setTimeout(() => setDone(false), 1500)
        } catch {
          /* clipboard blocked — the address is selectable either way */
        }
      }}
      className="mono text-[11px] text-tertiary hover:text-primary border border-subtle rounded-sm px-1.5 py-0.5"
    >
      {done ? 'copied' : 'copy'}
    </button>
  )
}
