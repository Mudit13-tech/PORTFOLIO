'use client'

import { useEffect } from 'react'
import { sfx, type Ui } from '@/lib/sfx'

/**
 * The interior's light and voice, delegated.
 *
 * Application content has no hooks — it renders on the server for the plain
 * document and inside a window from the same component — so nothing inside an
 * app can attach a handler of its own. This is the same answer the link
 * interceptor gives: one set of listeners at the top, reading the markup.
 *
 *   light   the card or tile under the pointer gets `data-lit` and the
 *           pointer's position as `--mx`/`--my`; CSS draws the spotlight.
 *   voice   hover brushes, presses tap, tabs click into their detent, the
 *           ticks under a track sound their own position. `data-sfx` on any
 *           element names a different sound, or `off` for none.
 *
 * Scoped to `.app-page`, so the chrome — which has its own sounds, fired from
 * the store — never plays twice, and anything carrying an application icon is
 * left to that icon's voice.
 */
const HOVERS = 'a.tile, a.orb-link, .round-link, .btn, label.seg, [data-sfx-hover]'
const PRESSES = 'a, button, [data-sfx]'
const LIGHTS = '.tile, .orb'

export function Interactions() {
  useEffect(() => {
    let over: Element | null = null
    let tick: Element | null = null
    let lit: HTMLElement | null = null
    let frame = 0
    let px = 0
    let py = 0

    const inApp = (el: Element | null) => !!el?.closest('.app-page')

    const light = (el: HTMLElement | null) => {
      if (el === lit) return
      lit?.removeAttribute('data-lit')
      lit = el
      lit?.setAttribute('data-lit', '')
    }

    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const t = e.target as Element
      if (!inApp(t)) {
        over = tick = null
        return
      }

      // The ticks under a track are a keyboard of their own: each one sounds
      // its position, so running the pointer along them plays a scale.
      const tk = t.closest('.tk')
      if (tk && tk !== tick) {
        const row = [...(tk.parentElement?.children ?? [])]
        sfx('notch', row.length > 1 ? row.indexOf(tk) / (row.length - 1) : 0.5)
      }
      tick = tk

      const hit = t.closest(HOVERS)
      if (hit && hit !== over && hit.getAttribute('data-sfx-hover') !== 'off' && !hit.querySelector('[data-app]')) {
        sfx('hover')
      }
      over = hit
    }

    const onDown = (e: PointerEvent) => {
      const t = e.target as Element
      if (!inApp(t) || t.closest('[data-app]')) return
      const hit = t.closest<HTMLElement>(PRESSES)
      // A tab's sound is its change, not its press — a press on the tab already
      // selected changes nothing and should say nothing.
      if (!hit || hit.closest('label.seg')) return
      const name = hit.dataset.sfx
      if (name === 'off') return
      // A control that cannot act says so, rather than pretending it did.
      if (hit.matches(':disabled, [aria-disabled="true"]')) return sfx('deny')
      sfx((name as Ui) || 'press')
    }

    const onChange = (e: Event) => {
      const t = e.target as HTMLInputElement
      const group = t.closest('.segmented')
      if (t.type !== 'radio' || !group || !inApp(group)) return
      const all = [...group.querySelectorAll('input')]
      sfx('tab', all.length > 1 ? all.indexOf(t) / (all.length - 1) : 0.5)
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      px = e.clientX
      py = e.clientY
      const el = (e.target as Element).closest<HTMLElement>(LIGHTS)
      light(el && inApp(el) ? el : null)
      if (!lit || frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        if (!lit) return
        const r = lit.getBoundingClientRect()
        lit.style.setProperty('--mx', `${Math.round(px - r.left)}px`)
        lit.style.setProperty('--my', `${Math.round(py - r.top)}px`)
      })
    }

    const onOut = (e: PointerEvent) => {
      if (!e.relatedTarget) {
        light(null)
        over = tick = null
      }
    }

    document.addEventListener('pointerover', onOver)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerout', onOut)
    document.addEventListener('change', onChange)
    return () => {
      cancelAnimationFrame(frame)
      light(null)
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerout', onOut)
      document.removeEventListener('change', onChange)
    }
  }, [])

  return null
}
