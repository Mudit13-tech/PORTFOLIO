'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { profile } from '~/content/profile'

/**
 * The world stays intact and the visitor is not the punchline. An address
 * with nothing wired to it is an ordinary condition in a system like this —
 * it gets reported the way any other channel fault would be.
 */
export default function NotFound() {
  const [addr, setAddr] = useState('')
  useEffect(() => setAddr(window.location.pathname), [])

  return (
    <div className="min-h-dvh p-1" style={{ paddingBottom: 39 }}>
      <section className="pane allocate mx-auto" style={{ maxWidth: 611 }}>
        <h2 className="pane-title">
          <span className="pane-tick" aria-hidden="true" style={{ background: 'var(--c-alert)' }} />
          <span className="text-alert">channel</span>
          <span className="ml-auto text-dim">unmapped</span>
        </h2>

        <div className="pane-body flex flex-col gap-1">
          <h1 className="text-xl text-text">404</h1>
          <p className="text-base text-dim">
            nothing is wired to this address. the link is not malformed — there is simply no
            channel behind it.
          </p>

          <dl className="rule grid grid-cols-[52px_1fr] gap-x-1 pt-1 text-xs">
            <dt className="text-dim">addr</dt>
            <dd className="truncate text-text">{addr || '—'}</dd>
            <dt className="text-dim">state</dt>
            <dd className="text-alert">no route</dd>
            <dt className="text-dim">next</dt>
            <dd className="text-dim">the workspace is still running</dd>
          </dl>

          <p className="rule flex flex-wrap gap-2 pt-1 text-xs">
            <Link href="/" className="border border-live px-1 text-live no-underline">
              return to the workspace
            </Link>
            <a href={`https://github.com/${profile.github}`} target="_blank" rel="noreferrer">
              github ↗
            </a>
            <a href={`https://leetcode.com/u/${profile.leetcode}/`} target="_blank" rel="noreferrer">
              leetcode ↗
            </a>
          </p>
        </div>
      </section>

      <footer
        className="fixed inset-x-0 bottom-0 flex items-center gap-1 border-t border-wire bg-panel px-1 text-xs"
        style={{ height: 26, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <span className="px-1 text-void" style={{ background: 'var(--c-alert)' }}>
          fault
        </span>
        <span className="text-dim">channel</span>
        <span className="ml-auto text-dim">enter returns home</span>
      </footer>
    </div>
  )
}
