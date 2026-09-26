import {
  BP_DESKTOP,
  CASCADE,
  CASCADE_RESET,
  DOCK_H,
  ICON_GUTTER,
  ICON_GUTTER_SHORT,
  ICONS_SHORT_H,
  KEEP_ON_SCREEN,
  MIN_H,
  MIN_W,
  TOP_BAR_H,
  WIDGET_GUTTER,
  Z_BASE,
  Z_RENORM,
} from './constants'
import type { Rect, Viewport, WindowState } from './types'

/**
 * Pure geometry. No DOM, no React, no store — which is what makes the window
 * manager's behaviour testable rather than something you have to drag to check.
 */

/** The area a window may occupy: between the top bar and the dock. */
export function workArea(vp: Viewport): Rect {
  return { x: 0, y: TOP_BAR_H, w: vp.w, h: Math.max(MIN_H, vp.h - TOP_BAR_H - DOCK_H) }
}

export function maximizedRect(vp: Viewport): Rect {
  return workArea(vp)
}

/** Half-screen snap targets, plus top-to-maximize. */
export function snapRect(side: 'left' | 'right' | 'top', vp: Viewport): Rect {
  const a = workArea(vp)
  if (side === 'top') return a
  const w = Math.floor(a.w / 2)
  return { x: side === 'left' ? a.x : a.x + w, y: a.y, w, h: a.h }
}

/**
 * Where a new window opens.
 *
 * It prefers the open desk: between the widgets on the left and the icons on
 * the right, where it covers nothing. If it does not fit there it may cover the
 * widgets, and only on a narrow screen does it take the whole width. Within
 * that lane the stack of cascaded windows is centred, offset 28px each and
 * reset after six so a seventh does not walk off the bottom right. The height
 * shrinks with the offset, so a cascaded window never slides under the dock.
 */
export function cascade(index: number, size: { w: number; h: number }, vp: Viewport): Rect {
  const a = workArea(vp)
  const step = index % CASCADE_RESET
  const offset = step * CASCADE

  const icons = vp.h < ICONS_SHORT_H ? ICON_GUTTER_SHORT : ICON_GUTTER
  const lanes = [
    ...(vp.w >= BP_DESKTOP ? [{ l: WIDGET_GUTTER, r: vp.w - icons }] : []),
    { l: 24, r: vp.w - icons },
    { l: 16, r: vp.w - 16 },
  ]
  const lane = lanes.find((l) => l.r - l.l >= size.w) ?? lanes[lanes.length - 1]

  const w = Math.min(size.w, lane.r - lane.l)
  const room = lane.r - lane.l - w
  const start = lane.l + Math.max(0, Math.round((room - CASCADE * (CASCADE_RESET - 1)) / 2))
  const x = Math.min(start + offset, lane.l + room)
  const y = a.y + 20 + offset
  const h = Math.min(size.h, a.y + a.h - y - 12)
  return clampToViewport({ x, y, w, h }, vp)
}

/**
 * Constrain so at least KEEP_ON_SCREEN pixels of chrome stay visible on every
 * side. A window can never be dragged somewhere it cannot be dragged back from.
 */
export function clampToViewport(rect: Rect, vp: Viewport): Rect {
  const a = workArea(vp)
  const w = Math.max(MIN_W, Math.min(rect.w, Math.max(MIN_W, vp.w)))
  const h = Math.max(MIN_H, rect.h)
  const minX = a.x - w + KEEP_ON_SCREEN
  const maxX = a.x + a.w - KEEP_ON_SCREEN
  const minY = a.y
  const maxY = a.y + a.h - KEEP_ON_SCREEN
  return {
    x: Math.round(Math.min(Math.max(rect.x, minX), maxX)),
    y: Math.round(Math.min(Math.max(rect.y, minY), maxY)),
    w: Math.round(w),
    h: Math.round(h),
  }
}

/**
 * Bring a window wholly on screen, shrinking it if it has to. Used when the
 * screen itself changes — a restored desk from a larger monitor, a rotated
 * tablet — where "80px of it is still reachable" is not good enough: nobody
 * dragged it there, so nobody should have to drag it back.
 */
export function fitToViewport(rect: Rect, vp: Viewport): Rect {
  const a = workArea(vp)
  const w = Math.max(Math.min(MIN_W, a.w), Math.min(rect.w, a.w - 16))
  const h = Math.max(Math.min(MIN_H, a.h), Math.min(rect.h, a.h - 8))
  return {
    x: Math.round(Math.min(Math.max(rect.x, a.x + 8), a.x + a.w - w - 8)),
    y: Math.round(Math.min(Math.max(rect.y, a.y), a.y + a.h - h - 8)),
    w: Math.round(w),
    h: Math.round(h),
  }
}

export function clampSize(rect: Rect, vp: Viewport): Rect {
  const a = workArea(vp)
  return {
    x: rect.x,
    y: rect.y,
    w: Math.max(MIN_W, Math.min(rect.w, a.w)),
    h: Math.max(MIN_H, Math.min(rect.h, a.h)),
  }
}

/** Which snap zone a pointer at (x, y) is in, if any. */
export function snapZoneFor(x: number, y: number, vp: Viewport, edge: number): 'left' | 'right' | 'top' | null {
  if (y <= TOP_BAR_H + edge) return 'top'
  if (x <= edge) return 'left'
  if (x >= vp.w - edge) return 'right'
  return null
}

/**
 * Keep z-indices from climbing forever. Once the top exceeds Z_RENORM the whole
 * stack is rewritten from the base, preserving order.
 */
export function renormalise(windows: WindowState[], nextZ: number): { windows: WindowState[]; nextZ: number } {
  if (nextZ <= Z_RENORM) return { windows, nextZ }
  const sorted = [...windows].sort((a, b) => a.z - b.z)
  const remapped = new Map(sorted.map((w, i) => [w.id, Z_BASE + i]))
  return {
    windows: windows.map((w) => ({ ...w, z: remapped.get(w.id) ?? w.z })),
    nextZ: Z_BASE + sorted.length,
  }
}
