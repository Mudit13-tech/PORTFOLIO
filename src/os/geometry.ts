import {
  CASCADE,
  CASCADE_RESET,
  DOCK_H,
  KEEP_ON_SCREEN,
  MIN_H,
  MIN_W,
  TOP_BAR_H,
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
 * Cascade from the last position, offset 28px, reset to origin after six —
 * so a seventh window does not walk off the bottom right of the screen.
 */
export function cascade(index: number, size: { w: number; h: number }, vp: Viewport): Rect {
  const a = workArea(vp)
  const step = index % CASCADE_RESET
  const w = Math.min(size.w, a.w - 32)
  const h = Math.min(size.h, a.h - 32)
  const x = a.x + 32 + step * CASCADE
  const y = a.y + 24 + step * CASCADE
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
