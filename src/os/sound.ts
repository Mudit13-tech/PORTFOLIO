'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { setSound, sfx } from '@/lib/sfx'
import { readFlag, writeFlag } from './persist'

/**
 * The sound switch.
 *
 * Off until the visitor asks for it. A portfolio that makes noise at a stranger
 * who opened it in a tab beside a meeting has already lost them, and browsers
 * will not start an AudioContext outside a gesture anyway — so the first click
 * on the switch is both the consent and the gesture that unlocks the audio.
 *
 * The value lives in a module rather than in the store because `sfx.ts` is
 * plain DOM code with no access to React, the same arrangement `motion.ts` has.
 */
const listeners = new Set<() => void>()
let enabled = false
let loaded = false

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function read(): boolean {
  // Read-through on first access rather than at import: this module is pulled
  // into the server bundle too, and localStorage does not exist there.
  if (!loaded) {
    loaded = true
    enabled = readFlag('sound') === 'on'
    setSound(enabled)
  }
  return enabled
}

export function useSound(): { soundOn: boolean | null; toggle: () => void } {
  const soundOn = useSyncExternalStore(subscribe, read, () => null)

  const toggle = useCallback(() => {
    enabled = !read()
    setSound(enabled)
    // Switching it on is both the consent and the gesture the browser needs, so
    // this is the one moment the system can introduce itself. It is also the
    // only honest way to confirm the setting: a silent "sound: on" tells you
    // nothing about whether the machine's output actually works.
    if (enabled) sfx('boot')
    writeFlag('sound', enabled ? 'on' : 'off')
    for (const fn of listeners) fn()
  }, [])

  return { soundOn, toggle }
}
