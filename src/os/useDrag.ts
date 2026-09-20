'use client'

import { useCallback, useRef } from 'react'
import { MIN_H, MIN_W, SNAP_EDGE } from './constants'
import { clampToViewport, snapZoneFor } from './geometry'
import type { AppId, Rect, SnapSide } from './types'

/**
 * Drag and resize.
 *
 * The rule that matters: dragging is 1:1 with the cursor. No smoothing, no
 * spring, no interpolation. In a project whose premise is "I can build a
 * system", a window that lags the pointer is the loudest possible counter-
 * argument, and it is the one interaction every visitor tries first.
 *
 * So nothing here re-renders during the gesture. The element's transform is
 * written directly on each pointermove, and the store is told once on release.
 * React never sees the intermediate frames.
 */

interface DragOptions {
  id: AppId
  getRect: () => Rect
  onCommit: (x: number, y: number) => void
  onSnap: (side: Exclude<SnapSide, null>) => void
  onSnapPreview: (side: SnapSide) => void
  onFocus: () => void
  disabled?: boolean
}

export function useDragHandle({
  getRect,
  onCommit,
  onSnap,
  onSnapPreview,
  onFocus,
  disabled,
}: DragOptions) {
  const frame = useRef<number | null>(null)

  return useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (disabled) return
      // Title bar only, and never from a button inside it.
      if (event.button !== 0) return
      if ((event.target as HTMLElement).closest('button, a')) return

      const el = event.currentTarget.closest('[data-window]') as HTMLElement | null
      if (!el) return

      onFocus()
      event.preventDefault()

      const start = getRect()
      const originX = event.clientX
      const originY = event.clientY
      const vp = { w: window.innerWidth, h: window.innerHeight }

      let x = start.x
      let y = start.y
      let side: SnapSide = null

      document.body.classList.add('dragging')
      el.setPointerCapture?.(event.pointerId)

      const write = () => {
        frame.current = null
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`
      }

      const move = (e: PointerEvent) => {
        // 1:1 — the delta is applied raw, with no easing of any kind.
        const next = clampToViewport(
          { x: start.x + (e.clientX - originX), y: start.y + (e.clientY - originY), w: start.w, h: start.h },
          vp,
        )
        x = next.x
        y = next.y

        const zone = snapZoneFor(e.clientX, e.clientY, vp, SNAP_EDGE)
        if (zone !== side) {
          side = zone
          onSnapPreview(zone)
        }

        // Coalesce to one write per frame; the values themselves are never smoothed.
        if (frame.current === null) frame.current = requestAnimationFrame(write)
      }

      const up = () => {
        if (frame.current !== null) cancelAnimationFrame(frame.current)
        frame.current = null
        document.body.classList.remove('dragging')
        document.removeEventListener('pointermove', move)
        document.removeEventListener('pointerup', up)
        document.removeEventListener('pointercancel', up)
        onSnapPreview(null)
        if (side) onSnap(side)
        else onCommit(x, y)
      }

      document.addEventListener('pointermove', move)
      document.addEventListener('pointerup', up)
      document.addEventListener('pointercancel', up)
    },
    [disabled, getRect, onCommit, onFocus, onSnap, onSnapPreview],
  )
}

type Edge = 'e' | 's' | 'se'

interface ResizeOptions {
  getRect: () => Rect
  onCommit: (rect: Rect) => void
  onFocus: () => void
  disabled?: boolean
}

export function useResizeHandle({ getRect, onCommit, onFocus, disabled }: ResizeOptions) {
  const frame = useRef<number | null>(null)

  return useCallback(
    (edge: Edge) => (event: React.PointerEvent<HTMLElement>) => {
      if (disabled || event.button !== 0) return
      const el = event.currentTarget.closest('[data-window]') as HTMLElement | null
      if (!el) return

      onFocus()
      event.preventDefault()
      event.stopPropagation()

      const start = getRect()
      const originX = event.clientX
      const originY = event.clientY
      let rect = start

      document.body.classList.add('dragging')

      const write = () => {
        frame.current = null
        el.style.width = `${rect.w}px`
        el.style.height = `${rect.h}px`
      }

      const move = (e: PointerEvent) => {
        const w = edge === 's' ? start.w : Math.max(MIN_W, start.w + (e.clientX - originX))
        const h = edge === 'e' ? start.h : Math.max(MIN_H, start.h + (e.clientY - originY))
        rect = { ...start, w, h }
        if (frame.current === null) frame.current = requestAnimationFrame(write)
      }

      const up = () => {
        if (frame.current !== null) cancelAnimationFrame(frame.current)
        frame.current = null
        document.body.classList.remove('dragging')
        document.removeEventListener('pointermove', move)
        document.removeEventListener('pointerup', up)
        document.removeEventListener('pointercancel', up)
        onCommit(rect)
      }

      document.addEventListener('pointermove', move)
      document.addEventListener('pointerup', up)
      document.addEventListener('pointercancel', up)
    },
    [disabled, getRect, onCommit, onFocus],
  )
}
