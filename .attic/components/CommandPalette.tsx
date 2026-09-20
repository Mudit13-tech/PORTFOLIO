'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { profile } from '~/content/profile'
import { setReadout } from '@/lib/readout'
import { useWorkspace, type Action } from '@/lib/workspace'

interface Command {
  name: string
  note: string
  run: (dispatch: (a: Action) => void) => void
}

const open = (href: string) => window.open(href, '_blank', 'noopener,noreferrer')

const COMMANDS: Command[] = [
  { name: ':work', note: 'open the process table', run: (d) => d({ type: 'zoom', pane: 'ps' }) },
  { name: ':about', note: 'focus whoami', run: (d) => d({ type: 'focus', pane: 'whoami' }) },
  { name: ':log', note: 'focus the event feed', run: (d) => d({ type: 'focus', pane: 'log' }) },
  {
    name: ':cv',
    note: profile.cv ? 'open the cv' : 'no cv attached yet',
    run: () => {
      if (profile.cv) open(profile.cv)
      else setReadout({ kind: 'note', text: 'cv · channel idle — no document attached', tone: 'alert' })
    },
  },
  { name: ':theme light', note: 'switch to the light theme', run: (d) => d({ type: 'theme', theme: 'light' }) },
  { name: ':theme dark', note: 'switch to the dark theme', run: (d) => d({ type: 'theme', theme: 'dark' }) },
  { name: ':gh', note: `github/${profile.github}`, run: () => open(`https://github.com/${profile.github}`) },
  { name: ':lc', note: `leetcode/${profile.leetcode}`, run: () => open(`https://leetcode.com/u/${profile.leetcode}/`) },
  { name: ':run sort', note: 'load the sorting instrument', run: (d) => d({ type: 'run', tab: 'sort' }) },
  { name: ':run path', note: 'load the pathfinding instrument', run: (d) => d({ type: 'run', tab: 'path' }) },
  { name: ':life', note: 'seed the calendar with conway', run: (d) => d({ type: 'life', running: true }) },
  { name: ':reset', note: 'restore the measured year', run: (d) => d({ type: 'life', running: false }) },
  { name: ':help', note: 'list every binding', run: (d) => d({ type: 'overlay', overlay: 'help' }) },
  ...(profile.email
    ? [{ name: ':mail', note: profile.email, run: () => (window.location.href = `mailto:${profile.email}`) }]
    : []),
]

function match(c: Command, q: string): boolean {
  if (!q) return true
  const hay = `${c.name} ${c.note}`.toLowerCase()
  let i = 0
  for (const ch of q.toLowerCase().replace(/^:/, '')) {
    i = hay.indexOf(ch, i)
    if (i === -1) return false
    i++
  }
  return true
}

export function CommandPalette() {
  const { state, dispatch } = useWorkspace()
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  const ref = useRef<HTMLInputElement>(null)
  const isOpen = state.overlay === 'palette'

  const hits = useMemo(() => COMMANDS.filter((c) => match(c, q)), [q])

  useEffect(() => {
    if (!isOpen) return
    setQ('')
    setI(0)
    ref.current?.focus()
  }, [isOpen])

  useEffect(() => {
    setI((n) => Math.min(n, Math.max(0, hits.length - 1)))
  }, [hits.length])

  if (!isOpen) return null

  const fire = (c: Command | undefined) => {
    if (!c) return
    dispatch({ type: 'overlay', overlay: null })
    c.run(dispatch)
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center p-1"
      onClick={() => dispatch({ type: 'overlay', overlay: null })}
      style={{ paddingBottom: 39 }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="command palette"
        onClick={(e) => e.stopPropagation()}
        className="allocate w-full border border-live bg-panel"
        style={{ maxWidth: 611 }}
      >
        {hits.length > 0 && (
          <ul role="listbox" aria-label="commands" className="max-h-full overflow-auto border-b border-wire">
            {hits.map((c, n) => (
              <li key={c.name}>
                <button
                  type="button"
                  role="option"
                  aria-selected={n === i}
                  onMouseEnter={() => setI(n)}
                  onClick={() => fire(c)}
                  className={`flex w-full items-center gap-1 px-1 text-xs ${n === i ? 'bg-wire text-text' : 'text-dim'}`}
                  style={{ height: 26 }}
                >
                  <span className={n === i ? 'text-live' : 'text-dim'} style={{ width: 130 }}>
                    {c.name}
                  </span>
                  <span className="truncate">{c.note}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-1 px-1" style={{ height: 26 }}>
          <span className="text-live">:</span>
          <input
            ref={ref}
            value={q}
            onChange={(e) => setQ(e.target.value.replace(/^:/, ''))}
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === 'ArrowDown' || (e.key === 'n' && e.ctrlKey)) {
                e.preventDefault()
                setI((n) => (n + 1) % Math.max(1, hits.length))
              } else if (e.key === 'ArrowUp' || (e.key === 'p' && e.ctrlKey)) {
                e.preventDefault()
                setI((n) => (n - 1 + Math.max(1, hits.length)) % Math.max(1, hits.length))
              } else if (e.key === 'Enter') {
                e.preventDefault()
                fire(hits[i])
              } else if (e.key === 'Escape') {
                dispatch({ type: 'overlay', overlay: null })
              }
            }}
            placeholder={hits.length === 0 ? 'no such command' : 'work · about · cv · theme · gh · lc · run'}
            spellCheck={false}
            autoComplete="off"
            aria-label="command"
            className={`w-full bg-transparent text-xs outline-none ${hits.length === 0 ? 'placeholder:text-alert' : 'placeholder:text-dim'}`}
          />
          <span className="shrink-0 text-xs text-dim">esc</span>
        </div>
      </div>
    </div>
  )
}
