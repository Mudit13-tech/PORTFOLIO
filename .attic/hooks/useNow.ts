'use client'

import { useEffect, useState } from 'react'

/**
 * A clock that hydrates cleanly.
 *
 * The page is static, so anything derived from `Date.now()` at render time is
 * computed once at build and again in the visitor's browser — two different
 * answers, and React tears the tree down when they disagree. The first client
 * render therefore uses the snapshot's own timestamp, which is exactly what
 * the server used, and only afterwards does the value move to real time.
 */
export function useNow(asOf: string): number {
  const [now, setNow] = useState(() => new Date(asOf).getTime())
  useEffect(() => {
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])
  return now
}
