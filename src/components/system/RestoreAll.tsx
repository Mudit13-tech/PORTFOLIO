'use client'

import { useState } from 'react'

/** The bin's joke button. It shakes and refuses, which is the whole point. */
export function RestoreAll() {
  const [refused, setRefused] = useState(false)

  return (
    <span className="flex items-center gap-2">
      {refused && <span className="micro text-tertiary">no.</span>}
      <button
        type="button"
        onClick={() => {
          setRefused(true)
          setTimeout(() => setRefused(false), 2000)
        }}
        className={`mono text-[12px] text-tertiary hover:text-primary ${refused ? 'anim-shake' : ''}`}
      >
        restore all ⤴
      </button>
    </span>
  )
}
