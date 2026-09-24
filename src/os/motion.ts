import type { AppId } from './types'

/**
 * Window motion: a window grows out of the icon that opened it, closes back
 * into its dock icon, and minimizes into it along a curve.
 *
 * Plain DOM and the Web Animations API — no React in this file, the same as
 * the store. The store asks for an exit and hands over the state change to
 * make once it has played; if there is no window element to animate (no DOM,
 * a phone sheet, reduced motion) the change is made at once, so nothing about
 * the system's behaviour depends on an animation finishing.
 *
 * Every frame is a transform, an opacity or a short blur. The window's own
 * position is a transform too, so each keyframe starts from it.
 */

type Exit = 'close' | 'minimize'

const EASE_OUT = 'cubic-bezier(.16,1,.3,1)'

const windows = new Map<AppId, HTMLElement>()
const leaving = new Map<AppId, { anim: Animation; commit: () => void }>()
const origins = new Map<AppId, { rect: DOMRect; at: number }>()

/** An origin older than this belongs to some other click. */
const ORIGIN_TTL = 1500

function reduced(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function iconRect(el: Element | null | undefined): DOMRect | null {
  const tile = el?.matches('.app-icon') ? el : el?.querySelector('.app-icon')
  const r = tile?.getBoundingClientRect()
  return r && r.width > 0 ? r : null
}

function dockRect(id: AppId): DOMRect | null {
  return iconRect(document.querySelector(`[data-dock="${id}"]`))
}

/** The transform that lays the window over `src`, measured from where it is now. */
function over(el: HTMLElement, src: DOMRect): { dx: number; dy: number; sx: number; sy: number } {
  const w = el.getBoundingClientRect()
  return {
    dx: src.left + src.width / 2 - (w.left + w.width / 2),
    dy: src.top + src.height / 2 - (w.top + w.height / 2),
    sx: src.width / w.width,
    sy: src.height / w.height,
  }
}

/**
 * Remember the icon a launch came from. Called on pointerdown, which lands
 * before the click that opens the window, and before any re-render it causes.
 */
export function markOrigin(id: AppId, el: Element | null): void {
  const rect = iconRect(el)
  if (rect) origins.set(id, { rect, at: performance.now() })
}

function takeOrigin(id: AppId): DOMRect | null {
  const o = origins.get(id)
  origins.delete(id)
  return o && performance.now() - o.at < ORIGIN_TTL ? o.rect : null
}

/**
 * A window has appeared. `restoring` is true when it is coming back from the
 * dock, in which case the dock icon is the origin even without a click.
 */
export function playOpen(id: AppId, el: HTMLElement, restoring: boolean): void {
  if (typeof el.animate !== 'function') return
  const base = el.style.transform
  const src = takeOrigin(id) ?? (restoring ? dockRect(id) : null)

  if (reduced()) {
    el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120, easing: 'linear' })
    return
  }

  let from = `${base} scale(.9)`
  if (src) {
    const { dx, dy, sx, sy } = over(el, src)
    from = `${base} translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`
  }

  el.animate(
    [
      { transform: from, opacity: 0, filter: 'blur(6px)' },
      { opacity: 1, offset: 0.28 },
      { transform: `${base} scale(1.006)`, filter: 'blur(0px)', offset: 0.78 },
      { transform: base, opacity: 1, filter: 'blur(0px)' },
    ],
    { duration: 540, easing: EASE_OUT },
  )
}

/** An already-open window was asked for again: acknowledge it rather than do nothing. */
export function nudge(id: AppId): void {
  const el = windows.get(id)
  if (!el || leaving.has(id) || reduced() || typeof el.animate !== 'function') return
  const base = el.style.transform
  el.animate(
    [{ transform: base }, { transform: `${base} scale(1.015)` }, { transform: base }],
    { duration: 240, easing: 'ease-in-out' },
  )
}

/**
 * Play a window out, then make the state change. A second request for the
 * same window while it is leaving is ignored; the first one wins.
 */
export function exit(id: AppId, kind: Exit, commit: () => void): void {
  if (leaving.has(id)) return
  const el = windows.get(id)
  if (!el || typeof el.animate !== 'function' || reduced()) {
    commit()
    return
  }

  const base = el.style.transform
  const dock = dockRect(id)
  let frames: Keyframe[]
  let duration: number
  let easing: string

  if (!dock) {
    frames = [
      { transform: base, opacity: 1 },
      { transform: `${base} scale(.94)`, opacity: 0 },
    ]
    duration = 200
    easing = 'cubic-bezier(.4,0,1,1)'
  } else {
    const { dx, dy, sx, sy } = over(el, dock)
    const to = `${base} translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`
    if (kind === 'minimize') {
      // Down and in first, then across: the curve is what reads as "into the dock".
      frames = [
        { transform: base, opacity: 1 },
        { transform: `${base} translate(${dx * 0.3}px, ${dy * 0.62}px) scale(.62, .4)`, opacity: 0.95, offset: 0.55 },
        { transform: to, opacity: 0.2 },
      ]
      duration = 520
      easing = 'cubic-bezier(.55,0,.35,1)'
    } else {
      frames = [
        { transform: base, opacity: 1, filter: 'blur(0px)' },
        { transform: to, opacity: 0, filter: 'blur(4px)' },
      ]
      duration = 320
      easing = 'cubic-bezier(.5,0,.8,.3)'
    }
  }

  el.style.pointerEvents = 'none'
  const anim = el.animate(frames, { duration, easing, fill: 'forwards' })
  const done = () => {
    leaving.delete(id)
    commit()
    // The state change unmounts the window. If something kept it on screen,
    // let go of the final frame rather than leave an invisible window behind.
    requestAnimationFrame(() => {
      if (el.isConnected) {
        anim.cancel()
        el.style.pointerEvents = ''
      }
    })
  }
  leaving.set(id, { anim, commit: done })
  anim.onfinish = done
}

/**
 * Finish a window's exit now. The store calls this before anything that
 * revives the window, so reopening a window mid-close starts from a clean one.
 */
export function settle(id: AppId): void {
  const l = leaving.get(id)
  if (!l) return
  l.anim.onfinish = null
  l.commit()
}

/** Called by the window itself; returns the unregister function. */
export function registerWindow(id: AppId, el: HTMLElement): () => void {
  windows.set(id, el)
  return () => {
    if (windows.get(id) === el) windows.delete(id)
    const l = leaving.get(id)
    if (l) {
      l.anim.onfinish = null
      leaving.delete(id)
    }
  }
}
