'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { IconFrames } from '@/lib/icons3d'
import { appSfx } from '@/lib/sfx'
import { useIconFinish } from '@/os/icons'
import type { AppId } from '@/os/types'
import { AppIcon } from './AppIcon'

/**
 * An application icon, as a photographed object.
 *
 * The nine 3D models in `lib/icons3d.ts` are rendered once per session into a
 * short turntable each and handed down through this context. Until they land —
 * and forever, on a machine with no WebGL or for a visitor who prefers the flat
 * set — this renders the SVG `AppIcon` instead. That fallback is the important
 * part of the design: the icons are in the server-rendered HTML, they are
 * correct at first paint, and nothing on the desk ever waits on a GPU.
 *
 * Hovering plays the object's own motion — the folder opens, the keycap is
 * pressed, the flask bubbles — and fires that application's voice from
 * `sfx.ts`. The two were designed as one thing: what you hear is the object you
 * can see moving.
 */

const Ctx = createContext<IconFrames | null>(null)

/** Module-level, not state: the set is rendered once per page load, not per mount. */
let cache: IconFrames | null = null
let inFlight: Promise<IconFrames> | null = null

export function IconFramesProvider({ children }: { children: ReactNode }) {
  const [frames, setFrames] = useState<IconFrames | null>(cache)

  useEffect(() => {
    if (cache) return
    let alive = true
    // Off the critical path in every sense: dynamically imported so three.js is
    // never in the first bundle, and started on an idle callback so it cannot
    // compete with the boot sequence for the main thread.
    const start = () => {
      inFlight ??= import('@/lib/icons3d').then((m) => m.renderIcons({ size: 192, frames: 16 }))
      inFlight
        .then((f) => {
          cache = f
          // Decode every frame before any of them is shown, or the first hover
          // plays as a slideshow while sixteen PNGs are pulled off the wire.
          for (const list of Object.values(f)) for (const src of list) new Image().src = src
          if (alive) setFrames(f)
        })
        .catch(() => {
          // A failed render is a non-event: the SVG icons are already on screen.
          inFlight = null
        })
    }
    // Safari only shipped requestIdleCallback in 2022, and the DOM types do not
    // admit that it can be missing — hence the feature test through `in`.
    const idle = 'requestIdleCallback' in window
    const handle = idle ? window.requestIdleCallback(start, { timeout: 2500 }) : window.setTimeout(start, 900)
    return () => {
      alive = false
      if (idle) window.cancelIdleCallback(handle)
      else clearTimeout(handle)
    }
  }, [])

  return <Ctx.Provider value={frames}>{children}</Ctx.Provider>
}

/** How long each frame is held going out, and coming back to rest. */
const FORWARD_MS = 55
const RETURN_MS = 38

/** Checked per hover rather than cached: the setting can change mid-session. */
const stillness = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function AppIcon3D({
  id,
  size = 40,
  fluid = false,
  className = '',
}: {
  id: AppId
  size?: number
  fluid?: boolean
  className?: string
}) {
  const frames = useContext(Ctx)?.[id]
  const { finish } = useIconFinish()
  const [frame, setFrame] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  // The interval needs to know where the turn has got to without closing over a
  // stale render, and it must not decide that inside a state updater — those run
  // twice in development and stopping a timer from one is not idempotent.
  const at = useRef(0)

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current)
    timer.current = null
  }, [])

  // Stops on unmount, and also whenever this icon leaves the object set — the
  // flat branch below has no pointerleave handler to end a turn that is already
  // running, so switching the finish mid-hover would leave a timer behind.
  useEffect(() => {
    stop()
    at.current = 0
    setFrame(0)
    return stop
  }, [stop, frames, finish])

  /** Advance one frame; returns the frame landed on. */
  const advance = (total: number) => {
    at.current = (at.current + 1) % total
    setFrame(at.current)
    return at.current
  }

  const enter = () => {
    appSfx(id, 'hover')
    // The object still lifts and lights on hover — that is a transform, and the
    // reduced-motion rules already govern it. What stops is the turn: sixteen
    // frames of an object opening, tipping or being pressed is exactly the kind
    // of looping movement the setting is asking not to see.
    if (!frames || stillness()) return
    stop()
    timer.current = setInterval(() => advance(frames.length), FORWARD_MS)
  }

  // Never snap: the loop keeps running the same direction until it reaches rest,
  // which is frame 0 for every object because each one's motion closes its loop.
  const leave = () => {
    if (!frames) return
    stop()
    timer.current = setInterval(() => {
      if (advance(frames.length) === 0) stop()
    }, RETURN_MS)
  }

  const box = fluid ? { width: '100%', height: '100%' } : { width: size, height: size }

  // `studio` is the object set; the other three finishes are the flat SVG icons,
  // and a visitor who picks one of those never pays for any of this.
  if (finish !== 'studio' || !frames) {
    return (
      <span
        style={box}
        className="block"
        onPointerEnter={() => appSfx(id, 'hover')}
        onPointerDown={() => appSfx(id, 'press')}
      >
        <AppIcon id={id} size={size} fluid={fluid} className={className} />
      </span>
    )
  }

  return (
    <span
      data-app={id}
      aria-hidden="true"
      className={`app-icon app-object ${className}`}
      style={{ ...box, ['--u' as string]: size / 60 }}
      onPointerEnter={enter}
      onPointerLeave={leave}
      onPointerDown={() => appSfx(id, 'press')}
    >
      {/* One <img> swapped between sixteen already-decoded frames. Rendering all
          sixteen and toggling visibility would be smoother on the very first
          turn and would also put a hundred and forty-four images on the desk. */}
      <img src={frames[frame]} alt="" draggable={false} width={size} height={size} />
    </span>
  )
}
