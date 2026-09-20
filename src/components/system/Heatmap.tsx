'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { activity } from '~/data'
import {
  byMonth,
  cells,
  DOW,
  WEEKS,
  activityStats,
  longDate,
  monthTicks,
  weekdayName,
  type Cell,
} from '@/lib/activity'

/**
 * The contribution heatmap.
 *
 * One year, two channels, one grid. GitHub contributions fill the upper-left
 * triangle of a day; LeetCode submissions fill the lower-right. They are drawn
 * side by side and never added together — a commit count plus a problem count
 * is a number that means nothing.
 *
 * Both ramps are single-hue and step from this year's own quartiles, so the
 * colour says "busy for me" rather than "busy compared to an invented ceiling".
 *
 * The drawing is `aria-hidden` presentation. What a screen reader gets is the
 * live readout below it — which announces each day as the cursor moves — and
 * the monthly table underneath, because a 371-cell grid read one cell at a
 * time is not an accessible alternative to anything.
 */

interface Props {
  /** How many trailing weeks to draw. Defaults to the whole window. */
  weeks?: number
  cell?: number
  gap?: number
  /** Weekday column, month ticks, legend and table. Off for the desk widget. */
  full?: boolean
}

const RAMP_GH = ['var(--hm-0)', 'var(--hm-gh-1)', 'var(--hm-gh-2)', 'var(--hm-gh-3)', 'var(--hm-gh-4)']
const RAMP_LC = ['var(--hm-0)', 'var(--hm-lc-1)', 'var(--hm-lc-2)', 'var(--hm-lc-3)', 'var(--hm-lc-4)']

export function Heatmap({ weeks = WEEKS, cell = 11, gap = 3, full = true }: Props) {
  const unit = cell + gap
  const labelW = full ? 26 : 0
  const labelH = full ? 14 : 0

  const firstWeek = Math.max(0, WEEKS - weeks)
  const shown = useMemo(() => cells.filter((c) => c.week >= firstWeek), [firstWeek])
  const cols = WEEKS - firstWeek

  const width = labelW + cols * unit - gap
  const height = labelH + DOW * unit - gap

  const [cursor, setCursor] = useState<number | null>(null)
  const scroller = useRef<HTMLDivElement>(null)

  const at = useCallback(
    (week: number, dow: number): number | null => {
      const i = (week - firstWeek) * DOW + dow
      return i >= 0 && i < shown.length ? i : null
    },
    [firstWeek, shown.length],
  )

  /** One listener for the whole grid rather than 371 — the cell is arithmetic. */
  const onPointer = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const box = e.currentTarget.getBoundingClientRect()
      const scale = box.width / width
      const x = (e.clientX - box.left) / scale - labelW
      const y = (e.clientY - box.top) / scale - labelH
      const week = Math.floor(x / unit)
      const dow = Math.floor(y / unit)
      if (week < 0 || dow < 0 || dow >= DOW) return setCursor(null)
      setCursor(at(firstWeek + week, dow))
    },
    [at, firstWeek, labelH, labelW, unit, width],
  )

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const step: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        PageUp: [-4, 0],
        PageDown: [4, 0],
      }
      if (e.key === 'Home') {
        e.preventDefault()
        setCursor(0)
        return
      }
      if (e.key === 'End') {
        e.preventDefault()
        setCursor(shown.length - 1)
        return
      }
      const move = step[e.key]
      if (!move) return
      e.preventDefault()
      const from = cursor ?? shown.length - 1
      const c = shown[from]
      const week = Math.min(WEEKS - 1, Math.max(firstWeek, c.week + move[0]))
      const dow = Math.min(DOW - 1, Math.max(0, c.dow + move[1]))
      const next = at(week, dow)
      if (next !== null) setCursor(next)
    },
    [at, cursor, firstWeek, shown],
  )

  // When the grid is wider than the window it is in, open on the most recent
  // weeks. Nobody scrolls a calendar to find out what someone did last week.
  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [])

  const active = cursor === null ? null : shown[cursor]

  const summary = `Activity calendar. ${activityStats.days} days to ${activityStats.to}: ${activityStats.commits} contributions and ${activityStats.solved} problems solved across ${activityStats.activeDays} active days.`

  return (
    <figure className="m-0">
      <div
        ref={scroller}
        tabIndex={0}
        role="group"
        aria-label={summary}
        onKeyDown={onKeyDown}
        className="overflow-x-auto overflow-y-hidden rounded-sm"
        style={{ scrollbarWidth: 'thin' }}
      >
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="block"
          aria-hidden="true"
          focusable="false"
          onPointerMove={onPointer}
          onPointerLeave={() => setCursor(null)}
        >
          <defs>
            <clipPath id="hm-cell" clipPathUnits="userSpaceOnUse">
              <rect width={cell} height={cell} rx={Math.min(2, cell / 4)} />
            </clipPath>
            <path id="hm-ul" d={`M0 0h${cell}L0 ${cell}z`} />
            <path id="hm-lr" d={`M${cell} 0v${cell}H0z`} />
          </defs>

          {full && (
            <g fill="var(--text-tertiary)" fontSize="10" style={{ fontFamily: 'inherit' }}>
              {monthTicks
                .filter((m) => m.week >= firstWeek)
                .map((m) => (
                  <text key={m.label + m.week} x={labelW + (m.week - firstWeek) * unit} y={labelH - 5}>
                    {m.label}
                  </text>
                ))}
              {[1, 3, 5].map((d) => (
                <text key={d} x={0} y={labelH + d * unit + cell - 1}>
                  {weekdayName(d).slice(0, 3)}
                </text>
              ))}
            </g>
          )}

          {shown.map((c, i) => (
            <g
              key={c.day.date}
              transform={`translate(${labelW + (c.week - firstWeek) * unit} ${labelH + c.dow * unit})`}
              clipPath="url(#hm-cell)"
            >
              <rect width={cell} height={cell} fill="var(--hm-0)" />
              {c.gh > 0 && <use href="#hm-ul" fill={RAMP_GH[c.gh]} />}
              {c.lc > 0 && <use href="#hm-lr" fill={RAMP_LC[c.lc]} />}
              {/* A surface-coloured seam, so two filled triangles never blend
                  into one block of colour. */}
              {c.gh > 0 && c.lc > 0 && (
                <line x1={cell} y1={0} x2={0} y2={cell} stroke="var(--hm-seam)" strokeWidth="1.5" />
              )}
              {i === cursor && (
                <rect
                  width={cell}
                  height={cell}
                  fill="none"
                  stroke="var(--focus-ring)"
                  strokeWidth="2"
                />
              )}
            </g>
          ))}
        </svg>
      </div>

      <p
        aria-live="polite"
        className={`mono ${full ? 'text-[12px]' : 'text-[11px]'} text-secondary mt-2 truncate`}
      >
        {active ? <Readout cell={active} /> : <Idle full={full} />}
      </p>

      {full && (
        <>
          <Legend />
          <details className="mt-3">
            <summary className="mono text-[12px] text-tertiary cursor-pointer hover:text-primary">
              Read it as a table
            </summary>
            <table className="mt-2 w-full mono text-[12px] text-secondary">
              <caption className="sr-only">
                Monthly totals for the window {activity.from} to {activity.to}
              </caption>
              <thead>
                <tr className="text-tertiary text-left">
                  <th scope="col" className="font-normal">Month</th>
                  <th scope="col" className="font-normal text-right">Contributions</th>
                  <th scope="col" className="font-normal text-right">Solved</th>
                  <th scope="col" className="font-normal text-right">Active days</th>
                </tr>
              </thead>
              <tbody>
                {byMonth.map((m) => (
                  <tr key={m.key} className="border-t border-subtle/50">
                    <th scope="row" className="font-normal text-left">{m.label}</th>
                    <td className="text-right tabular-nums">{m.commits}</td>
                    <td className="text-right tabular-nums">{m.solved}</td>
                    <td className="text-right tabular-nums">{m.days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </figure>
  )
}

function Readout({ cell }: { cell: Cell }) {
  const { day } = cell
  const quiet = day.commits === 0 && day.solved === 0
  return (
    <>
      <span className="text-primary">{longDate(day.date)}</span>
      <span className="text-tertiary"> — </span>
      {quiet ? (
        <span className="text-tertiary">nothing recorded</span>
      ) : (
        <>
          <span style={{ color: 'var(--hm-gh-4)' }}>{day.commits} contributions</span>
          <span className="text-tertiary"> · </span>
          <span style={{ color: 'var(--hm-lc-4)' }}>{day.solved} solved</span>
          {day.hardest && <span className="text-tertiary"> · hardest {day.hardest}</span>}
        </>
      )}
    </>
  )
}

function Idle({ full }: { full: boolean }) {
  if (!full) {
    return <span className="text-tertiary">hover a day · to {activityStats.to}</span>
  }
  return (
    <span className="text-tertiary">
      {activityStats.days} days to {activityStats.to} · hover or arrow through a day
    </span>
  )
}

/** Identity is never carried by colour alone: each ramp is named beside it. */
function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3">
      <LegendRow label="contributions" ramp={RAMP_GH} />
      <LegendRow label="problems solved" ramp={RAMP_LC} />
    </div>
  )
}

function LegendRow({ label, ramp }: { label: string; ramp: string[] }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="micro text-tertiary">{label}</span>
      <span className="flex items-center gap-[2px]" aria-hidden="true">
        {ramp.map((c, i) => (
          <span
            key={i}
            className="w-2.5 h-2.5 rounded-[2px]"
            style={{ background: c, border: '1px solid var(--hm-seam)' }}
          />
        ))}
      </span>
      <span className="micro text-tertiary">less → more</span>
    </span>
  )
}
