'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Snapshot } from '@/lib/types'

const STEP_MS = 150

/**
 * Cold start, once.
 *
 * It reports what actually happened during acquisition — channel states, real
 * counts, the snapshot date — and then gets out of the way. Eight lines is the
 * ceiling on purpose: past that it stops being a power-on self test and starts
 * being a cutscene.
 */
export function Boot({ snapshot }: { snapshot: Snapshot }) {
  const [gone, setGone] = useState(false)
  const [shown, setShown] = useState(0)

  const lines = useMemo(() => {
    const [gh, lc] = snapshot.channels
    const pad = (s: string, n: number) => s.padEnd(n, ' ')
    const stamp = snapshot.fallback ? 'fallback' : snapshot.generatedAt.slice(0, 10)
    return [
      { k: 'sys', v: 'ics workspace · cold start', tone: 'text-dim' },
      { k: 'daq', v: `${snapshot.channels.length} channels registered`, tone: 'text-dim' },
      {
        k: 'ch0',
        v: `${pad(gh.label, 9)} ${pad(gh.state, 9)} ${gh.total} contributions`,
        tone: gh.state === 'ok' ? 'text-live' : 'text-alert',
      },
      {
        k: 'ch1',
        v: `${pad(lc.label, 9)} ${pad(lc.state, 9)} ${lc.total} accepted`,
        tone: lc.state === 'ok' ? 'text-cool' : 'text-alert',
      },
      { k: 'cal', v: `lattice locked at 13 px · ${snapshot.days.length} cells`, tone: 'text-dim' },
      { k: 'snap', v: `${stamp} · revalidate 24 h · no client fetch`, tone: 'text-dim' },
      { k: 'in', v: 'keyboard · pointer · touch', tone: 'text-dim' },
      { k: 'ok', v: 'loop closed · handoff to workspace', tone: 'text-live' },
    ]
  }, [snapshot])

  useEffect(() => {
    const root = document.documentElement
    if (root.dataset.boot !== '1') {
      setGone(true)
      return
    }

    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      delete root.dataset.boot
      try {
        localStorage.setItem('ics:booted', '1')
      } catch {
        /* a visitor with storage blocked simply sees it again */
      }
      setGone(true)
    }

    const id = window.setInterval(() => {
      setShown((n) => {
        if (n + 1 >= lines.length) {
          window.clearInterval(id)
          window.setTimeout(finish, STEP_MS * 2)
        }
        return n + 1
      })
    }, STEP_MS)

    window.addEventListener('keydown', finish, { once: true })
    window.addEventListener('pointerdown', finish, { once: true })
    return () => {
      window.clearInterval(id)
      window.removeEventListener('keydown', finish)
      window.removeEventListener('pointerdown', finish)
    }
  }, [lines.length])

  if (gone) return null

  return (
    <div
      className="boot fixed inset-0 z-50 place-items-center bg-void p-2"
      role="status"
      aria-label="starting up"
    >
      <div className="w-full" style={{ maxWidth: 507 }}>
        <ol className="flex flex-col" style={{ minHeight: 8 * 26 }}>
          {lines.slice(0, shown).map((l) => (
            <li key={l.k} className="flex gap-1 text-sm" style={{ lineHeight: '26px' }}>
              <span className="shrink-0 text-dim" style={{ width: 39 }}>
                {l.k}
              </span>
              <span className={l.tone}>{l.v}</span>
            </li>
          ))}
          {shown < lines.length && (
            <li className="text-sm" style={{ lineHeight: '26px' }} aria-hidden="true">
              <span className="inline-block" style={{ width: 39 }} />
              <span
                className="caret inline-block align-middle"
                style={{ width: 11, height: 11, background: 'var(--c-live)' }}
              />
            </li>
          )}
        </ol>
        <p className="text-xs text-dim">any key skips · shown once</p>
      </div>
    </div>
  )
}
