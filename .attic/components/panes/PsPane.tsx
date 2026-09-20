'use client'

import { useEffect, useMemo, useRef } from 'react'
import { projects, type Project, type ProcState } from '~/content/projects'
import { useWorkspace } from '@/lib/workspace'
import { Idle, Pane } from '../Pane'

/** Stable, derived from the slug — an index into the table, not a claim. */
function pid(slug: string): number {
  let h = 7
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) % 8999
  return 101 + h
}

const STATE_TONE: Record<ProcState, string> = {
  running: 'text-live',
  sleeping: 'text-dim',
  zombie: 'text-alert',
}

const STATE_NOTE: Record<ProcState, string> = {
  running: 'actively maintained',
  sleeping: 'finished and working, untouched',
  zombie: 'abandoned, kept for the code',
}

function score(p: Project, q: string): boolean {
  if (!q) return true
  const hay = `${p.name} ${p.summary} ${p.stack.join(' ')} ${p.state}`.toLowerCase()
  let i = 0
  for (const c of q.toLowerCase()) {
    i = hay.indexOf(c, i)
    if (i === -1) return false
    i++
  }
  return true
}

function CaseStudy({ p, onDetach }: { p: Project; onDetach: () => void }) {
  return (
    <article className="flex flex-col gap-1">
      <header className="flex flex-wrap items-baseline gap-1">
        <button type="button" onClick={onDetach} className="text-xs text-dim hover:text-live">
          ← detach
        </button>
        <h3 className="text-lg text-text">{p.name}</h3>
        <span className={`text-xs ${STATE_TONE[p.state]}`}>{p.state}</span>
        <span className="text-xs text-dim">pid {pid(p.slug)}</span>
      </header>

      <p className="text-base text-text">{p.summary}</p>

      <dl className="rule grid grid-cols-[39px_1fr] gap-x-1 pt-1 text-xs">
        <dt className="text-dim">up</dt>
        <dd className="text-dim">{p.uptime}</dd>
        {p.users ? (
          <>
            <dt className="text-dim">used</dt>
            <dd className="text-dim">{p.users}</dd>
          </>
        ) : null}
        {p.metric ? (
          <>
            <dt className="text-dim">pv</dt>
            <dd>
              <span className="text-live tabular-nums">{p.metric.value}</span>
              <span className="text-dim"> {p.metric.label}</span>
            </dd>
          </>
        ) : null}
        {p.stack.length ? (
          <>
            <dt className="text-dim">built</dt>
            <dd className="text-dim">{p.stack.join(' · ')}</dd>
          </>
        ) : null}
      </dl>

      {p.detail ? (
        <div className="rule flex flex-col gap-1 pt-1 text-sm text-text">
          {p.detail.split('\n\n').map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      ) : null}

      {(p.repo || p.demo) && (
        <p className="rule flex gap-2 pt-1 text-xs">
          {p.repo ? (
            <a href={p.repo} target="_blank" rel="noreferrer">
              source ↗
            </a>
          ) : null}
          {p.demo ? (
            <a href={p.demo} target="_blank" rel="noreferrer">
              live ↗
            </a>
          ) : null}
        </p>
      )}
    </article>
  )
}

export function PsPane({ seq }: { seq: number }) {
  const { state, dispatch } = useWorkspace()
  const filterRef = useRef<HTMLInputElement>(null)
  const q = state.filter ?? ''

  const rows = useMemo(() => projects.filter((p) => score(p, q)), [q])
  const attached = projects.find((p) => p.slug === state.attached) ?? null

  useEffect(() => {
    if (state.filter !== null) filterRef.current?.focus()
  }, [state.filter])

  const meta = attached
    ? `attached ${pid(attached.slug)}`
    : `${rows.length}/${projects.length} process${projects.length === 1 ? '' : 'es'}`

  return (
    <Pane id="ps" seq={seq} meta={meta}>
      {attached ? (
        <CaseStudy p={attached} onDetach={() => dispatch({ type: 'attach', slug: null })} />
      ) : projects.length === 0 ? (
        <Idle
          line="no processes registered"
          hint="four or five real ones go in content/projects.ts — name, state, uptime, one defensible number"
        />
      ) : (
        <>
          {state.filter !== null && (
            <div className="mb-1 flex items-center gap-1 border-b border-wire pb-1 text-xs">
              <span className="text-live">/</span>
              <input
                ref={filterRef}
                value={q}
                onChange={(e) => dispatch({ type: 'filter', value: e.target.value })}
                onKeyDown={(e) => {
                  e.stopPropagation()
                  if (e.key === 'Escape') dispatch({ type: 'filter', value: null })
                  if (e.key === 'Enter' && rows[0]) dispatch({ type: 'attach', slug: rows[0].slug })
                }}
                placeholder="filter by name, stack or state"
                spellCheck={false}
                autoComplete="off"
                className="w-full bg-transparent outline-none placeholder:text-dim"
                aria-label="filter processes"
              />
              <button type="button" onClick={() => dispatch({ type: 'filter', value: null })} className="text-dim hover:text-live">
                esc
              </button>
            </div>
          )}

          {rows.length === 0 ? (
            <Idle line={`no process matches "${q}"`} hint="esc clears the filter" />
          ) : (
            <table className="w-full border-collapse text-xs">
              <caption className="sr-only">
                Projects as a process table. Select a row to open its case study.
              </caption>
              <thead>
                <tr className="text-dim">
                  <th scope="col" className="pr-1 text-left font-normal">pid</th>
                  <th scope="col" className="pr-1 text-left font-normal">name</th>
                  <th scope="col" className="pr-1 text-left font-normal">state</th>
                  <th scope="col" className="pr-1 text-left font-normal">uptime</th>
                  <th scope="col" className="text-left font-normal">command</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.slug} className="group align-top">
                    <td className="pr-1 text-dim tabular-nums">{pid(p.slug)}</td>
                    <td className="pr-1">
                      <button
                        type="button"
                        onClick={() => dispatch({ type: 'attach', slug: p.slug })}
                        className="text-text underline-offset-2 hover:text-live hover:underline"
                      >
                        {p.name}
                      </button>
                    </td>
                    <td className={`pr-1 ${STATE_TONE[p.state]}`} title={STATE_NOTE[p.state]}>
                      {p.state}
                    </td>
                    <td className="pr-1 text-dim">{p.uptime}</td>
                    <td className="text-dim">{p.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </Pane>
  )
}
