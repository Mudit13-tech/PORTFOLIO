'use client'

import { useRef } from 'react'
import { sfx } from '@/lib/sfx'

/**
 * A row of chips that lean toward the pointer.
 *
 * Each chip is pulled toward the cursor by how close it is — the one under it
 * most, its neighbours a little — and springs back when the pointer leaves.
 * Finding a chip with the pointer taps it, pitched by where it sits in the
 * row. It is the same list of words with or without any of that: the motion
 * is an inline transform on markup that renders fine on the server.
 */
const REACH = 96

export function MagneticChips({ items }: { items: string[] }) {
  const ref = useRef<HTMLUListElement>(null)
  const near = useRef(-1)

  const move = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    const list = ref.current
    if (!list) return
    const chips = [...list.children] as HTMLElement[]
    let best = -1
    let bestD = Infinity
    chips.forEach((c, i) => {
      const r = c.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      const d = Math.hypot(dx, dy)
      const pull = Math.max(0, 1 - d / REACH) ** 1.6
      c.style.transform = pull > 0 ? `translate(${(dx * pull * 0.22).toFixed(2)}px, ${(dy * pull * 0.3).toFixed(2)}px) scale(${(1 + pull * 0.07).toFixed(3)})` : ''
      if (d < bestD) {
        bestD = d
        best = i
      }
    })
    const over = bestD < 26 ? best : -1
    if (over !== near.current && over >= 0) sfx('chip', chips.length > 1 ? over / (chips.length - 1) : 0.5)
    near.current = over
  }

  const leave = () => {
    near.current = -1
    for (const c of ref.current?.children ?? []) (c as HTMLElement).style.transform = ''
  }

  return (
    <ul ref={ref} className="chips" onPointerMove={move} onPointerLeave={leave}>
      {items.map((s) => (
        <li key={s} className="pill mono chip">
          {s}
        </li>
      ))}
    </ul>
  )
}
