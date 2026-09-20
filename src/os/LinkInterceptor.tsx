'use client'

import { useCallback } from 'react'
import { pathFor, refFor } from './routes'
import { useSystemApi } from './SystemProvider'

/**
 * One capture-phase click listener turns every real link into a window.
 *
 * This is why no content component ever receives an `onOpen` callback or
 * touches the store: a project links to its crash report with a plain
 * `<a href="/failures/ota-dev-bundle">`. That link works with JavaScript
 * disabled, is followed by crawlers, is focusable and announced by screen
 * readers, and — when the system is running — opens a window instead of
 * navigating, rewriting the URL so the deep link stays shareable.
 *
 * Modifier-clicks, middle-clicks, downloads and external links fall through to
 * the browser untouched, because a visitor who cmd-clicks wants a new tab.
 */
export function LinkInterceptor({ children }: { children: React.ReactNode }) {
  const api = useSystemApi()

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.defaultPrevented) return
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return
      if (anchor.dataset.native === 'true') return

      const url = new URL(anchor.href, window.location.origin)
      if (url.origin !== window.location.origin) return

      const ref = refFor(url.pathname)
      if (!ref) return

      e.preventDefault()
      api.open(ref.id, ref.payload)
      window.history.pushState(null, '', pathFor(ref))
    },
    [api],
  )

  return (
    <div onClickCapture={onClick} style={{ display: 'contents' }}>
      {children}
    </div>
  )
}
