'use client'

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CELL,
  DAYS,
  GRID_H,
  GRID_W,
  GUT,
  LABEL_H,
  LABEL_W,
  LIFE_FADE_MS,
  LIFE_MS,
  SEAM,
  U,
  WEEKS,
} from '@/lib/lattice'
import { level, scales, type Level } from '@/lib/ramp'
import { asOfDay, longDate, monthShort, parseIso, weekdayLong } from '@/lib/date'
import { setReadout, clearReadout } from '@/lib/readout'
import { useQuiet, useWorkspace } from '@/lib/workspace'
import type { Day } from '@/lib/types'
import { dayIndex, same, seedFrom, step } from './life'

const RAMP_GH = ['var(--r-0)', 'var(--r-gh-1)', 'var(--r-gh-2)', 'var(--r-gh-3)', 'var(--r-gh-4)']
const RAMP_LC = ['var(--r-0)', 'var(--r-lc-1)', 'var(--r-lc-2)', 'var(--r-lc-3)', 'var(--r-lc-4)']

interface Cell {
  day: Day
  week: number
  dow: number
  x: number
  y: number
  gh: Level
  lc: Level
  beyond: boolean
}

function build(days: Day[], todayMs: number): Cell[] {
  const t = scales(days)
  return days.map((day, i) => {
    const week = Math.floor(i / DAYS)
    const dow = i % DAYS
    return {
      day,
      week,
      dow,
      x: LABEL_W + week * U,
      y: LABEL_H + dow * U,
      gh: level(day.commits, t.gh),
      lc: level(day.solved, t.lc),
      beyond: parseIso(day.date).getTime() > todayMs,
    }
  })
}

/** Month label at the first column of each month that has room to be read. */
function monthTicks(cells: Cell[]) {
  const out: Array<{ label: string; x: number }> = []
  let last = ''
  for (let w = 0; w < WEEKS; w++) {
    const c = cells[w * DAYS]
    if (!c) continue
    const m = monthShort(c.day.date)
    if (m !== last && w < WEEKS - 2) {
      out.push({ label: m, x: LABEL_W + w * U })
      last = m
    }
  }
  return out
}

/* ---------------------------------------------------------- measured layer */

const Measured = memo(function Measured({ cells }: { cells: Cell[] }) {
  return (
    <g>
      {cells.map((c) => {
        if (c.beyond) return null
        const both = c.gh > 0 && c.lc > 0
        return (
          <g key={c.day.date} transform={`translate(${c.x} ${c.y})`}>
            <use href="#c-sq" fill="var(--r-0)" />
            {c.gh > 0 && <use href="#c-ul" fill={RAMP_GH[c.gh]} />}
            {c.lc > 0 && <use href="#c-lr" fill={RAMP_LC[c.lc]} />}
            {both && <use href="#c-dg" stroke="var(--c-seam)" strokeWidth={SEAM} />}
          </g>
        )
      })}
    </g>
  )
})

/* -------------------------------------------------------------------- view */

export function Heatmap({ days, asOf }: { days: Day[]; asOf: string }) {
  const { state, dispatch } = useWorkspace()
  const quiet = useQuiet()
  const scrollRef = useRef<HTMLDivElement>(null)

  /* The sampling instant, not the viewing instant: a day the snapshot never
     covered stays uncovered, and the grid renders identically on the server
     and in the browser. */
  const todayMs = useMemo(
    () => asOfDay(asOf, days[0].date, days[days.length - 1].date),
    [asOf, days],
  )

  const cells = useMemo(() => build(days, todayMs), [days, todayMs])
  const months = useMemo(() => monthTicks(cells), [cells])
  const lastLive = useMemo(() => {
    for (let i = cells.length - 1; i >= 0; i--) if (!cells[i].beyond) return i
    return cells.length - 1
  }, [cells])

  const [cursor, setCursor] = useState(lastLive)

  /* --------------------------------------------------- simulation plumbing */
  const [armed, setArmed] = useState(false)
  const lifeRefs = useRef<Array<SVGUseElement | null>>([])
  const measuredRef = useRef<SVGGElement>(null)
  const boards = useRef<{ a: Uint8Array; b: Uint8Array } | null>(null)
  const timer = useRef<number | null>(null)
  const raf = useRef<number | null>(null)
  const gen = useRef(0)

  const running = state.life.running

  const paint = useCallback((board: Uint8Array) => {
    for (let i = 0; i < board.length; i++) {
      const el = lifeRefs.current[dayIndex(i)]
      if (el) el.style.fillOpacity = board[i] ? '1' : '0'
    }
  }, [])

  // Mount the simulation layer the first time it is asked for, so the document
  // that ships to a first-time visitor carries only the measured year.
  useEffect(() => {
    if (running) setArmed(true)
  }, [running])

  useEffect(() => {
    if (!armed) return
    const clear = () => {
      if (timer.current !== null) window.clearInterval(timer.current)
      if (raf.current !== null) cancelAnimationFrame(raf.current)
      timer.current = null
      raf.current = null
    }

    const measured = measuredRef.current
    const seed = seedFrom(cells.map((c) => (c.beyond ? null : c.day.commits + c.day.solved)))

    if (!running) {
      // Back to measured data: retract the simulation, restore full contrast.
      clear()
      gen.current = 0
      clearReadout()
      const from = performance.now()
      const back = () => {
        const t = quiet ? 1 : Math.min(1, (performance.now() - from) / LIFE_FADE_MS)
        if (measured) measured.style.opacity = String(0.22 + 0.78 * t)
        for (const el of lifeRefs.current) if (el) el.style.opacity = String(1 - t)
        if (t < 1) raf.current = requestAnimationFrame(back)
        else setArmed(false)
      }
      back()
      return clear
    }

    // Into simulation: the measured year recedes but stays legible underneath,
    // and the seed propagates across the board one column at a time, so the
    // handoff reads as the data becoming the population rather than a cut.
    boards.current = { a: seed, b: new Uint8Array(seed.length) }
    let alive = seed.reduce<number>((n, v) => n + v, 0)
    setReadout({ kind: 'life', gen: 0, alive })

    for (const el of lifeRefs.current) if (el) el.style.opacity = '1'
    paint(seed)

    const from = performance.now()
    const stagger = quiet ? 0 : 5
    const enter = () => {
      const now = performance.now()
      const t = quiet ? 1 : Math.min(1, (now - from) / (LIFE_FADE_MS + stagger * WEEKS))
      if (measured) measured.style.opacity = String(1 - 0.78 * t)
      for (let i = 0; i < cells.length; i++) {
        const el = lifeRefs.current[i]
        if (!el) continue
        const d = quiet ? 0 : cells[i].week * stagger
        const p = Math.max(0, Math.min(1, (now - from - d) / LIFE_FADE_MS))
        el.style.opacity = String(p)
      }
      if (t < 1) raf.current = requestAnimationFrame(enter)
    }
    enter()

    if (quiet) return clear

    let prev = seed.slice()
    let prev2 = seed.slice()

    timer.current = window.setInterval(() => {
      const b = boards.current
      if (!b) return
      alive = step(b.a, b.b)
      const t = b.a
      b.a = b.b
      b.b = t
      gen.current += 1
      paint(b.a)

      const still = same(b.a, prev)
      const oscillating = same(b.a, prev2)
      prev2 = prev
      prev = b.a.slice()

      if (alive === 0) {
        clear()
        setReadout({ kind: 'note', text: `life · extinct at gen ${gen.current} · r restores the year`, tone: 'alert' })
        return
      }
      if (still || oscillating) {
        clear()
        setReadout({
          kind: 'note',
          text: `life · settled at gen ${gen.current} · ${alive} ${still ? 'still' : 'oscillating'} · r restores the year`,
          tone: 'live',
        })
        return
      }
      setReadout({ kind: 'life', gen: gen.current, alive })
    }, LIFE_MS)

    return clear
  }, [armed, running, cells, quiet, paint])

  /** Reduced motion gets a deliberate single step instead of a 6fps timer. */
  const stepOnce = useCallback(() => {
    const b = boards.current
    if (!b) return
    const alive = step(b.a, b.b)
    const t = b.a
    b.a = b.b
    b.b = t
    gen.current += 1
    paint(b.a)
    setReadout({ kind: 'life', gen: gen.current, alive })
  }, [paint])

  useEffect(() => {
    if (!running) return
    const onStep = () => stepOnce()
    window.addEventListener('ics:life-step', onStep)
    return () => window.removeEventListener('ics:life-step', onStep)
  }, [running, stepOnce])

  /* ------------------------------------------------------------- readout */
  const report = useCallback((c: Cell) => {
    if (c.beyond) return
    setReadout({
      kind: 'cell',
      date: c.day.date,
      commits: c.day.commits,
      solved: c.day.solved,
      hardest: c.day.hardest,
    })
  }, [])

  /* Open on the most recent weeks when the calendar has to scroll. */
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [])

  const onKey = useCallback(
    (e: React.KeyboardEvent) => {
      const k = e.key
      const map: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0], h: [-1, 0],
        ArrowRight: [1, 0], l: [1, 0],
        ArrowUp: [0, -1], k: [0, -1],
        ArrowDown: [0, 1], j: [0, 1],
        PageUp: [-4, 0], PageDown: [4, 0],
      }
      let next: number | null = null
      if (map[k]) {
        const [dw, dd] = map[k]
        const c = cells[cursor]
        const w = Math.max(0, Math.min(WEEKS - 1, c.week + dw))
        const d = Math.max(0, Math.min(DAYS - 1, c.dow + dd))
        next = w * DAYS + d
      } else if (k === 'Home') next = cursor - (cursor % DAYS) === cursor ? 0 : cells[cursor].dow
      else if (k === 'End') next = lastLive

      if (next === null) return
      e.preventDefault()
      e.stopPropagation()
      const clamped = Math.min(next, lastLive)
      setCursor(clamped)
      report(cells[clamped])
      const btn = document.getElementById(`cell-${clamped}`)
      btn?.focus({ preventScroll: false })
    },
    [cells, cursor, lastLive, report],
  )

  const lifeLayer = useMemo(
    () =>
      armed ? (
        <g aria-hidden="true">
          {cells.map((c, i) => (
            <use
              key={c.day.date}
              ref={(el) => {
                lifeRefs.current[i] = el
              }}
              href="#c-sq"
              x={c.x}
              y={c.y}
              fill="var(--c-live)"
              style={{ fillOpacity: 0, opacity: 0, transition: 'fill-opacity 140ms linear' }}
            />
          ))}
        </g>
      ) : null,
    [armed, cells],
  )

  const measuredLayer = useMemo(() => <Measured cells={cells} />, [cells])

  return (
    <div className="relative">
      {/* Frozen weekday column. It sits outside the scroller so the rows stay
          labelled once a narrow viewport scrolls the calendar. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-10 bg-panel"
        style={{ width: LABEL_W, height: GRID_H }}
      >
        {[1, 3, 5].map((d) => (
          <span
            key={d}
            className="absolute text-dim"
            style={{ top: LABEL_H + d * U, fontSize: 11, lineHeight: `${CELL}px` }}
          >
            {weekdayLong(d).slice(0, 3)}
          </span>
        ))}
      </div>

      <div
        ref={scrollRef}
        className="overflow-x-auto overflow-y-hidden"
        style={{ scrollbarWidth: 'thin' }}
      >
        <div className="relative" style={{ width: GRID_W, height: GRID_H }}>
        <svg
          width={GRID_W}
          height={GRID_H}
          viewBox={`0 0 ${GRID_W} ${GRID_H}`}
          className="block"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            {/* One cell, four ways. Every instance is a <use> of these. */}
            <path id="c-sq" d={`M0 0h${CELL}v${CELL}H0z`} />
            <path id="c-ul" d={`M0 0h${CELL}L0 ${CELL}z`} />
            <path id="c-lr" d={`M${CELL} 0v${CELL}H0z`} />
            <line id="c-dg" x1={CELL} y1={0} x2={0} y2={CELL} />
            <mask id="c-sweep">
              <rect
                x={0}
                y={0}
                width={GRID_W}
                height={GRID_H}
                fill="#fff"
                style={{
                  transformBox: 'fill-box',
                  transformOrigin: 'left center',
                  animation: 'sweep 680ms cubic-bezier(0.33, 0.9, 0.4, 1) both',
                }}
              />
            </mask>
          </defs>

          <g fill="var(--c-dim)" fontSize={11} style={{ fontFamily: 'inherit' }}>
            {months.map((m) => (
              <text key={`${m.label}-${m.x}`} x={m.x} y={LABEL_H - GUT * 3}>
                {m.label}
              </text>
            ))}
          </g>

          <g mask="url(#c-sweep)">
            <g ref={measuredRef}>{measuredLayer}</g>
            {lifeLayer}
          </g>
        </svg>

        {/* The interactive surface. Real elements, real focus, real labels —
            the drawing above is presentation only. */}
        <div
          role="grid"
          aria-label={`Contribution calendar, ${days.length} days to ${days[days.length - 1]?.date}`}
          data-cells=""
          className="absolute"
          style={{ left: LABEL_W, top: LABEL_H }}
          onKeyDown={onKey}
          onMouseLeave={clearReadout}
        >
          {Array.from({ length: DAYS }, (_, dow) => (
            <div
              key={dow}
              role="row"
              aria-label={weekdayLong(dow)}
              style={{ display: 'flex', gap: GUT, marginBottom: GUT }}
            >
              {Array.from({ length: WEEKS }, (_, w) => {
                const i = w * DAYS + dow
                const c = cells[i]
                if (!c) return null
                const label = c.beyond
                  ? `${longDate(c.day.date)} — not yet sampled`
                  : `${longDate(c.day.date)}: ${c.day.commits} contribution${c.day.commits === 1 ? '' : 's'}, ${c.day.solved} problem${c.day.solved === 1 ? '' : 's'} solved${c.day.hardest ? `, hardest ${c.day.hardest}` : ''}`
                return (
                  <button
                    key={i}
                    id={`cell-${i}`}
                    type="button"
                    role="gridcell"
                    aria-label={label}
                    aria-disabled={c.beyond || undefined}
                    tabIndex={i === cursor ? 0 : -1}
                    onFocus={() => {
                      setCursor(i)
                      report(c)
                    }}
                    onMouseEnter={() => report(c)}
                    onClick={() => {
                      setCursor(i)
                      report(c)
                      dispatch({ type: 'focus', pane: 'activity' })
                    }}
                    className="block cursor-crosshair border-0 bg-transparent p-0 hover:outline hover:outline-1 hover:outline-live"
                    style={{ width: CELL, height: CELL }}
                  />
                )
              })}
            </div>
          ))}
        </div>
        </div>
      </div>
    </div>
  )
}
