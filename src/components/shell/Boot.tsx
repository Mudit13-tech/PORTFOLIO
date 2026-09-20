'use client'

import { useEffect, useRef, useState } from 'react'
import { buildVersion, meta } from '~/data'
import { bootLines } from '@/lib/derived'
import { BOOT_MAX } from '@/os/constants'
import { readFlag, writeFlag } from '@/os/persist'
import { useSystem, useSystemApi } from '@/os/SystemProvider'

/**
 * The boot sequence.
 *
 * Shown once per visitor and capped at 2.4 seconds, with Skip focusable from
 * the first frame. The counts are read from the data files, so they can never
 * drift from what the system actually contains, and the version string is the
 * last deploy date rather than an invented number.
 *
 * The visitor should feel they entered a system, not that they waited for a
 * loading screen. Those are one second apart.
 */
export function Boot() {
  const api = useSystemApi()
  const booted = useSystem((s) => s.booted)
  const [ready, setReady] = useState(false)
  const skipRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const forced = new URLSearchParams(window.location.search).get('boot') === '1'
    const seen = readFlag('booted') === '1'
    const quiet = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (seen && !forced) {
      api.setBooted(true)
      setReady(true)
      return
    }

    setReady(true)
    skipRef.current?.focus()

    const done = () => {
      writeFlag('booted', '1')
      api.setBooted(true)
    }

    const t = setTimeout(done, quiet ? 800 : BOOT_MAX)
    return () => clearTimeout(t)
  }, [api])

  useEffect(() => {
    if (booted) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault()
        writeFlag('booted', '1')
        api.setBooted(true)
        if (e.key === 'Escape') {
          api.open('projects')
          window.history.pushState(null, '', '/projects')
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [api, booted])

  if (booted || !ready) return null

  return (
    <div className="wallpaper fixed inset-0 z-[1000] grid place-items-center p-6">
      <div className="glass rounded-2xl p-6 w-full max-w-md mono text-[13px]">
        <p className="flex items-center gap-2 text-secondary">
          <span className="text-ok" aria-hidden="true">
            ◈
          </span>
          {meta.systemName}
          <span className="text-tertiary">· build {buildVersion}</span>
        </p>

        <ul className="mt-5 grid gap-0.5" aria-label="Boot sequence">
          {bootLines.map((line, i) => (
            <li
              key={line.label}
              className="anim-boot-line flex text-tertiary"
              style={{ ['--i' as string]: i }}
            >
              <span className="truncate">{line.label}</span>
              <span className="flex-1 border-b border-dotted border-subtle mx-1 translate-y-[-4px]" />
              <span className="text-ok shrink-0">{line.value}</span>
            </li>
          ))}
        </ul>

        {/* The wait, made honest: the bar runs for exactly as long as the boot
            screen will, and Skip is focusable from the first frame. */}
        <div className="h-[3px] rounded-full bg-raised overflow-hidden mt-5" aria-hidden="true">
          <div
            className="anim-progress h-full bg-ok"
            style={{ ['--boot-ms' as string]: `${BOOT_MAX}ms` }}
          />
        </div>

        <p
          className="anim-boot-line mt-4 text-warn"
          style={{ ['--i' as string]: bootLines.length }}
        >
          WARNING: some modules are unstable.
          <br />
          <span className="text-tertiary">This is intentional.</span>
        </p>

        <div
          className="anim-boot-line mt-5 grid gap-1.5"
          style={{ ['--i' as string]: bootLines.length + 1 }}
        >
          <button
            ref={skipRef}
            type="button"
            onClick={() => {
              writeFlag('booted', '1')
              api.setBooted(true)
            }}
            className="text-left text-primary hover:text-ok"
          >
            &gt; BOOT ANYWAY <span className="text-tertiary">[ Enter ]</span>
          </button>
          <a
            href="/projects"
            onClick={() => {
              writeFlag('booted', '1')
              api.setBooted(true)
            }}
            className="text-left text-primary hover:text-ok"
          >
            &gt; SKIP TO PROJECTS <span className="text-tertiary">[ Esc ]</span>
          </a>
        </div>
      </div>
    </div>
  )
}
