'use client'

import { useRef, useState } from 'react'
import { countFor } from '@/lib/derived'
import { DOCK_H, TOP_BAR_H } from '@/os/constants'
import { APP_LABEL, APP_ORDER, APP_PATH, APP_SUBTITLE, APP_TITLE } from '@/os/routes'
import { AppIcon } from '@/components/ui'

/**
 * The desk.
 *
 * Every icon is a real `<a href="/projects">`. The window manager intercepts
 * the click and opens a window instead of navigating — but the link is what
 * ships in the HTML, so it is focusable, announced, followed by crawlers, and
 * it still works with JavaScript switched off. Nothing here needs an onOpen
 * callback, which is why none of the content components have one.
 *
 * One click opens. A desktop would want two, but this is a web page a stranger
 * has thirty seconds for, and hiding the content behind a double-click is a
 * joke at their expense.
 */
export function DesktopIcons() {
  const gridRef = useRef<HTMLUListElement>(null)
  const [active, setActive] = useState(0)

  const onKeyDown = (e: React.KeyboardEvent) => {
    const cols = 2
    const last = APP_ORDER.length - 1
    let next = active
    if (e.key === 'ArrowRight') next = Math.min(active + 1, last)
    else if (e.key === 'ArrowLeft') next = Math.max(active - 1, 0)
    else if (e.key === 'ArrowDown') next = Math.min(active + cols, last)
    else if (e.key === 'ArrowUp') next = Math.max(active - cols, 0)
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    else return
    e.preventDefault()
    setActive(next)
    gridRef.current?.querySelectorAll('a')[next]?.focus()
  }

  return (
    <ul
      ref={gridRef}
      onKeyDown={onKeyDown}
      aria-label="Applications"
      className="absolute right-4 grid grid-cols-2 gap-1 justify-items-center content-start"
      style={{ top: TOP_BAR_H + 10, bottom: DOCK_H }}
    >
      {APP_ORDER.map((id, i) => {
        const count = countFor(id)
        return (
          <li key={id} className="anim-icon" style={{ ['--i' as string]: i }}>
            <a
              href={APP_PATH[id]}
              tabIndex={i === active ? 0 : -1}
              onFocus={() => setActive(i)}
              title={`${APP_TITLE[id]} — ${APP_SUBTITLE[id]}`}
              className="desk-icon flex flex-col items-center gap-1.5 w-[96px] px-1 py-2.5 rounded-lg"
            >
              <AppIcon id={id} size={50} />
              {/* A label with no spaces in it may break anywhere rather than
                  widen the column and push the grid off the right edge — and
                  it reserves two lines whether it uses them or not, so one
                  long name cannot make its row taller than the others. The
                  fallback font on a cold load is wider than the one we ship,
                  and the grid has to survive that. */}
              <span className="desk-label mono text-[10px] leading-[1.15] text-center text-primary [overflow-wrap:anywhere] min-h-[2.3em] flex items-start justify-center">
                {APP_LABEL[id]}
              </span>
              {/* The count line is always present, even when empty, so every
                  icon in the grid is the same height and the rows line up. */}
              <span className="desk-label micro text-secondary leading-none">
                {count !== null ? `${count} items` : '\u00a0'}
              </span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}
