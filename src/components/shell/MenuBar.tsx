'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { buildVersion, meta, profile } from '~/data'
import { CLOCK_DRIFT_MS, TOP_BAR_H } from '@/os/constants'
import { APP_ORDER, APP_PATH, APP_TITLE } from '@/os/routes'
import { useSystem, useSystemApi } from '@/os/SystemProvider'
import { useTheme } from '@/os/theme'
import type { AppId } from '@/os/types'
import { Glyph } from '@/components/ui'

/**
 * The menu bar.
 *
 * It carries three jobs, in this order of importance: the escape hatch
 * (Résumé and GitHub, always visible, never covered by a window), the name of
 * whatever has focus, and the menus. A recruiter with ninety seconds must never
 * have to be clever to leave with the thing they came for, so the two links sit
 * in the chrome at the top right and no overlay in this system is allowed above
 * them.
 */
export function MenuBar() {
  const api = useSystemApi()
  const focused = useSystem((s) => s.focusOrder.at(-1) ?? null)
  const [open, setOpen] = useState<string | null>(null)
  const barRef = useRef<HTMLElement>(null)

  // One listener for the whole bar: a click anywhere else closes the menus.
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!barRef.current?.contains(e.target as Node)) setOpen(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const go = useCallback(
    (id: AppId) => () => {
      api.open(id)
      window.history.pushState(null, '', APP_PATH[id])
    },
    [api],
  )

  const focusedTitle = focused ? APP_TITLE[focused] : meta.systemName

  return (
    <header
      ref={barRef}
      className="glass fixed top-0 inset-x-0 z-[500] flex items-center gap-1 px-2 border-x-0 border-t-0 rounded-none"
      style={{ height: TOP_BAR_H }}
    >
      <Menu
        id="system"
        open={open}
        setOpen={setOpen}
        label={
          <span className="text-ok text-[13px] leading-none" aria-hidden="true">
            ◈
          </span>
        }
        srLabel="System menu"
        items={<SystemItems />}
      />

      <span className="mono text-[12px] text-primary font-medium px-1.5 truncate max-w-[9rem]">
        {focusedTitle}
      </span>

      <div className="hidden sm:flex items-center gap-0.5">
        <Menu id="window" open={open} setOpen={setOpen} label="Window" items={<WindowItems />} />
        <Menu
          id="go"
          open={open}
          setOpen={setOpen}
          label="Go"
          items={
            <>
              {APP_ORDER.map((id, i) => (
                <Item key={id} onSelect={go(id)} hint={i < 8 ? `⌃${i + 1}` : undefined}>
                  <Glyph name={id} size={13} className="text-tertiary" />
                  {APP_TITLE[id]}
                </Item>
              ))}
            </>
          }
        />
        <Menu id="help" open={open} setOpen={setOpen} label="Help" items={<HelpItems />} />
      </div>

      <div className="ml-auto flex items-center gap-1 shrink-0">
        <ResumeLink />
        <a
          href={profile.links.github}
          target="_blank"
          rel="noreferrer"
          data-native="true"
          className="mono text-[12px] text-primary hover:text-ok px-1.5 py-0.5 rounded-sm"
        >
          GitHub
        </a>
        <Divider />
        <LoadMeter />
        <BarButton label="Search the system" onClick={() => api.setOverlay('launcher')}>
          <Glyph name="search" size={13} />
        </BarButton>
        <ThemeButton />
        <Divider />
        <Clock />
      </div>
    </header>
  )
}

/* -------------------------------------------------------------- menu shell
 * A disclosure, not an ARIA menu: the panel holds ordinary buttons and links,
 * so the browser's own semantics carry it. Arrow keys are added on top because
 * this is a menu bar and people will try them — but the roles never promise
 * more than what is implemented.
 */
function Menu({
  id,
  open,
  setOpen,
  label,
  srLabel,
  items,
}: {
  id: string
  open: string | null
  setOpen: (v: string | null) => void
  label: React.ReactNode
  srLabel?: string
  items: React.ReactNode
}) {
  const isOpen = open === id
  const panelRef = useRef<HTMLDivElement>(null)

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    const items = [...(panelRef.current?.querySelectorAll<HTMLElement>('[data-item]') ?? [])]
    if (!items.length) return
    e.preventDefault()
    const i = items.indexOf(document.activeElement as HTMLElement)
    const next = e.key === 'ArrowDown' ? i + 1 : i - 1
    items[(next + items.length) % items.length].focus()
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label={srLabel}
        onClick={() => setOpen(isOpen ? null : id)}
        // Once one menu is open, pointing at another opens it — the behaviour
        // every menu bar has had for forty years.
        onPointerEnter={() => open && setOpen(id)}
        className={`mono text-[12px] px-2 py-0.5 rounded-sm ${
          isOpen ? 'bg-raised text-primary' : 'text-secondary hover:text-primary'
        }`}
      >
        {label}
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          onKeyDown={onKeyDown}
          onClick={() => setOpen(null)}
          className="menu-panel glass absolute left-0 top-[calc(100%+4px)] z-[520] min-w-[15rem] rounded-lg p-1"
        >
          {items}
        </div>
      )}
    </div>
  )
}

function Item({
  children,
  onSelect,
  href,
  hint,
  disabled,
}: {
  children: React.ReactNode
  onSelect?: () => void
  href?: string
  hint?: string
  disabled?: boolean
}) {
  const className = `w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-sm mono text-[12px] ${
    disabled ? 'text-tertiary/60 cursor-default' : 'text-secondary hover:bg-raised hover:text-primary'
  }`
  const body = (
    <>
      {children}
      {hint && <span className="ml-auto text-tertiary pl-4">{hint}</span>}
    </>
  )

  if (href) {
    return (
      <a data-item href={href} className={className} target="_blank" rel="noreferrer" data-native="true">
        {body}
      </a>
    )
  }
  return (
    <button data-item type="button" onClick={onSelect} disabled={disabled} className={className}>
      {body}
    </button>
  )
}

function MenuRule() {
  return <hr className="my-1 border-0 border-t border-subtle/70" />
}

/* ------------------------------------------------------------- menu bodies */

function SystemItems() {
  const api = useSystemApi()
  const { theme, toggle } = useTheme()
  const open = (id: AppId) => () => {
    api.open(id)
    window.history.pushState(null, '', APP_PATH[id])
  }

  return (
    <>
      <Item onSelect={open('about')}>About this system</Item>
      <Item onSelect={open('monitor')}>System monitor</Item>
      <Item onSelect={open('bin')}>Recycle bin</Item>
      <MenuRule />
      <Item onSelect={toggle} hint={theme === 'light' ? 'light' : theme === 'dark' ? 'dark' : ''}>
        <Glyph name="theme" size={13} className="text-tertiary" />
        Appearance
      </Item>
      <Item onSelect={() => api.setOverlay('shortcuts')} hint="?">
        Keyboard shortcuts
      </Item>
      <MenuRule />
      <Item
        onSelect={() => {
          api.reset()
          window.location.href = '/?boot=1'
        }}
        hint="⌃⇧R"
      >
        <Glyph name="power" size={13} className="text-tertiary" />
        Restart — replay boot
      </Item>
      <p className="micro text-tertiary px-2 py-1">build {buildVersion}</p>
    </>
  )
}

function WindowItems() {
  const api = useSystemApi()
  const windows = useSystem((s) => s.windows)
  const focused = useSystem((s) => s.focusOrder.at(-1) ?? null)
  const none = focused === null

  return (
    <>
      <Item disabled={none} hint="⌃M" onSelect={() => focused && api.minimize(focused)}>
        Minimize
      </Item>
      <Item disabled={none} hint="⌃↑" onSelect={() => focused && api.toggleMaximize(focused)}>
        Zoom
      </Item>
      <Item disabled={none} hint="⌃←" onSelect={() => focused && api.snap(focused, 'left')}>
        Tile left
      </Item>
      <Item disabled={none} hint="⌃→" onSelect={() => focused && api.snap(focused, 'right')}>
        Tile right
      </Item>
      <MenuRule />
      <Item disabled={windows.length < 2} hint="⌃`" onSelect={() => api.cycle()}>
        Cycle windows
      </Item>
      <Item
        disabled={!windows.some((w) => w.minimized)}
        onSelect={() => windows.filter((w) => w.minimized).forEach((w) => api.focus(w.id))}
      >
        Bring all to front
      </Item>
      <MenuRule />
      <Item disabled={none} hint="⌃W" onSelect={() => api.closeFocused()}>
        Close
      </Item>
      <Item
        disabled={windows.length === 0}
        onSelect={() => windows.forEach((w) => api.close(w.id))}
      >
        Close all
      </Item>
    </>
  )
}

function HelpItems() {
  const api = useSystemApi()
  return (
    <>
      <Item onSelect={() => api.setOverlay('shortcuts')} hint="?">
        Keyboard shortcuts
      </Item>
      <Item onSelect={() => api.setOverlay('launcher')} hint="⌃K">
        Search everything
      </Item>
      <Item
        onSelect={() => {
          api.open('terminal')
          window.history.pushState(null, '', APP_PATH.terminal)
        }}
        hint="⌃T"
      >
        Open terminal — type <span className="text-ok">help</span>
      </Item>
      <MenuRule />
      <Item href={profile.links.github}>
        Source on GitHub
        <Glyph name="external" size={11} className="text-tertiary" />
      </Item>
    </>
  )
}

/* ------------------------------------------------------------ status items */

function Divider() {
  return <span className="w-px h-3.5 bg-subtle mx-0.5" aria-hidden="true" />
}

function BarButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid place-items-center w-6 h-6 rounded-sm text-secondary hover:text-primary hover:bg-raised"
    >
      {children}
    </button>
  )
}

function ThemeButton() {
  const { theme, toggle } = useTheme()
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme ? `Switch to ${theme === 'light' ? 'dark' : 'light'} appearance` : 'Switch appearance'}
      title="Appearance"
      className="grid place-items-center w-6 h-6 rounded-sm text-secondary hover:text-primary hover:bg-raised"
    >
      <span className={theme === 'light' ? 'rotate-180 transition-transform' : 'transition-transform'}>
        <Glyph name="theme" size={13} />
      </span>
    </button>
  )
}

/**
 * A real load figure: the share of the last sixty frames that missed the
 * 16.67ms budget. It reads zero when the system is smooth and climbs under
 * strain, which is what a load number is supposed to mean.
 *
 * Fake telemetry is worse than none. Anyone who looks at this number is
 * exactly the kind of person who will drag four windows at once to see
 * whether it moves.
 */
function LoadMeter() {
  const [load, setLoad] = useState(0)

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const samples: number[] = []

    const tick = (t: number) => {
      samples.push(t - last)
      last = t
      if (samples.length > 60) samples.shift()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const timer = setInterval(() => {
      if (samples.length < 10) return
      const missed = samples.filter((dt) => dt > 16.67 * 1.5).length
      setLoad(Math.round((missed / samples.length) * 100))
    }, 1000)

    return () => {
      cancelAnimationFrame(raf)
      clearInterval(timer)
    }
  }, [])

  return (
    <span
      className="hidden md:flex items-center gap-1 px-1 text-tertiary"
      title={`Dropped frames over the last minute: ${load}%`}
    >
      <Glyph name="pulse" size={13} className={load > 20 ? 'text-warn' : 'text-ok'} />
      <span className="mono text-[11px] tabular-nums w-6">{load}%</span>
    </span>
  )
}

/**
 * The clock runs correctly for four minutes and then stops. Clicking it reports
 * how long you have actually been here and resumes — rewarding the observation
 * rather than deflecting it.
 */
function Clock() {
  const api = useSystemApi()
  const start = useRef(Date.now())
  const [now, setNow] = useState<Date | null>(null)
  const [stuck, setStuck] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    const t = setInterval(() => {
      if (Date.now() - start.current > CLOCK_DRIFT_MS && !stuck) setStuck(true)
      if (!stuck) setNow(new Date())
    }, 1000)
    setNow(new Date())
    return () => clearInterval(t)
  }, [stuck])

  // Null until mounted: the server has no clock in the visitor's timezone, and
  // rendering one would be a hydration mismatch on every single load.
  const label = now
    ? now.toLocaleString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }) + ` ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    : '—'

  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`w-1.5 h-1.5 rounded-full ${stuck ? 'bg-warn' : 'bg-ok'}`}
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={() => {
          if (!stuck) return
          const mins = Math.round((Date.now() - start.current) / 60000)
          setNote(`you have been here ${mins} minutes. That is longer than most.`)
          setStuck(false)
          api.findEgg('clock')
          setTimeout(() => setNote(null), 6000)
        }}
        className="mono text-[12px] text-secondary tabular-nums hover:text-primary px-1 rounded-sm"
        aria-label={stuck ? 'System time has stopped. Activate to resume.' : `System time ${label}`}
      >
        {label}
      </button>
      {note && (
        <span className="glass absolute right-2 top-9 rounded-md mono text-[12px] text-warn px-2 py-1 anim-notice">
          SYSTEM TIME — {note}
        </span>
      )}
    </span>
  )
}

function ResumeLink() {
  if (!profile.links.resume) {
    return (
      <a
        href={APP_PATH.about}
        className="mono text-[12px] text-tertiary hover:text-primary px-1.5 py-0.5 rounded-sm"
        title="No résumé PDF published yet — the About window says what to do about it"
      >
        Résumé
      </a>
    )
  }
  return (
    <a
      href={profile.links.resume}
      target="_blank"
      rel="noreferrer"
      data-native="true"
      className="mono text-[12px] text-primary hover:text-ok px-1.5 py-0.5 rounded-sm"
    >
      Résumé
    </a>
  )
}
