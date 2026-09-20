'use client'

import { useSyncExternalStore } from 'react'
import type { Difficulty } from './types'

/**
 * The status bar's centre zone.
 *
 * This lives outside React state on purpose. Hovering across the calendar
 * fires a readout per cell and the simulation fires one every 166ms; routing
 * either through the workspace reducer would re-render every pane at that
 * rate. Only the status bar subscribes here.
 */
export type Readout =
  | { kind: 'idle' }
  | { kind: 'cell'; date: string; commits: number; solved: number; hardest: Difficulty | null }
  | { kind: 'life'; gen: number; alive: number }
  | { kind: 'note'; text: string; tone: 'dim' | 'live' | 'cool' | 'alert' }

const IDLE: Readout = { kind: 'idle' }
let current: Readout = IDLE
const listeners = new Set<() => void>()

export function setReadout(next: Readout) {
  if (next === current) return
  current = next
  for (const l of listeners) l()
}

export const clearReadout = () => setReadout(IDLE)

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function useReadout(): Readout {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => IDLE,
  )
}
