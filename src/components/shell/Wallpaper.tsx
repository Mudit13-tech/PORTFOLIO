'use client'

import { useEffect, useRef } from 'react'
import type { WallpaperHandle } from '@/lib/wallpaper'
import { useTheme } from '@/os/theme'

/**
 * The live desk surface, mounted as the bottom layer of the desk.
 *
 * The CSS gradient on `.wallpaper` stays underneath it and is never removed.
 * That is deliberate: it is what paints before the shader compiles, what a
 * browser without WebGL keeps, and what a visitor who asked for reduced motion
 * would be left with if the canvas ever failed — so the desk is never a black
 * rectangle for a single frame.
 */
export function Wallpaper() {
  const ref = useRef<HTMLCanvasElement>(null)
  const handle = useRef<WallpaperHandle | null>(null)
  const { theme } = useTheme()

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    let live = true

    // Dynamically imported so the shader source is not in the first bundle, and
    // so a phone that will never show the desk never downloads it.
    import('@/lib/wallpaper').then(({ mountWallpaper }) => {
      if (!live) return
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      handle.current = mountWallpaper(canvas, {
        mode: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
        // Reduced motion gets one still frame of the same image, not a
        // different wallpaper: the drift is the only thing anyone objected to.
        animate: !reduce,
      })
      canvas.dataset.live = 'true'
    })

    return () => {
      live = false
      handle.current?.destroy()
      handle.current = null
    }
  }, [])

  useEffect(() => {
    if (theme) handle.current?.setMode(theme)
  }, [theme])

  return <canvas ref={ref} aria-hidden="true" className="wallpaper-canvas" />
}
