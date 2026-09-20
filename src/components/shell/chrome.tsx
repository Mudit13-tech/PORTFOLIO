'use client'

import { useEffect, useRef, useState } from 'react'
import { buildVersion, meta, profile } from '~/data'
import { countFor } from '@/lib/derived'
import { CLOCK_DRIFT_MS, DOCK_H, TOP_BAR_H } from '@/os/constants'
import { APP_ORDER, APP_SUBTITLE, APP_TITLE, APP_PATH, pathFor } from '@/os/routes'
import { useSystem, useSystemApi } from '@/os/SystemProvider'
import type { AppId } from '@/os/types'
import { Glyph } from '@/components/ui'

/* ----------------------------------------------------------------- top bar
 * The escape hatch. A recruiter with ninety seconds must never have to be
 * clever, so Résumé and GitHub are fixed here and no window, boot screen or
 * animation is ever allowed to cover them.
 */
export function TopBar() {
  return (
    <header
      className="fixed top-0 inset-x-0 z-[500] flex items-center gap-3 px-3 border-b border-subtle bg-chrome/95 backdrop-blur-sm"
      style={{ height: TOP_BAR_H }}
    >
      <a href="/" className="flex items-center gap-2 shrink-0">
        <span className="text-ok" aria-hidden="true">
          ◈
        </span>
        <span className="mono text-[13px] text-primary">{meta.systemName}</span>
      </a>
      <span className="mono text-[11px] text-tertiary hidden sm:inline">build {buildVersion}</span>

      <nav className="ml-auto flex items-center gap-3 shrink-0">
        {profile.links.resume ? (
          <a
            href={profile.links.resume}
            target="_blank"
            rel="noreferrer"
            data-native="true"
            className="mono text-[12px] text-primary hover:text-ok underline underline-offset-2 decoration-subtle"
          >
            Résumé
          </a>
        ) : (
          <a
            href="/about"
            className="mono text-[12px] text-tertiary hover:text-primary"
            title="No résumé PDF published yet — the About window says what to do about it"
          >
            Résumé
          </a>
        )}
        <a
          href={profile.links.github}
          target="_blank"
          rel="noreferrer"
          data-native="true"
          className="mono text-[12px] text-primary hover:text-ok underline underline-offset-2 decoration-subtle"
        >
          GitHub
        </a>
        <Clock />
      </nav>
    </header>
  )
}

/**
 * The clock runs correctly for four minutes and then stops. Clicking it reports
 * how long you have actually been here and resumes — rewarding the observation
 * rather than deflecting it.
 */
function Clock() {
  const api = useSystemApi()
  const start = useRef(Date.now())
  const [now, setNow] = useState<Date | null>(null)
  const [stuck, setStuck] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    const t = setInterval(() => {
      if (Date.now() - start.current > CLOCK_DRIFT_MS && !stuck) setStuck(true)
      if (!stuck) setNow(new Date())
    }, 1000)
    setNow(new Date())
    return () => clearInterval(t)
  }, [stuck])

  const label = now
    ? `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    : '--:--'

  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => {
          if (!stuck) return
          const mins = Math.round((Date.now() - start.current) / 60000)
          setNote(`you've been here ${mins} minutes. That's longer than most.`)
          setStuck(false)
          api.findEgg('clock')
          setTimeout(() => setNote(null), 6000)
        }}
        className="mono text-[12px] text-secondary tabular-nums hover:text-primary"
        aria-label={stuck ? 'System time has stopped. Activate to resume.' : `System time ${label}`}
      >
        {label}
      </button>
      <span
        className={`w-1.5 h-1.5 rounded-full ${stuck ? 'bg-warn' : 'bg-ok'}`}
        aria-hidden="true"
      />
      {note && (
        <span className="absolute right-3 top-11 mono text-[12px] text-warn bg-window border border-subtle rounded-sm px-2 py-1 anim-notice">
          SYSTEM TIME — {note}
        </span>
      )}
    </span>
  )
}

/* -------------------------------------------------------------- icon grid
 * Real buttons in a grid with roving tabindex and arrow-key movement, each
 * wrapping a real link so the keyboard, the crawler and the mouse all agree.
 */
export function IconGrid() {
  const gridRef = useRef<HTMLUListElement>(null)
  const [active, setActive] = useState(0)

  const onKeyDown = (e: React.KeyboardEvent) => {
    const cols = 3
    let next = active
    if (e.key === 'ArrowRight') next = Math.min(active + 1, APP_ORDER.length - 1)
    else if (e.key === 'ArrowLeft') next = Math.max(active - 1, 0)
    else if (e.key === 'ArrowDown') next = Math.min(active + cols, APP_ORDER.length - 1)
    else if (e.key === 'ArrowUp') next = Math.max(active - cols, 0)
    else return
    e.preventDefault()
    setActive(next)
    gridRef.current?.querySelectorAll('a')[next]?.focus()
  }

  return (
    <ul
      ref={gridRef}
      onKeyDown={onKeyDown}
      className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-5 p-8 max-w-2xl"
      aria-label="Applications"
    >
      {APP_ORDER.map((id, i) => (
        <li key={id}>
          <a
            href={APP_PATH[id]}
            tabIndex={i === active ? 0 : -1}
            onFocus={() => setActive(i)}
            className="group flex flex-col gap-1 w-fit rounded-sm p-1 -m-1"
          >
            <span className="flex items-center gap-2">
              <Glyph name={id} className="text-secondary group-hover:text-ok" />
              <span className="mono text-[13px] text-primary">{APP_TITLE[id]}</span>
            </span>
            <span className="micro text-tertiary pl-6">
              {countFor(id) !== null ? `${countFor(id)} ` : ''}
              {APP_SUBTITLE[id]}
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}

/* -------------------------------------------------------------------- dock */

export function Dock() {
  const windows = useSystem((s) => s.windows)
  const focused = useSystem((s) => s.focusOrder.at(-1) ?? null)
  const evicted = useSystem((s) => s.evicted)
  const api = useSystemApi()
  const load = useSystemLoad()

  return (
    <footer
      role="toolbar"
      aria-label="Open windows"
      className="fixed bottom-0 inset-x-0 z-[500] flex items-center gap-2 px-3 border-t border-subtle bg-chrome/95 backdrop-blur-sm"
      style={{ height: DOCK_H }}
    >
      <ul className="flex items-center gap-1 overflow-x-auto">
        {windows.map((w) => (
          <li key={w.id}>
            <button
              type="button"
              onClick={() => (focused === w.id && !w.minimized ? api.minimize(w.id) : api.focus(w.id))}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-sm mono text-[12px] border ${
                focused === w.id && !w.minimized
                  ? 'border-focus/50 text-primary bg-raised'
                  : 'border-transparent text-tertiary hover:text-primary hover:bg-raised/60'
              } ${evicted === w.id ? 'anim-shake' : ''}`}
              aria-pressed={focused === w.id && !w.minimized}
            >
              <Glyph name={w.id} size={12} />
              {APP_TITLE[w.id]}
              {w.minimized && <span className="text-tertiary">·</span>}
            </button>
          </li>
        ))}
      </ul>

      <span className="ml-auto mono text-[11px] text-tertiary tabular-nums shrink-0">
        {windows.length} window{windows.length === 1 ? '' : 's'} · {load}%
      </span>
    </footer>
  )
}

/**
 * A real load figure: the share of the last 60 frames that missed the 16.67ms
 * budget. Reads 0 when the system is smooth and climbs under strain, which is
 * what a load number is supposed to mean.
 *
 * Fake telemetry is worse than none — a developer will check, and a number that
 * drifts at random while nothing is happening is the tell.
 */
function useSystemLoad(): number {
  const [load, setLoad] = useState(0)

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const samples: number[] = []

    const tick = (t: number) => {
      samples.push(t - last)
      last = t
      if (samples.length > 60) samples.shift()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const timer = setInterval(() => {
      if (samples.length < 10) return
      const missed = samples.filter((dt) => dt > 16.67 * 1.5).length
      setLoad(Math.round((missed / samples.length) * 100))
    }, 1000)

    return () => {
      cancelAnimationFrame(raf)
      clearInterval(timer)
    }
  }, [])

  return load
}

export { pathFor }
export type { AppId }
