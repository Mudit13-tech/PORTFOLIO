'use client'

import { CELL, GUT, U } from '@/lib/lattice'
import { longDate } from '@/lib/date'
import { useQuiet, useWorkspace } from '@/lib/workspace'
import type { Channel, Snapshot } from '@/lib/types'
import { Fault, Pane } from '../Pane'
import { Heatmap } from '../heatmap/Heatmap'
import { SEED_MODE } from '../heatmap/life'

/* The description follows the seeding rule, so it cannot describe a seed the
   simulation is not actually using. */
const SEED_NOTE =
  SEED_MODE === 'parity'
    ? 'conway b3/s23 on a 53 by 7 torus, seeded from days with an odd event count'
    : 'conway b3/s23 on a 53 by 7 torus, seeded from every day you were active'

const GH = ['var(--r-0)', 'var(--r-gh-1)', 'var(--r-gh-2)', 'var(--r-gh-3)', 'var(--r-gh-4)']
const LC = ['var(--r-0)', 'var(--r-lc-1)', 'var(--r-lc-2)', 'var(--r-lc-3)', 'var(--r-lc-4)']

/** The legend is made of the same cell as the calendar, halved the same way. */
function Legend({ ramp, corner }: { ramp: string[]; corner: 'ul' | 'lr' }) {
  const w = 5 * U - GUT
  return (
    <svg width={w} height={CELL} viewBox={`0 0 ${w} ${CELL}`} aria-hidden="true" className="shrink-0">
      {ramp.map((c, i) => (
        <path
          key={i}
          transform={`translate(${i * U} 0)`}
          d={corner === 'ul' ? `M0 0h${CELL}L0 ${CELL}z` : `M${CELL} 0v${CELL}H0z`}
          fill={c}
        />
      ))}
    </svg>
  )
}

function ChannelLine({ channel, ramp, corner }: { channel: Channel; ramp: string[]; corner: 'ul' | 'lr' }) {
  const bad = channel.state !== 'ok'
  return (
    <div className="flex flex-wrap items-center gap-1 text-xs">
      <span className="text-dim">{channel.id === 'github' ? 'ch0' : 'ch1'}</span>
      <span className={bad ? 'text-alert' : 'text-dim'}>{channel.label}</span>
      <span className="tabular-nums text-text">
        {channel.total.toLocaleString()}
      </span>
      <span className="text-dim">
        {channel.id === 'github' ? 'contributions' : 'accepted'} over {channel.activeDays} days
      </span>
      <span className="ml-auto flex items-center gap-1">
        <span className="text-dim">less</span>
        <Legend ramp={ramp} corner={corner} />
        <span className="text-dim">more</span>
      </span>
      {channel.note ? <p className="w-full text-alert">{channel.note}</p> : null}
    </div>
  )
}

export function ActivityPane({ snapshot, seq }: { snapshot: Snapshot; seq: number }) {
  const { state, dispatch } = useWorkspace()
  const quiet = useQuiet()
  const running = state.life.running
  const [gh, lc] = snapshot.channels
  const dead = snapshot.channels.every((c) => c.state === 'offline')

  return (
    <Pane
      id="activity"
      seq={seq}
      meta={`${snapshot.days.length} d · sampled ${snapshot.fallback ? 'never' : longDate(snapshot.generatedAt.slice(0, 10))}`}
    >
      {dead ? (
        <Fault
          line="both channels offline — no sample held"
          hint="the committed snapshot is the checked-in fallback. run npm run sync to take a reading."
        />
      ) : (
        <div className="flex flex-col gap-1">
          <Heatmap days={snapshot.days} asOf={snapshot.generatedAt} />

          <div className="rule flex flex-col gap-1 pt-1">
            <ChannelLine channel={gh} ramp={GH} corner="ul" />
            <ChannelLine channel={lc} ramp={LC} corner="lr" />
          </div>

          <div className="rule flex flex-wrap items-center gap-1 pt-1 text-xs">
            <button
              type="button"
              onClick={() => dispatch({ type: 'life', running: !running })}
              aria-pressed={running}
              className={`border px-1 transition-colors ${running ? 'border-live text-live' : 'border-wire text-dim hover:border-live hover:text-live'}`}
              style={{ height: 26 }}
            >
              {running ? 'r · restore data' : 'g · seed life'}
            </button>
            {running && quiet ? (
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('ics:life-step'))}
                className="border border-wire px-1 text-dim transition-colors hover:border-live hover:text-live"
                style={{ height: 26 }}
              >
                step
              </button>
            ) : null}
            <p className="text-dim">
              {running
                ? quiet
                  ? `${SEED_NOTE} · stepping is manual while motion is reduced`
                  : SEED_NOTE
                : 'upper-left reads channel 0, lower-right reads channel 1'}
            </p>
          </div>
        </div>
      )}
    </Pane>
  )
}
