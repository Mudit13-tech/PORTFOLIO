'use client'

import { useMemo } from 'react'
import { CELL, GUT, U } from '@/lib/lattice'
import type { Day } from '@/lib/types'

/**
 * Thirty days, two channels, one cell tall.
 *
 * The x pitch is the lattice pitch, so the trace lines up with the calendar
 * above it column for column — it is the same ruler, read at a different
 * length.
 */
export function Sparkline({ days, span = 30 }: { days: Day[]; span?: number }) {
  const slice = useMemo(() => {
    const today = Date.now()
    const past = days.filter((d) => new Date(`${d.date}T00:00:00Z`).getTime() <= today)
    return past.slice(-span)
  }, [days, span])

  const w = span * U - GUT
  const h = CELL

  const trace = (pick: (d: Day) => number) => {
    const max = Math.max(1, ...slice.map(pick))
    return slice
      .map((d, i) => `${i * U + GUT},${(h - 1 - (pick(d) / max) * (h - 2)).toFixed(2)}`)
      .join(' ')
  }

  const gh = trace((d) => d.commits)
  const lc = trace((d) => d.solved)
  const len = span * U

  if (slice.length === 0) return null

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="block shrink-0"
      role="img"
      aria-label={`Activity over the last ${slice.length} days: ${slice.reduce((a, d) => a + d.commits, 0)} contributions, ${slice.reduce((a, d) => a + d.solved, 0)} problems solved`}
    >
      <line x1={0} y1={h - 1} x2={w} y2={h - 1} stroke="var(--c-wire)" strokeWidth={1} />
      {[
        { d: lc, c: 'var(--c-cool)', delay: '90ms' },
        { d: gh, c: 'var(--c-live)', delay: '0ms' },
      ].map((t) => (
        <polyline
          key={t.c}
          points={t.d}
          fill="none"
          stroke={t.c}
          strokeWidth={1}
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{
            strokeDasharray: len,
            strokeDashoffset: len,
            animation: `draw 900ms cubic-bezier(0.3,0.8,0.4,1) ${t.delay} forwards`,
          }}
        />
      ))}
    </svg>
  )
}
