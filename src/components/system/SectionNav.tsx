'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { sfx } from '@/lib/sfx'

/**
 * The chapter bar of a long record.
 *
 * It sticks to the top of whatever is scrolling it — a window, a phone sheet,
 * the plain document — follows you through the chapters with one sliding
 * thumb, and draws how far through the whole record you are as a hairline
 * along its bottom edge. Every item is a real `#fragment` link, so without
 * scripting it is still a working table of contents.
 *
 * The chapters are found inside its own article, never by id: the plain
 * document and the window hold two copies of the same page, and an id lookup
 * would find the hidden one.
 */
export function SectionNav({ items }: { items: { id: string; label: string }[] }) {
  const ref = useRef<HTMLElement>(null)
  const thumb = useRef<HTMLSpanElement>(null)
  const [active, setActive] = useState(items[0]?.id ?? '')
  const lastActive = useRef(active)
  const fromClick = useRef(0)

  const sectionsOf = () => {
    const article = ref.current?.closest('article')
    return items
      .map((i) => article?.querySelector<HTMLElement>(`[data-chapter="${i.id}"]`))
      .filter((s): s is HTMLElement => !!s)
  }

  useEffect(() => {
    const nav = ref.current
    if (!nav) return
    const root = scrollParent(nav)
    const target: HTMLElement | Window = root ?? window
    let frame = 0

    const measure = () => {
      frame = 0
      const sections = sectionsOf()
      if (!sections.length) return
      const top = root ? root.getBoundingClientRect().top : 0
      const h = root ? root.clientHeight : window.innerHeight
      const scrolled = root ? root.scrollTop : window.scrollY
      const height = root ? root.scrollHeight : document.documentElement.scrollHeight

      let cur = sections[0]
      for (const s of sections) if (s.getBoundingClientRect().top - top <= h * 0.34) cur = s
      if (scrolled + h >= height - 4) cur = sections[sections.length - 1]
      setActive(cur.dataset.chapter ?? '')

      const progress = height > h ? scrolled / (height - h) : 1
      nav.style.setProperty('--read', progress.toFixed(4))
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    measure()
    target.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      target.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the chapter list is fixed for the life of the page
  }, [])

  // The thumb follows the active item, and the bar scrolls sideways to keep it
  // in view on a narrow screen.
  useLayoutEffect(() => {
    const nav = ref.current
    const t = thumb.current
    const item = nav?.querySelector<HTMLElement>(`[data-item="${active}"]`)
    if (!nav || !t || !item) return
    const track = item.parentElement as HTMLElement
    t.style.width = `${item.offsetWidth}px`
    t.style.transform = `translateX(${item.offsetLeft}px)`
    const left = item.offsetLeft - track.clientWidth / 2 + item.offsetWidth / 2
    track.scrollTo({ left, behavior: lastActive.current === active ? 'auto' : 'smooth' })

    // Passing into a new chapter by scrolling sounds its place in the record;
    // a click has already made its own sound.
    if (lastActive.current !== active && performance.now() - fromClick.current > 900) {
      const i = items.findIndex((x) => x.id === active)
      sfx('notch', items.length > 1 ? i / (items.length - 1) : 0.5)
    }
    lastActive.current = active
  }, [active, items])

  const go = (id: string, i: number) => {
    const s = sectionsOf().find((x) => x.dataset.chapter === id)
    if (!s) return
    fromClick.current = performance.now()
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    s.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' })
    setActive(id)
    sfx('tab', items.length > 1 ? i / (items.length - 1) : 0.5)
  }

  if (items.length < 2) return null

  return (
    <nav ref={ref} className="section-nav" aria-label="Chapters">
      <div className="section-nav-track">
        <span ref={thumb} className="section-nav-thumb" aria-hidden="true" />
        {items.map((it, i) => (
          <a
            key={it.id}
            href={`#${it.id}`}
            data-item={it.id}
            data-native="true"
            data-sfx="off"
            aria-current={active === it.id ? 'location' : undefined}
            className="section-nav-item"
            onClick={(e) => {
              e.preventDefault()
              go(it.id, i)
            }}
          >
            <span className="section-nav-n">{String(i + 1).padStart(2, '0')}</span>
            {it.label}
          </a>
        ))}
      </div>
      <span className="section-nav-read" aria-hidden="true" />
    </nav>
  )
}

/** The nearest ancestor that actually scrolls, or null for the document. */
function scrollParent(el: HTMLElement): HTMLElement | null {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const { overflowY } = getComputedStyle(p)
    if (overflowY === 'auto' || overflowY === 'scroll') return p
  }
  return null
}
