'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { sfx } from '@/lib/sfx'
import { Glyph, type BrandName } from '@/components/ui'
import { Badge, DotNumber } from '@/components/ui/kit'

/**
 * Contact, as a receiver.
 *
 * The channels sit on a band like stations on a dial. Drag the needle, tap
 * the band, scroll over it or use the arrow keys, and it springs to the
 * nearest station: an open channel locks on with a clean tone and puts its
 * address in the display; an unpublished one is static and says so. The
 * ticks sound as the needle crosses them, pitched by where on the band it is.
 *
 * Underneath it is the same honest list as before, rendered on the server with
 * real links, so a visitor with no scripting still has every address — the
 * dial is a way to choose, never the only way to leave with one.
 */
export interface TunerChannel {
  id: string
  label: string
  value: string | null
  href: string | null
  pending: string
}

const BRAND: Record<string, BrandName | undefined> = { github: 'github', leetcode: 'leetcode', linkedin: 'linkedin' }
const PER = 10

export function ChannelTuner({ channels }: { channels: TunerChannel[] }) {
  const n = channels.length
  const at = (i: number) => (i + 0.5) / n
  const first = Math.max(0, channels.findIndex((c) => c.href))

  const [sel, setSel] = useState(first)
  const [pos, setPos] = useState(at(first))
  const [copied, setCopied] = useState(false)
  const band = useRef<HTMLDivElement>(null)
  const live = useRef({ pos: at(first), vel: 0, target: at(first), raf: 0, tick: -1, dragging: false })

  const ticks = n * PER + 1

  /** Sound every tick the needle crosses, and settle the selection. */
  const setNeedle = useCallback(
    (p: number) => {
      const s = live.current
      s.pos = p
      setPos(p)
      const t = Math.round(p * (ticks - 1))
      if (t !== s.tick) {
        if (s.tick >= 0) sfx('notch', p)
        s.tick = t
      }
    },
    [ticks],
  )

  const settle = useCallback(
    (i: number) => {
      setSel(i)
      setCopied(false)
      sfx(channels[i].href ? 'lock' : 'static')
    },
    [channels],
  )

  /** Spring the needle to a station. */
  const tune = useCallback(
    (i: number, instant = false) => {
      const s = live.current
      const idx = Math.max(0, Math.min(n - 1, i))
      s.target = at(idx)
      cancelAnimationFrame(s.raf)
      if (instant || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setNeedle(s.target)
        settle(idx)
        return
      }
      let last = 0
      const step = (now: number) => {
        const dt = last ? Math.min(2.5, (now - last) / 16.67) : 1
        last = now
        s.vel += (s.target - s.pos) * 0.14 * dt
        s.vel *= 0.72 ** dt
        const p = s.pos + s.vel * dt
        if (Math.abs(s.target - p) < 0.0005 && Math.abs(s.vel) < 0.0005) {
          setNeedle(s.target)
          settle(idx)
          return
        }
        setNeedle(p)
        s.raf = requestAnimationFrame(step)
      }
      s.raf = requestAnimationFrame(step)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `at` is derived from `n` alone
    [n, setNeedle, settle],
  )

  useEffect(() => () => cancelAnimationFrame(live.current.raf), [])

  const nearest = (p: number) => Math.max(0, Math.min(n - 1, Math.floor(p * n)))

  const fromPointer = (e: React.PointerEvent) => {
    const r = band.current!.getBoundingClientRect()
    return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
  }

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    cancelAnimationFrame(live.current.raf)
    live.current.dragging = true
    live.current.vel = 0
    sfx('press')
    setNeedle(fromPointer(e))
  }
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!live.current.dragging) return
    setNeedle(fromPointer(e))
  }
  const onUp = () => {
    if (!live.current.dragging) return
    live.current.dragging = false
    tune(nearest(live.current.pos))
  }

  // A wheel over the band steps one station per gesture, not one per event.
  const wheelAt = useRef(0)
  const onWheel = (e: React.WheelEvent) => {
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
    if (Math.abs(d) < 4) return
    const now = performance.now()
    if (now - wheelAt.current < 260) return
    wheelAt.current = now
    tune(sel + (d > 0 ? 1 : -1))
  }

  const onKey = (e: React.KeyboardEvent) => {
    const k = e.key
    if (k === 'ArrowRight' || k === 'ArrowUp') tune(sel + 1)
    else if (k === 'ArrowLeft' || k === 'ArrowDown') tune(sel - 1)
    else if (k === 'Home') tune(0)
    else if (k === 'End') tune(n - 1)
    else return
    e.preventDefault()
  }

  const c = channels[sel]
  const open = !!c.href
  const brand = BRAND[c.id]

  const copy = async () => {
    const text = c.id === 'email' ? c.value : c.href
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      sfx('copy')
      setTimeout(() => setCopied(false), 1600)
    } catch {
      sfx('deny')
    }
  }

  return (
    <div className="tuner">
      {/* ----------------------------------------------------- the display */}
      <div className={`tuner-display ${open ? 'is-open' : 'is-static'}`} aria-live="polite">
        <span className="tuner-noise" aria-hidden="true" />
        {brand ? (
          <Badge brand={brand} tone={brand} size={44} />
        ) : (
          <Badge glyph="contact" tone="mail" size={44} />
        )}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 field-label">
            <span className="inline-flex items-end gap-1 text-secondary">
              CH <DotNumber value={String(sel + 1).padStart(2, '0')} size={10} />
            </span>
            <span aria-hidden="true">·</span>
            <span>{open ? 'locked' : 'no signal'}</span>
          </p>
          <p className="text-[18px] leading-tight font-medium text-primary mt-1 truncate">{c.label}</p>
          <p className={`text-[13px] mt-0.5 truncate ${open ? 'text-secondary' : 'text-tertiary mono'}`}>
            {open ? c.value : c.pending}
          </p>
        </div>
        <span className="tuner-bars" aria-hidden="true">
          {[0, 1, 2, 3].map((b) => (
            <span key={b} className={open ? 'on' : ''} style={{ ['--b' as string]: b }} />
          ))}
        </span>
      </div>

      {/* -------------------------------------------------------- the band */}
      <div
        ref={band}
        role="slider"
        tabIndex={0}
        aria-label="Channel"
        aria-valuemin={1}
        aria-valuemax={n}
        aria-valuenow={sel + 1}
        aria-valuetext={`${c.label}, ${open ? 'open' : c.pending}`}
        className="tuner-band"
        data-sfx="off"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onWheel={onWheel}
        onKeyDown={onKey}
      >
        <div className="tuner-scale" aria-hidden="true">
          {Array.from({ length: ticks }, (_, i) => (
            <span key={i} className={i % PER === PER / 2 ? 'st' : i % PER === 0 ? 'md' : ''} />
          ))}
        </div>
        <span className="tuner-needle" style={{ left: `${pos * 100}%` }} aria-hidden="true">
          <span className="tuner-needle-line" />
          <span className="tuner-needle-head" />
        </span>
        <div className="tuner-stations" aria-hidden="true">
          {channels.map((ch, i) => (
            <span
              key={ch.id}
              className={`tuner-station ${i === sel ? 'is-sel' : ''} ${ch.href ? 'is-open' : ''}`}
              style={{ left: `${at(i) * 100}%` }}
            >
              <span className="tuner-station-dot" />
              {ch.label}
            </span>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------ the action */}
      <div className="flex flex-wrap items-center gap-2 mt-4">
        {open ? (
          <>
            <a
              href={c.href!}
              target="_blank"
              rel="noreferrer noopener"
              data-native="true"
              data-sfx="open"
              className="btn btn-solid"
            >
              Open {c.label}
              <Glyph name="external" size={13} className="btn-icon" />
            </a>
            <button type="button" onClick={copy} data-sfx="off" className="btn btn-quiet">
              <Glyph name={copied ? 'check' : 'copy'} size={13} />
              {copied ? 'Copied' : c.id === 'email' ? 'Copy address' : 'Copy link'}
            </button>
          </>
        ) : (
          <button type="button" aria-disabled="true" data-sfx="deny" className="btn btn-quiet is-off">
            <Glyph name="lock" size={13} />
            Not published yet
          </button>
        )}
        <span className="ml-auto hidden @sm:inline micro text-tertiary">drag, scroll or ← → to tune</span>
      </div>
    </div>
  )
}
