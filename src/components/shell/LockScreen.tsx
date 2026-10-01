'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { buildVersion, channels, meta, profile } from '~/data'
import { bootLines, stability } from '@/lib/derived'
import type { LockHandle } from '@/lib/lockscreen'
import { sfx } from '@/lib/sfx'
import { APP_LABEL, APP_PATH } from '@/os/routes'
import { useSound } from '@/os/sound'
import { useSystemApi } from '@/os/SystemProvider'
import { useTheme } from '@/os/theme'
import { AppIcon, Glyph } from '@/components/ui'

/**
 * The lock screen: the front door, and the boot sequence folded into it.
 *
 * The wallpaper is a pond with the name in it as glass (lib/lockscreen.ts);
 * the clock, the date and the system's status bar sit over it, and the boot
 * lines arrive as a stack of notifications — the counts are the same derived
 * numbers the boot screen printed, so nothing here is typed. Scroll it away
 * and the desk comes up underneath.
 *
 * "Scroll" is meant literally. The lock screen is a real scroll container with
 * one snap point on it and one past it, so the browser's own scrolling does
 * the work: a wheel notch, a trackpad flick, a thumb swipe, Space or Page Down
 * all unlock it, momentum and rubber-banding are native, and a scroll that
 * stops halfway snaps back. Enter unlocks too; Escape unlocks and, if nothing
 * is open underneath, opens the projects — which is what Skip used to do.
 *
 * It is the default state of the page: every full load shows it, on every
 * route, because it is rendered into the server's HTML and nothing remembers
 * having been past it. A deep link is not lost — its window is opened
 * underneath while the door is shut, so unlocking lands exactly where the
 * link pointed. Moving around inside the system never reloads the page, so it
 * never locks a visitor out mid-visit. Until it is unlocked the system is not
 * `booted`, which is what keeps the global shortcuts off behind it.
 */
const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function LockScreen() {
  const api = useSystemApi()
  const [gone, setGone] = useState(false)
  const [glass, setGlass] = useState(false)
  const [notes, setNotes] = useState(false)
  const [now, setNow] = useState<Date | null>(null)

  const root = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const name = useRef<HTMLHeadingElement>(null)
  const handle = useRef<LockHandle | null>(null)
  const done = useRef(false)
  const chimed = useRef(false)
  const thenProjects = useRef(false)

  const { theme, toggle: toggleTheme } = useTheme()
  const { soundOn, toggle: toggleSound } = useSound()

  const showing = !gone

  const finish = useCallback(() => {
    if (done.current) return
    done.current = true
    document.documentElement.removeAttribute('data-locked')
    document.documentElement.style.removeProperty('--lock-p')
    setGone(true)
    api.setBooted(true)
    // Escape is "take me to the work": the projects, unless a deep link has
    // already put something on the desk under the lock.
    if (thenProjects.current && api.getState().windows.length === 0) {
      api.open('projects')
      window.history.pushState(null, '', APP_PATH.projects)
    }
  }, [api])

  /**
   * Carry the sheet the rest of the way. Snapping is switched off for the run —
   * a programmatic scroll is snapped too, and would be pulled straight back to
   * the lock — and the scroll is driven frame by frame rather than by
   * `behavior: smooth`, which the next wheel event would cancel halfway.
   */
  const unlocking = useRef(false)
  const unlock = useCallback(() => {
    const el = scroller.current
    if (!el) return finish()
    if (unlocking.current) return
    unlocking.current = true
    if (still()) {
      sfx('unlock')
      return finish()
    }
    root.current?.setAttribute('data-unlocking', '')
    const from = el.scrollTop
    const to = el.clientHeight
    const t0 = performance.now()
    const ms = 560 * (1 - from / Math.max(1, to)) + 160
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / ms)
      el.scrollTop = from + (to - from) * (1 - (1 - k) ** 3)
      if (k < 1) requestAnimationFrame(step)
      else finish()
    }
    requestAnimationFrame(step)
  }, [finish])

  // While it is up: the clock, the keyboard, focus, and the desk held back.
  useEffect(() => {
    if (!showing) return
    const html = document.documentElement
    html.dataset.locked = ''
    setNow(new Date())
    const clock = setInterval(() => setNow(new Date()), 1000)
    scroller.current?.focus({ preventScroll: true })

    const onKey = (e: KeyboardEvent) => {
      const onButton = !!(e.target as Element).closest('button')
      if (e.key === 'Escape') {
        e.preventDefault()
        thenProjects.current = true
        unlock()
      } else if (
        (!onButton && (e.key === 'Enter' || e.key === ' ')) ||
        ['ArrowDown', 'ArrowUp', 'PageDown', 'End'].includes(e.key)
      ) {
        e.preventDefault()
        unlock()
      }
    }

    // Scroll intent, not scroll distance. A trackpad moves the sheet with the
    // fingers for the first few pixels, which is the feel of it; past a small
    // threshold of downward intent the sheet is carried the rest of the way,
    // because snapping would otherwise pull a slow scroll back to the lock.
    // Once it is going, further wheel events are swallowed so momentum cannot
    // fight the run.
    const el = scroller.current
    let sum = 0
    let last = 0
    const onWheel = (e: WheelEvent) => {
      if (unlocking.current) return e.preventDefault()
      if (e.deltaY <= 0) return
      const t = performance.now()
      if (t - last > 240) sum = 0
      last = t
      sum += e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1)
      if (sum > 48) {
        e.preventDefault()
        unlock()
      }
    }
    // A swipe that let go past a small fraction of the way is a swipe up.
    const onTouchEnd = () => {
      if (el && el.scrollTop > el.clientHeight * 0.12) unlock()
    }
    el?.addEventListener('wheel', onWheel, { passive: false })
    el?.addEventListener('touchend', onTouchEnd)
    window.addEventListener('keydown', onKey)
    return () => {
      clearInterval(clock)
      el?.removeEventListener('wheel', onWheel)
      el?.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('keydown', onKey)
      delete html.dataset.locked
      html.style.removeProperty('--lock-p')
    }
  }, [showing, unlock])

  // The surface. Imported on demand, like the desk's, so the shader source is
  // not in the first bundle and the door paints before it has compiled.
  useEffect(() => {
    if (!showing) return
    const c = canvas.current
    if (!c) return
    let alive = true
    let drops: ReturnType<typeof setInterval> | undefined
    let ro: ResizeObserver | undefined

    import('@/lib/lockscreen').then(({ mountLock, drawNameMask }) => {
      if (!alive || !c) return
      const animate = !still()
      const h = mountLock(c, {
        mode: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
        animate,
        drawMask: (w, hh) => (name.current && panel.current ? drawNameMask(name.current, panel.current, w, hh) : null),
        onLive: () => alive && setGlass(true),
      })
      handle.current = h
      // The name is drawn in the page's own font; draw it again once that
      // font is actually here, and whenever the layout moves it.
      document.fonts?.ready.then(() => alive && h.refreshMask())
      let frame = 0
      ro = new ResizeObserver(() => {
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(() => h.refreshMask())
      })
      if (panel.current) ro.observe(panel.current)
      if (animate) {
        // A drop now and then, somewhere near the name, so the pond is alive
        // before anyone touches it.
        drops = setInterval(() => {
          const r = name.current?.getBoundingClientRect()
          if (!r) return
          h.ripple(r.left + Math.random() * r.width, r.top + Math.random() * r.height, 0.55)
        }, 3200)
        const r = name.current?.getBoundingClientRect()
        if (r) setTimeout(() => alive && h.ripple(r.left + r.width * 0.3, r.top + r.height * 0.5, 0.8), 700)
      }
    })

    return () => {
      alive = false
      clearInterval(drops)
      ro?.disconnect()
      handle.current?.destroy()
      handle.current = null
    }
  }, [showing])

  useEffect(() => {
    if (theme) handle.current?.setMode(theme)
  }, [theme])

  const onScroll = () => {
    const el = scroller.current
    if (!el) return
    const p = Math.min(1, Math.max(0, el.scrollTop / Math.max(1, el.clientHeight)))
    const v = p.toFixed(4)
    root.current?.style.setProperty('--p', v)
    document.documentElement.style.setProperty('--lock-p', v)
    handle.current?.setUnlock(p)
    if (p > 0.01 && p < 0.97) sfx('swipe', p)
    if (p >= 0.45 && !chimed.current) {
      chimed.current = true
      sfx('unlock')
    } else if (p < 0.2) chimed.current = false
    if (p >= 0.992) finish()
  }

  const touch = (e: React.PointerEvent) => {
    handle.current?.ripple(e.clientX, e.clientY, 1)
    sfx('ripple', 1 - e.clientY / window.innerHeight)
  }

  if (!showing) return null

  const open = channels.filter((c) => c.href).length
  const bars = Math.round((open / Math.max(1, channels.length)) * 4)
  const [first, ...rest] = profile.name.split(' ')

  return (
    <div
      ref={root}
      className="lock"
      data-glass={glass ? 'on' : undefined}
      data-notes={notes ? 'open' : undefined}
      role="dialog"
      aria-modal="true"
      aria-label="Lock screen. Scroll or press Enter to unlock."
    >
      <div ref={scroller} className="lock-scroller" tabIndex={-1} onScroll={onScroll}>
        <section
          ref={panel}
          className="lock-panel"
          onPointerDown={touch}
          onPointerMove={(e) => handle.current?.setPointer(e.clientX, e.clientY)}
        >
          <div className="lock-bg wallpaper" aria-hidden="true" />
          <canvas ref={canvas} className="lock-canvas" aria-hidden="true" />

          {/* ------------------------------------------------ status bar */}
          <div className="lock-status" data-in style={{ ['--d' as string]: '0ms' }}>
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true">◈</span>
              {meta.systemName}
              <span className="lock-dim">· {buildVersion}</span>
            </span>
            <span className="flex items-center gap-2.5">
              <span className="lock-signal" title={`${open} of ${channels.length} contact channels open`}>
                {[0, 1, 2, 3].map((b) => (
                  <span key={b} className={b < bars ? 'on' : ''} style={{ ['--b' as string]: b }} />
                ))}
                <span className="sr-only">
                  {open} of {channels.length} contact channels open
                </span>
              </span>
              <span className="lock-battery" title={`stability ${stability.display}`}>
                <span className="lock-battery-num">{stability.display}</span>
                <span className="lock-battery-cell" aria-hidden="true">
                  <span style={{ width: `${Math.round(stability.value * 100)}%` }} />
                </span>
                <span className="sr-only">stability {stability.display}</span>
              </span>
            </span>
          </div>

          {/* ------------------------------------------------- the time */}
          <div className="lock-top">
            <span className="lock-padlock" data-in style={{ ['--d' as string]: '80ms' }}>
              <Glyph name="lock" size={15} />
            </span>
            <p className="lock-date" data-in style={{ ['--d' as string]: '140ms' }}>
              {now ? now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }) : ' '}
            </p>
            <p className="lock-time" data-in style={{ ['--d' as string]: '200ms' }} aria-live="off">
              {now ? now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) : ' '}
            </p>
          </div>

          {/* ------------------------------------------------- the name */}
          <div className="lock-middle">
            <h1 ref={name} className="lock-name" data-in style={{ ['--d' as string]: '260ms' }}>
              <span data-word>{first}</span> <span data-word>{rest.join(' ')}</span>
            </h1>
            <p className="lock-role" data-in style={{ ['--d' as string]: '420ms' }}>
              {profile.role}
              <span className="lock-dim"> · {profile.institution}</span>
            </p>
          </div>

          <Notifications onOpen={setNotes} />

          {/* ----------------------------------------------- the way in */}
          <div className="lock-bottom" data-in style={{ ['--d' as string]: '700ms' }}>
            <button
              type="button"
              className="lock-round"
              aria-label={soundOn ? 'Turn sound off' : 'Turn sound on'}
              aria-pressed={!!soundOn}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={toggleSound}
            >
              <Glyph name={soundOn ? 'sound' : 'mute'} size={17} />
            </button>

            <button
              type="button"
              className="lock-hint"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={unlock}
            >
              <span className="lock-chevron" aria-hidden="true">
                <Glyph name="caret" size={16} className="rotate-180" />
              </span>
              <span className="lock-hint-text">
                <span className="lock-fine">Scroll to unlock</span>
                <span className="lock-coarse">Swipe up to unlock</span>
              </span>
              <span className="lock-hint-keys lock-fine" aria-hidden="true">
                Enter · Esc opens projects
              </span>
            </button>

            <button
              type="button"
              className="lock-round"
              aria-label={theme === 'light' ? 'Switch to dark' : 'Switch to light'}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => {
                toggleTheme()
                sfx('tab')
              }}
            >
              <Glyph name="theme" size={17} />
            </button>
          </div>
          <span className="lock-home" aria-hidden="true" />
        </section>
        <div className="lock-spacer" aria-hidden="true" />
      </div>
    </div>
  )
}

/**
 * The boot sequence, as the notifications it always was. Stacked, they are
 * one card with two peeking out behind it; opened, they are the whole log.
 */
function Notifications({ onOpen }: { onOpen: (open: boolean) => void }) {
  const [open, setOpen] = useState(false)
  useEffect(() => onOpen(open), [open, onOpen])
  const items = [
    ...bootLines.map((l) => ({ app: l.app, title: APP_LABEL[l.app], body: `${l.label} — ${l.value}`, warn: false })),
    { app: 'failures' as const, title: 'Warning', body: 'Some modules are unstable. This is intentional.', warn: true },
  ]

  return (
    <div className="lock-notes" data-open={open ? '' : undefined} data-in style={{ ['--d' as string]: '560ms' }}>
      <div className="lock-notes-inner">
      <button
        type="button"
        className="lock-notes-head"
        aria-expanded={open}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => {
          setOpen((o) => !o)
          sfx(open ? 'tab' : 'open')
        }}
      >
        <span>Notification centre</span>
        <span className="lock-notes-count">{open ? 'Show less' : `${items.length} new`}</span>
      </button>
      <ul
        className="lock-notes-list"
        onPointerDown={(e) => {
          if (!open) {
            e.stopPropagation()
            setOpen(true)
            sfx('open')
          }
        }}
      >
        {items.map((it, i) => (
          <li key={i} className={`lock-note ${it.warn ? 'is-warn' : ''}`} style={{ ['--i' as string]: i }}>
            <AppIcon id={it.app} size={34} />
            <div className="min-w-0 flex-1">
              <p className="lock-note-top">
                <span>{it.title}</span>
                <span className="lock-dim">now</span>
              </p>
              <p className="lock-note-body">{it.body}</p>
            </div>
          </li>
        ))}
      </ul>
      </div>
    </div>
  )
}
