'use client'

import { useCallback, useState } from 'react'
import { snapRect } from '@/os/geometry'
import { useSystem } from '@/os/SystemProvider'
import type { SnapSide } from '@/os/types'
import { AppView } from './registry'
import { Window } from './Window'

/**
 * The window layer. Renders every open window plus the snap preview.
 *
 * Window bodies come from the registry rather than from the page's server
 * markup: the same content component renders in both places, so there is one
 * implementation, and the server copy stays where a crawler can read it.
 */
export function WindowLayer() {
  const windows = useSystem((s) => s.windows)
  const focused = useSystem((s) => s.focusOrder.at(-1) ?? null)
  const [snap, setSnap] = useState<SnapSide>(null)

  const onSnapPreview = useCallback((side: SnapSide) => setSnap(side), [])

  const preview =
    snap && typeof window !== 'undefined'
      ? snapRect(snap, { w: window.innerWidth, h: window.innerHeight })
      : null

  return (
    <>
      {preview && (
        <div
          aria-hidden="true"
          className="absolute rounded-md border border-focus/50 bg-focus/15 pointer-events-none transition-opacity duration-100"
          style={{
            transform: `translate3d(${preview.x}px, ${preview.y}px, 0)`,
            width: preview.w,
            height: preview.h,
            zIndex: 90,
          }}
        />
      )}

      {windows.map((win) => (
        <Window key={win.id} win={win} focused={focused === win.id} onSnapPreview={onSnapPreview}>
          <AppView id={win.id} payload={win.payload} />
        </Window>
      ))}
    </>
  )
}
