import { STORAGE_KEY } from './constants'
import type { AppId, Rect } from './types'

/**
 * Layout persistence, so a returning visitor finds their desk as they left it.
 *
 * Every read and write is wrapped: private browsing throws on access to
 * localStorage, and a portfolio that white-screens in a private window is a
 * portfolio that fails the one test a cautious recruiter runs.
 */

export interface SavedWindow {
  id: AppId
  payload: string | null
  rect: Rect
  maximized: boolean
  minimized: boolean
}

export interface SavedLayout {
  windows: SavedWindow[]
  focusOrder: AppId[]
}

export function loadLayout(): SavedLayout | null {
  try {
    const raw = window.localStorage.getItem(`${STORAGE_KEY}.layout`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SavedLayout
    if (!Array.isArray(parsed?.windows)) return null
    return parsed
  } catch {
    return null
  }
}

export function saveLayout(layout: SavedLayout): void {
  try {
    window.localStorage.setItem(`${STORAGE_KEY}.layout`, JSON.stringify(layout))
  } catch {
    /* quota or private mode — the desk simply will not be restored */
  }
}

export function readFlag(key: string): string | null {
  try {
    return window.localStorage.getItem(`${STORAGE_KEY}.${key}`)
  } catch {
    return null
  }
}

export function writeFlag(key: string, value: string): void {
  try {
    window.localStorage.setItem(`${STORAGE_KEY}.${key}`, value)
  } catch {
    /* ignored by design */
  }
}
