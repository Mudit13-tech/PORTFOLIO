'use client'

import { useEffect, useState } from 'react'
import { buildVersion, meta, profile } from '~/data'
import { NOTICE_DISMISS_MS, REVEAL_APPS, REVEAL_MS } from '@/os/constants'
import { useSystem, useSystemApi } from '@/os/SystemProvider'
import { Glyph } from '@/components/ui'
import { DeskMenu } from './DeskMenu'
import { Launcher } from './Launcher'

/** Every overlay in the system, mounted once. */
export function Overlays() {
  return (
    <>
      <Launcher />
      <DeskMenu />
      <ShortcutOverlay />
      <DevMode />
      <UpdateNotice />
      <Reveal />
      <Konami />
    </>
  )
}

const SHORTCUTS: Array<[string, string]> = [
  ['?', 'This overlay'],
  ['Ctrl + K', 'Search everything'],
  ['Esc', 'Close focused window'],
  ['Ctrl + `', 'Cycle windows'],
  ['Ctrl + 1…8', 'Open app by index'],
  ['Ctrl + T', 'Terminal'],
  ['Ctrl + W', 'Close focused window'],
  ['Ctrl + M', 'Minimize focused window'],
  ['Ctrl + ↑', 'Maximize / restore'],
  ['Ctrl + ← / →', 'Snap left / right'],
  ['Ctrl + Shift + D', 'Dev mode'],
  ['Ctrl + Shift + R', 'Reset system, replay boot'],
]

function ShortcutOverlay() {
  const open = useSystem((s) => s.overlay === 'shortcuts')
  const api = useSystemApi()
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[900] grid place-items-center bg-desk/70 p-6"
      onClick={() => api.setOverlay(null)}
    >
      <div
        role="dialog"
        aria-label="Keyboard shortcuts"
        className="glass anim-pop rounded-2xl p-5 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mono text-secondary border-b border-subtle pb-2 mb-3">KEYBOARD</h2>
        <dl className="grid gap-1.5">
          {SHORTCUTS.map(([key, action]) => (
            <div key={key} className="flex items-baseline gap-3">
              <dt className="mono text-[12px] text-ok w-32 shrink-0">{key}</dt>
              <dd className="text-[14px] text-secondary">{action}</dd>
            </div>
          ))}
        </dl>
        <button
          type="button"
          onClick={() => api.setOverlay(null)}
          className="mono text-[12px] text-tertiary hover:text-primary mt-4"
        >
          Esc to close
        </button>
      </div>
    </div>
  )
}

/**
 * Dev mode reads real values. Fake telemetry is worse than none — anyone who
 * opens this panel is exactly the kind of person who will check it.
 */
function DevMode() {
  const on = useSystem((s) => s.devMode)
  const windowCount = useSystem((s) => s.windows.length)
  const api = useSystemApi()
  const [stats, setStats] = useState({ fps: 0, nodes: 0, memory: 0 })

  useEffect(() => {
    if (!on) return
    let raf = 0
    let frames = 0
    let last = performance.now()

    const tick = () => {
      frames++
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const timer = setInterval(() => {
      const now = performance.now()
      const fps = Math.round((frames * 1000) / (now - last))
      frames = 0
      last = now
      const mem = (performance as { memory?: { usedJSHeapSize: number } }).memory
      setStats({
        fps,
        nodes: document.querySelectorAll('*').length,
        memory: mem ? Math.round(mem.usedJSHeapSize / 1048576) : 0,
      })
    }, 1000)

    return () => {
      cancelAnimationFrame(raf)
      clearInterval(timer)
    }
  }, [on])

  if (!on) return null

  return (
    <div className="glass fixed bottom-24 right-3 z-[850] rounded-xl p-3 mono text-[12px] w-52">
      <div className="flex items-center justify-between mb-2">
        <span className="text-secondary">DEV MODE</span>
        <button type="button" onClick={() => api.toggleDevMode()} aria-label="Close dev mode">
          <Glyph name="close" size={12} className="text-tertiary hover:text-primary" />
        </button>
      </div>
      <dl className="grid gap-1 text-tertiary">
        <Row label="FPS" value={String(stats.fps)} />
        <Row label="DOM NODES" value={String(stats.nodes)} />
        <Row label="OPEN WINDOWS" value={String(windowCount)} />
        <Row label="MEMORY" value={stats.memory ? `${stats.memory} MB` : 'n/a'} />
        <Row label="BUILD" value={buildVersion} />
      </dl>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt>{label}</dt>
      <dd className="text-ok tabular-nums">{value}</dd>
    </div>
  )
}

/**
 * The ending, offered rather than imposed. It fires only for a visitor who has
 * opened five apps and stayed three minutes, and it never covers what they were
 * reading — the v1 version took the screen unasked, which punishes exactly the
 * people who engaged most.
 */
function UpdateNotice() {
  const visited = useSystem((s) => s.visited.length)
  const revealShown = useSystem((s) => s.revealShown)
  const sessionStart = useSystem((s) => s.sessionStart)
  const api = useSystemApi()
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (dismissed || revealShown) return
    const t = setInterval(() => {
      if (visited >= REVEAL_APPS && Date.now() - sessionStart > REVEAL_MS) setShow(true)
    }, 5000)
    return () => clearInterval(t)
  }, [dismissed, revealShown, sessionStart, visited])

  useEffect(() => {
    if (!show) return
    const t = setTimeout(() => {
      setShow(false)
      setDismissed(true)
    }, NOTICE_DISMISS_MS)
    return () => clearTimeout(t)
  }, [show])

  if (!show) return null

  return (
    <div className="glass fixed top-10 right-3 z-[860] anim-notice rounded-xl px-3 py-2 flex items-center gap-3">
      <span className="mono text-[12px] text-secondary">◈ SYSTEM UPDATE AVAILABLE</span>
      <button
        type="button"
        onClick={() => {
          setShow(false)
          api.setOverlay('reveal')
        }}
        className="mono text-[12px] text-ok hover:text-primary underline underline-offset-2"
      >
        install
      </button>
    </div>
  )
}

function Reveal() {
  const open = useSystem((s) => s.overlay === 'reveal')
  const api = useSystemApi()
  if (!open) return null

  return (
    <div className="wallpaper fixed inset-0 z-[950] grid place-items-center p-6 text-center">
      <div className="grid gap-6">
        <p className="mono text-[13px] text-tertiary">You&apos;ve explored the system.</p>
        <p className="text-[32px] leading-[1.15] tracking-[-0.02em] text-primary">
          There is no final version.
          <br />
          Only the next build.
        </p>
        <div className="mt-4">
          <p className="mono text-secondary">{profile.name.toUpperCase()}</p>
          <p className="micro text-tertiary mt-1">{profile.role.toLowerCase()}</p>
        </div>
        <div className="flex flex-wrap gap-4 justify-center mono text-[13px]">
          <a href="/contact" onClick={() => api.setOverlay(null)} className="text-ok hover:text-primary">
            [ start a conversation ]
          </a>
          {/* Never trap someone at the end of an experience they enjoyed. */}
          <button type="button" onClick={() => api.setOverlay(null)} className="text-tertiary hover:text-primary">
            [ back to desktop ]
          </button>
        </div>
      </div>
    </div>
  )
}

const CODE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
]

function Konami() {
  const api = useSystemApi()
  const [on, setOn] = useState(false)

  useEffect(() => {
    let i = 0
    const onKey = (e: KeyboardEvent) => {
      i = e.key === CODE[i] ? i + 1 : 0
      if (i === CODE.length) {
        i = 0
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
        document.documentElement.dataset.crt = '1'
        setOn(true)
        api.findEgg('crt')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [api])

  useEffect(() => {
    if (!on) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      delete document.documentElement.dataset.crt
      setOn(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [on])

  if (!on) return null

  return (
    <div className="glass fixed bottom-24 left-3 z-[870] mono text-[12px] rounded-lg px-2 py-1 text-warn">
      CRT MODE — Esc to exit
    </div>
  )
}

export { meta }
