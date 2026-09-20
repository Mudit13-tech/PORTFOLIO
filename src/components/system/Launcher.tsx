'use client'

import { useEffect, useMemo, useState } from 'react'
import { bin, experiments, failures, projects, skills } from '~/data'
import { APP_ORDER, APP_PATH, APP_SUBTITLE, APP_TITLE, pathFor, refFor } from '@/os/routes'
import { useSystem, useSystemApi } from '@/os/SystemProvider'
import type { AppId } from '@/os/types'
import { Glyph } from '@/components/ui'

/**
 * Search everything — ⌃K.
 *
 * The index is built once from the same data the applications render, so a
 * project added to `data/projects.ts` is searchable without anyone
 * remembering to register it here.
 */

interface Entry {
  id: string
  title: string
  kind: string
  app: AppId
  href: string
}

const INDEX: Entry[] = [
  ...APP_ORDER.map((id) => ({
    id: `app:${id}`,
    title: APP_TITLE[id],
    kind: APP_SUBTITLE[id],
    app: id,
    href: APP_PATH[id],
  })),
  ...projects.map((p) => ({
    id: `project:${p.id}`,
    title: p.name,
    kind: `${p.type} · ${p.status}`,
    app: 'projects' as const,
    href: `/projects/${p.id}`,
  })),
  ...failures.map((f) => ({
    id: `failure:${f.id}`,
    title: f.title,
    kind: `crash report · ${f.status}`,
    app: 'failures' as const,
    href: `/failures/${f.id}`,
  })),
  ...skills.map((s) => ({
    id: `skill:${s.id}`,
    title: s.name,
    kind: `module · ${s.category}`,
    app: 'skills' as const,
    href: `/skills/${s.id}`,
  })),
  ...experiments.map((e) => ({
    id: `experiment:${e.id}`,
    title: e.name,
    kind: `experiment · ${e.category}`,
    app: 'experiments' as const,
    href: `/experiments/${e.id}`,
  })),
  ...bin.map((b) => ({
    id: `bin:${b.id}`,
    title: b.name,
    kind: `in the bin · ${b.meta}`,
    app: 'bin' as const,
    href: '/bin',
  })),
]

export function Launcher() {
  const open = useSystem((s) => s.overlay === 'launcher')
  const api = useSystemApi()
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return INDEX.slice(0, 9)
    return INDEX.map((e) => {
      const title = e.title.toLowerCase().indexOf(q)
      const kind = e.kind.toLowerCase().indexOf(q)
      // A hit in the name beats a hit in the description, and an earlier hit
      // beats a later one. That is the whole ranking, and it is enough.
      const score = title >= 0 ? title : kind >= 0 ? 100 + kind : -1
      return { e, score }
    })
      .filter((r) => r.score >= 0)
      .sort((a, b) => a.score - b.score)
      .slice(0, 9)
      .map((r) => r.e)
  }, [query])

  useEffect(() => {
    setCursor(0)
  }, [query])

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  if (!open) return null

  const launch = (entry: Entry) => {
    const ref = refFor(entry.href)
    api.setOverlay(null)
    if (!ref) return
    api.open(ref.id, ref.payload)
    window.history.pushState(null, '', pathFor(ref))
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const next = e.key === 'ArrowDown' ? cursor + 1 : cursor - 1
      setCursor((next + results.length) % Math.max(1, results.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const entry = results[cursor]
      if (entry) launch(entry)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[900] flex items-start justify-center pt-[12vh] px-4 bg-desk/55"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) api.setOverlay(null)
      }}
    >
      <div
        role="dialog"
        aria-label="Search the system"
        className="glass anim-pop w-full max-w-lg rounded-2xl overflow-hidden"
      >
        <div className="flex items-center gap-2.5 px-3.5 h-12 border-b border-subtle/70">
          <Glyph name="search" size={16} className="text-tertiary shrink-0" />
          {/* eslint-disable-next-line jsx-a11y/no-autofocus -- the dialog exists
              to receive typing; opening it and not focusing the field would be
              a bug, not a courtesy. */}
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="projects, crash reports, modules…"
            aria-label="Search projects, crash reports, modules and experiments"
            className="flex-1 bg-transparent text-[15px] text-primary placeholder:text-tertiary"
          />
          <kbd className="mono text-[11px] text-tertiary border border-subtle rounded px-1.5 py-0.5">
            esc
          </kbd>
        </div>

        {results.length === 0 ? (
          <p className="mono text-[13px] text-tertiary px-3.5 py-6 text-center">
            Nothing matches “{query}”. The terminal has <span className="text-ok">grep</span>.
          </p>
        ) : (
          <ul className="py-1.5 max-h-[52vh] overflow-y-auto">
            {results.map((entry, i) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => launch(entry)}
                  onPointerEnter={() => setCursor(i)}
                  aria-current={i === cursor}
                  className={`w-full flex items-center gap-3 text-left px-3.5 py-2 ${
                    i === cursor ? 'bg-raised' : ''
                  }`}
                >
                  <Glyph name={entry.app} size={14} className="text-tertiary shrink-0" />
                  <span className="text-[14px] text-primary truncate">{entry.title}</span>
                  <span className="ml-auto mono text-[11px] text-tertiary truncate max-w-[45%]">
                    {entry.kind}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
