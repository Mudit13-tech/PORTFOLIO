'use client'

import { useCallback, useEffect, useReducer, useRef, useState } from 'react'

/**
 * Pulls frames from a live generator at a chosen rate.
 *
 * History is kept so the scrubber can run backwards, but nothing is computed
 * ahead of the playhead: moving forward past the end of history calls .next()
 * on a generator that is still suspended mid-algorithm.
 *
 * The pull is deliberately imperative rather than done inside a state updater.
 * React invokes updater functions twice under Strict Mode to catch impure
 * ones, and an updater that advanced a generator would silently eat every
 * other frame.
 */
export interface Stepper<T> {
  frame: T | undefined
  at: number
  length: number
  running: boolean
  finished: boolean
  load: (g: Generator<T>, autostart?: boolean) => void
  forward: () => void
  back: () => void
  seek: (i: number) => void
  toggle: () => void
  stop: () => void
}

export function useStepper<T>(rate: number): Stepper<T> {
  const gen = useRef<Generator<T> | null>(null)
  const hist = useRef<T[]>([])
  const at = useRef(-1)
  const fin = useRef(false)
  const [, bump] = useReducer((n: number) => n + 1, 0)
  const [running, setRunning] = useState(false)

  const load = useCallback((g: Generator<T>, autostart = false) => {
    gen.current = g
    const first = g.next()
    hist.current = first.done ? [] : [first.value as T]
    at.current = first.done ? -1 : 0
    fin.current = Boolean(first.done)
    setRunning(autostart && !first.done)
    bump()
  }, [])

  const forward = useCallback(() => {
    if (at.current < hist.current.length - 1) {
      at.current += 1
      bump()
      return
    }
    const g = gen.current
    if (!g || fin.current) {
      setRunning(false)
      return
    }
    const r = g.next()
    if (r.done) {
      fin.current = true
      setRunning(false)
      bump()
      return
    }
    hist.current = [...hist.current, r.value as T]
    at.current += 1
    bump()
  }, [])

  const back = useCallback(() => {
    if (at.current <= 0) return
    at.current -= 1
    setRunning(false)
    bump()
  }, [])

  const seek = useCallback((i: number) => {
    const next = Math.min(Math.max(0, i), hist.current.length - 1)
    if (next === at.current) return
    at.current = next
    setRunning(false)
    bump()
  }, [])

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(forward, Math.max(16, Math.round(1000 / rate)))
    return () => window.clearInterval(id)
  }, [running, rate, forward])

  return {
    frame: at.current >= 0 ? hist.current[at.current] : undefined,
    at: at.current,
    length: hist.current.length,
    running,
    finished: fin.current,
    load,
    forward,
    back,
    seek,
    toggle: () => setRunning((r) => (fin.current && at.current >= hist.current.length - 1 ? false : !r)),
    stop: () => setRunning(false),
  }
}
