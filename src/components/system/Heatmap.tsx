'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { activity } from '~/data'
import {
  byMonth,
  channels,
  DOW,
  WEEKS,
  activityStats,
  longDate,
  monthTicks,
  weekdayName,
  type Cell,
  type Channel,
  type ChannelId,
} from '@/lib/activity'

/**
 * One contribution calendar, for one source.
 *
 * GitHub and LeetCode get a grid each. They are measured in different units,
 * so they are never stacked in one cell and never summed — and each ramp steps
 * from its own channel's quartiles, so a colour means "busy for this person on
 * this channel" rather than "busy against a ceiling somebody invented".
 *
 * The drawing is `aria-hidden` presentation. What a screen reader gets is the
 * live readout below it — which announces each day as the cursor moves — and
 * the monthly table underneath, because a 371-cell grid read one cell at a
 * time is not an accessible alternative to anything.
 */

interface Props {
  channel: ChannelId
  /** How many trailing weeks to draw. Defaults to the whole window. */
  weeks?: number
  cell?: number
  gap?: number
  /** Weekday column, month ticks and legend. Off for the desk widget. */
  full?: boolean
}

export function Heatmap({ channel, weeks = WEEKS, cell = 11, gap = 3, full = true }: Props) {
  const ch = channels[channel]
  const unit = cell + gap
  const labelW = full ? 26 : 0
  const labelH = full ? 14 : 0

  const firstWeek = Math.max(0, WEEKS - weeks)
  const shown = useMemo(() => ch.cells.filter((c) => c.week >= firstWeek), [ch, firstWeek])
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
  const clip = `hm-clip-${channel}-${cell}`

  const summary = `${ch.label} calendar. ${ch.total} ${ch.unit} across ${ch.activeDays} days, in the ${activityStats.days} days to ${activityStats.to}.`

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
            <clipPath id={clip} clipPathUnits="userSpaceOnUse">
              <rect width={cell} height={cell} rx={Math.min(2.5, cell / 3.5)} />
            </clipPath>
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
              clipPath={`url(#${clip})`}
            >
              <rect width={cell} height={cell} fill={ch.ramp[c.level]} />
              {/* A one-pixel lit top edge on a filled cell. It is what stops a
                  block of the same level reading as one flat rectangle. */}
              {c.level > 0 && (
                <rect width={cell} height={1} fill="rgb(255 255 255 / 0.16)" />
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
        {active ? <Readout cell={active} channel={ch} /> : <Idle channel={ch} full={full} />}
      </p>

      {full && <Legend channel={ch} />}
    </figure>
  )
}

function Readout({ cell, channel }: { cell: Cell; channel: Channel }) {
  return (
    <>
      <span className="text-primary">{longDate(cell.day.date)}</span>
      <span className="text-tertiary"> — </span>
      {cell.count === 0 ? (
        <span className="text-tertiary">nothing recorded</span>
      ) : (
        <>
          <span style={{ color: channel.ramp[4] }}>
            {cell.count} {channel.unit}
          </span>
          {channel.id === 'solved' && cell.day.hardest && (
            <span className="text-tertiary"> · hardest {cell.day.hardest}</span>
          )}
        </>
      )}
    </>
  )
}

function Idle({ channel, full }: { channel: Channel; full: boolean }) {
  if (!full) {
    return (
      <span className="text-tertiary">
        {channel.activeDays} days · longest run {channel.longest}
      </span>
    )
  }
  // The window is already named in the section header above; repeating it
  // under every calendar is noise.
  return <span className="text-tertiary">hover or arrow through a day</span>
}

/** Identity is never carried by colour alone: the ramp is named beside it. */
function Legend({ channel }: { channel: Channel }) {
  const [a, b, c] = channel.cuts
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2.5">
      <span className="micro text-tertiary">
        none · 1–{a} · {a + 1}–{b} · {b + 1}–{c} · {c + 1}+
      </span>
      <span className="flex items-center gap-[3px]" aria-hidden="true">
        {channel.ramp.map((color, i) => (
          <span
            key={i}
            className="w-3 h-3 rounded-[3px]"
            style={{ background: color, boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.16)' }}
          />
        ))}
      </span>
      <span className="micro text-tertiary">{channel.unit} per day</span>
    </div>
  )
}

/**
 * The table alternative to both grids. One table rather than two, because the
 * comparison between the channels is the interesting part and a screen reader
 * should not have to hold one table in their head to read the other.
 */
export function ActivityTable() {
  return (
    <details className="mt-4">
      <summary className="mono text-[12px] text-tertiary cursor-pointer hover:text-primary">
        Read both calendars as a table
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
  )
}
