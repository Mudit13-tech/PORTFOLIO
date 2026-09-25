'use client'

import { useRef, useState } from 'react'
import { countFor } from '@/lib/derived'
import { DOCK_H, TOP_BAR_H } from '@/os/constants'
import { markOrigin } from '@/os/motion'
import { APP_LABEL, APP_ORDER, APP_PATH, APP_SUBTITLE, APP_TITLE } from '@/os/routes'
import { AppIcon3D } from '@/components/ui'

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
      className="absolute right-3.5 grid grid-cols-[repeat(2,100px)] gap-y-1 justify-items-center content-start"
      style={{ top: TOP_BAR_H + 12, bottom: DOCK_H }}
    >
      {APP_ORDER.map((id, i) => {
        const count = countFor(id)
        return (
          <li key={id} className="anim-icon" style={{ ['--i' as string]: i }}>
            <a
              href={APP_PATH[id]}
              tabIndex={i === active ? 0 : -1}
              onFocus={() => setActive(i)}
              onPointerDown={(e) => markOrigin(id, e.currentTarget)}
              title={`${APP_TITLE[id]} — ${APP_SUBTITLE[id]}`}
              className="desk-icon flex flex-col items-center gap-1 w-[100px] py-1.5 rounded-[10px]"
            >
              <AppIcon3D id={id} size={66} />
              <span className="flex flex-col items-center gap-px">
                {/* One line, always: the labels are title case so the longest
                    one fits the column. If a wide fallback font ever makes one
                    overflow, it is clipped rather than wrapped, so one name
                    cannot make its row taller than the others. */}
                <span className="desk-label text-[12.5px] font-medium leading-tight text-primary whitespace-nowrap max-w-full overflow-hidden text-ellipsis">
                  {APP_LABEL[id]}
                </span>
                {/* The count line is always present, even when empty, so every
                    icon in the grid is the same height and the rows line up. */}
                <span className="desk-label mono text-[10.5px] leading-tight text-secondary">
                  {count !== null ? `${count} items` : '\u00a0'}
                </span>
              </span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}
