'use client'

import { useLayoutEffect, useRef } from 'react'

/**
 * The thumb of a segmented control, sliding.
 *
 * The filter works with no JavaScript at all — its tabs are radio buttons and
 * the selected one paints its own background. This is the enhancement on top:
 * once it has measured the group it takes over that background, as one thumb
 * that springs from tab to tab and stretches on the way, so the choice reads
 * as a movement rather than as one tab going dark while another lights up.
 * Until it has measured, and wherever it never runs, the plain version stands.
 */
export function SegGlide() {
  const ref = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const thumb = ref.current
    const group = thumb?.parentElement
    if (!thumb || !group) return

    let last = -1
    const place = (animate: boolean) => {
      const tab = group.querySelector('input:checked')?.closest('.seg')?.querySelector<HTMLElement>(':scope > span')
      if (!tab) return
      // Layout offsets, not client rects: a window grows out of its icon under
      // a scale transform, and a rect measured mid-animation is a scaled one.
      const x = tab.offsetLeft
      thumb.style.transition = animate ? '' : 'none'
      thumb.style.width = `${tab.offsetWidth}px`
      thumb.style.transform = `translateX(${x}px)`
      // The stretch: a thumb travelling far leans into the move for a moment.
      if (animate && last >= 0) {
        const far = Math.min(1, Math.abs(x - last) / 160)
        thumb.animate(
          [{ scale: '1 1' }, { scale: `${1 + far * 0.14} ${1 - far * 0.1}` }, { scale: '1 1' }],
          { duration: 420, easing: 'cubic-bezier(0.3, 0.7, 0.4, 1)' },
        )
      }
      last = x
    }

    place(false)
    group.dataset.glide = 'on'
    // The first placement must not animate from the left edge.
    requestAnimationFrame(() => {
      thumb.style.transition = ''
    })

    const onChange = () => place(true)
    const ro = new ResizeObserver(() => place(false))
    group.addEventListener('change', onChange)
    ro.observe(group)
    return () => {
      group.removeEventListener('change', onChange)
      ro.disconnect()
      delete group.dataset.glide
    }
  }, [])

  return <span ref={ref} className="seg-glide" aria-hidden="true" />
}
