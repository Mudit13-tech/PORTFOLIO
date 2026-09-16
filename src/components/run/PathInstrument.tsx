'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CELL, U } from '@/lib/lattice'
import { Key, Rate, Scrubber } from './Controls'
import { astar, seedWalls, type Frame, type Grid } from './astar'
import { useStepper } from './useStepper'

const BASE = 'var(--r-0)'
const WALL = 'var(--c-wire)'
const OPEN = 'var(--r-lc-1)'
const CLOSED = 'var(--r-lc-2)'
const PATH = 'var(--c-live)'
const HEAD = 'var(--r-gh-4)'
const ENDS = 'var(--c-cool)'

export function PathInstrument({ tall }: { tall: boolean }) {
  const cols = tall ? 53 : 25
  const rows = tall ? 21 : 13
  const size = cols * rows

  const start = useMemo(() => rows * 0 + Math.floor(rows / 2) * cols + 1, [cols, rows])
  const goal = useMemo(() => Math.floor(rows / 2) * cols + (cols - 2), [cols, rows])

  const [walls, setWalls] = useState<Set<number>>(() => seedWalls(cols, rows))
  const [rate, setRate] = useState(30)
  const st = useStepper<Frame>(rate)
  const { load, stop } = st

  const rects = useRef<Array<SVGRectElement | null>>([])
  const painting = useRef<null | 'add' | 'remove'>(null)

  const grid: Grid = useMemo(() => ({ cols, rows, walls, start, goal }), [cols, rows, walls, start, goal])

  const solve = useCallback(
    (autostart: boolean) => {
      load(astar({ cols, rows, walls: new Set(walls), start, goal }), autostart)
    },
    [load, cols, rows, walls, start, goal],
  )

  // Editing the obstacle field invalidates the search in progress; the pane
  // rewinds to a fresh search rather than showing a path through a new wall.
  useEffect(() => {
    solve(false)
  }, [solve])

  useEffect(() => {
    setWalls(seedWalls(cols, rows))
  }, [cols, rows])

  /* Painting the grid mutates fills directly; 1100 cells through React at
     30 frames a second is a lot of diffing for no benefit. */
  const frame = st.frame
  useEffect(() => {
    const open = new Set(frame?.open ?? [])
    const closed = new Set(frame?.closed ?? [])
    const path = new Set(frame?.path ?? [])
    for (let i = 0; i < size; i++) {
      const el = rects.current[i]
      if (!el) continue
      let c = BASE
      if (open.has(i)) c = OPEN
      if (closed.has(i)) c = CLOSED
      if (path.has(i)) c = PATH
      if (frame?.current === i && !path.size) c = HEAD
      if (walls.has(i)) c = WALL
      if (i === start || i === goal) c = ENDS
      el.setAttribute('fill', c)
    }
  }, [frame, walls, size, start, goal])

  const cellAt = (e: React.PointerEvent<SVGSVGElement>): number | null => {
    const svg = e.currentTarget
    const r = svg.getBoundingClientRect()
    const x = Math.floor((e.clientX - r.left) / U)
    const y = Math.floor((e.clientY - r.top) / U)
    if (x < 0 || y < 0 || x >= cols || y >= rows) return null
    const i = y * cols + x
    return i === start || i === goal ? null : i
  }

  const paint = (i: number) => {
    setWalls((w) => {
      const next = new Set(w)
      if (painting.current === 'remove') next.delete(i)
      else next.add(i)
      return next
    })
  }

  const w = cols * U - (U - CELL)
  const h = rows * U - (U - CELL)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-1">
        <span className="text-xs text-dim">a* · manhattan · 4-connected</span>
        <span className="ml-auto text-xs text-dim tabular-nums">
          {frame?.expanded ?? 0} exp · {frame?.open.length ?? 0} frontier
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          className="block touch-none select-none"
          style={{ cursor: 'cell' }}
          role="application"
          aria-label="Obstacle grid. Drag to place walls, then solve."
          onPointerDown={(e) => {
            const i = cellAt(e)
            if (i === null) return
            e.currentTarget.setPointerCapture(e.pointerId)
            painting.current = walls.has(i) ? 'remove' : 'add'
            stop()
            paint(i)
          }}
          onPointerMove={(e) => {
            if (!painting.current) return
            const i = cellAt(e)
            if (i !== null) paint(i)
          }}
          onPointerUp={() => {
            painting.current = null
          }}
          onPointerCancel={() => {
            painting.current = null
          }}
        >
          {Array.from({ length: size }, (_, i) => (
            <rect
              key={i}
              ref={(el) => {
                rects.current[i] = el
              }}
              x={(i % cols) * U}
              y={Math.floor(i / cols) * U}
              width={CELL}
              height={CELL}
              fill={BASE}
              style={{ transition: 'fill 80ms linear' }}
            />
          ))}
        </svg>
      </div>

      <p className="text-xs text-dim" aria-live="polite" style={{ minHeight: 13 }}>
        {frame?.note}
      </p>

      <Scrubber at={st.at} length={st.length} onSeek={st.seek} label="search step" />

      <div className="flex flex-wrap items-center gap-1">
        <Key title={st.running ? 'pause' : 'solve'} onClick={st.toggle} active={st.running}>
          {st.running ? '❙❙' : '▸'}
        </Key>
        <Key title="step back" onClick={st.back} disabled={st.at <= 0}>
          ◂|
        </Key>
        <Key title="step forward" onClick={st.forward} disabled={st.finished && st.at >= st.length - 1}>
          |▸
        </Key>
        <Key title="restart the search" onClick={() => solve(false)}>
          ↺
        </Key>
        <Key title="clear all walls" onClick={() => setWalls(new Set())}>
          clear
        </Key>
        <Key title="reseed the obstacle field" onClick={() => setWalls(seedWalls(cols, rows))}>
          seed
        </Key>
        <Rate value={rate} onChange={setRate} />
      </div>

      <p className="text-xs text-dim">
        drag on the grid to add or remove walls · {grid.walls.size} placed
      </p>
    </div>
  )
}
