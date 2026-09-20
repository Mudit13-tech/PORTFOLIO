'use client'

import { ageDays } from '@/lib/date'
import { useNow } from '@/hooks/useNow'
import type { EventKind, LogEvent, Snapshot } from '@/lib/types'
import { Fault, Idle, Pane } from '../Pane'

const TONE: Record<EventKind, string> = {
  commit: 'text-live',
  repo: 'text-live',
  solved: 'text-cool',
  contest: 'text-cool',
  system: 'text-dim',
}

const TAG: Record<EventKind, string> = {
  commit: 'commit',
  repo: 'repo',
  solved: 'solved',
  contest: 'contest',
  system: 'sys',
}

/**
 * dmesg for a person.
 *
 * The bracketed column is age in days, signed into the past. It looks like a
 * monotonic clock because that is the shape the eye expects there, but it is a
 * real measurement rather than a stage prop.
 */
function Row({ e, now }: { e: LogEvent; now: number }) {
  const age = ageDays(e.t, now)
  const stamp = `${age <= -100 ? age.toFixed(0) : age.toFixed(1)}d`
  const body = (
    <>
      <span className={TONE[e.kind]}>{TAG[e.kind]}</span>
      <span className="text-wire"> </span>
      <span className="text-text">{e.text}</span>
      {e.meta ? <span className="text-dim"> · {e.meta}</span> : null}
    </>
  )
  return (
    <li className="flex gap-1 text-xs leading-[13px]">
      <time
        dateTime={e.t}
        className="shrink-0 text-right tabular-nums text-dim"
        style={{ width: 52 }}
      >
        [{stamp}]
      </time>
      <span className="min-w-0 truncate">
        {e.href ? (
          <a href={e.href} target="_blank" rel="noreferrer" className="no-underline hover:underline">
            {body}
          </a>
        ) : (
          body
        )}
      </span>
    </li>
  )
}

export function LogPane({ snapshot, seq }: { snapshot: Snapshot; seq: number }) {
  const now = useNow(snapshot.generatedAt)
  const events = snapshot.events
  const offline = snapshot.channels.every((c) => c.state === 'offline')

  return (
    <Pane id="log" seq={seq} meta={`${events.length} events`} bodyClass="py-1">
      {events.length === 0 ? (
        offline ? (
          <Fault
            line="no feed — both channels offline"
            hint="the log reports what the channels reported. they reported nothing."
          />
        ) : (
          <Idle line="no events in the window" hint="the feed fills as the channels report" />
        )
      ) : (
        <ol className="flex flex-col gap-1">
          {events.map((e, i) => (
            <Row key={`${e.t}-${i}`} e={e} now={now} />
          ))}
        </ol>
      )}
    </Pane>
  )
}
