'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { readFlag, writeFlag } from './persist'

export type IconFinish = 'studio' | 'glaze' | 'paper' | 'ink'

export const ICON_FINISHES: IconFinish[] = ['studio', 'glaze', 'paper', 'ink']

export const ICON_FINISH_LABEL: Record<IconFinish, string> = {
  studio: 'Studio',
  glaze: 'Glaze',
  paper: 'Paper',
  ink: 'Ink',
}

/**
 * The icon finish, owned by the document the same way the theme is: the
 * pre-paint script in the root layout stamps `data-icons` on <html>, the CSS
 * does the rest, and this hook only reads and cycles it.
 *
 * `studio` is the default and the one exception to "no icon re-renders": it is
 * not a repaint of the SVG set but a different set entirely — nine modelled
 * objects, photographed in the browser — so `AppIcon3D` subscribes to this and
 * swaps. The other three remain pure CSS over the same markup.
 */
const listeners = new Set<() => void>()

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function isFinish(v: unknown): v is IconFinish {
  return v === 'studio' || v === 'glaze' || v === 'paper' || v === 'ink'
}

function read(): IconFinish {
  const v = document.documentElement.dataset.icons
  return isFinish(v) ? v : 'studio'
}

/** Put the saved finish back on <html> if something regenerated the document. */
export function assertIconFinish(): void {
  const root = document.documentElement
  if (isFinish(root.dataset.icons)) return
  const saved = readFlag('icons')
  root.dataset.icons = isFinish(saved) ? saved : 'studio'
}

export function useIconFinish(): { finish: IconFinish | null; cycle: () => void } {
  const finish = useSyncExternalStore(subscribe, read, () => null)

  const cycle = useCallback(() => {
    const now = read()
    const next = ICON_FINISHES[(ICON_FINISHES.indexOf(now) + 1) % ICON_FINISHES.length]
    document.documentElement.dataset.icons = next
    writeFlag('icons', next)
    for (const fn of listeners) fn()
  }, [])

  return { finish, cycle }
}
