'use client'

import { useState } from 'react'
import { sfx } from '@/lib/sfx'
import { Glyph } from '@/components/ui'

/** Copies a value. The sound is the confirmation, so it plays on success, not on the press. */
export function CopyButton({ value }: { value: string }) {
  const [done, setDone] = useState(false)

  return (
    <button
      type="button"
      data-sfx="off"
      aria-label={done ? 'Copied' : `Copy ${value}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setDone(true)
          sfx('copy')
          setTimeout(() => setDone(false), 1500)
        } catch {
          /* clipboard blocked — the address is selectable either way */
          sfx('deny')
        }
      }}
      className={`copy-chip ${done ? 'is-done' : ''}`}
    >
      <Glyph name={done ? 'check' : 'copy'} size={11} />
      {done ? 'copied' : 'copy'}
    </button>
  )
}
