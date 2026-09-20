import type { AppId } from './types'

/**
 * The one place a URL and an application agree on each other.
 *
 * Every app is a real URL that server-renders on its own. The window manager
 * intercepts clicks on those URLs and opens a window instead of navigating —
 * but the URL is the source of truth, so deep links, the back button, no-JS
 * visitors and crawlers all get the same content.
 */

export interface AppRef {
  id: AppId
  payload: string | null
}

export const APP_PATH: Record<AppId, string> = {
  projects: '/projects',
  failures: '/failures',
  skills: '/skills',
  experiments: '/experiments',
  monitor: '/monitor',
  about: '/about',
  contact: '/contact',
  terminal: '/terminal',
  bin: '/bin',
}

/** Apps whose detail pages live at /<app>/<id>. */
const DETAILED: AppId[] = ['projects', 'failures', 'skills', 'experiments']

export function pathFor(ref: AppRef): string {
  const base = APP_PATH[ref.id]
  return ref.payload && DETAILED.includes(ref.id) ? `${base}/${ref.payload}` : base
}

/** Resolve a same-origin pathname to an app, or null if it is not one. */
export function refFor(pathname: string): AppRef | null {
  const clean = pathname.replace(/\/+$/, '') || '/'
  if (clean === '/') return null

  const [, head, tail] = clean.split('/')
  const entry = (Object.keys(APP_PATH) as AppId[]).find((id) => APP_PATH[id] === `/${head}`)
  if (!entry) return null
  return { id: entry, payload: tail ?? null }
}

export const APP_ORDER: AppId[] = [
  'projects',
  'failures',
  'skills',
  'experiments',
  'monitor',
  'about',
  'contact',
  'bin',
  'terminal',
]

export const APP_TITLE: Record<AppId, string> = {
  projects: 'PROJECTS',
  failures: 'FAILED_BUILDS',
  skills: 'SKILLS',
  experiments: 'EXPERIMENTS',
  monitor: 'SYSTEM',
  about: 'ABOUT',
  contact: 'CONTACT',
  terminal: 'TERMINAL',
  bin: 'RECYCLE_BIN',
}

/**
 * Short names for the chrome — desk icons, the dock, the phone home screen.
 * `APP_TITLE` is the system's formal name for an application and stays in the
 * window's title bar and the menus; an 88px icon needs a word, not a path.
 */
export const APP_LABEL: Record<AppId, string> = {
  projects: 'PROJECTS',
  failures: 'FAILURES',
  skills: 'SKILLS',
  experiments: 'EXPERIMENTS',
  monitor: 'SYSTEM',
  about: 'ABOUT',
  contact: 'CONTACT',
  terminal: 'TERMINAL',
  bin: 'BIN',
}

export const APP_SUBTITLE: Record<AppId, string> = {
  projects: 'applications',
  failures: 'crash reports',
  skills: 'installed modules',
  experiments: 'test builds',
  monitor: 'monitor',
  about: 'user profile',
  contact: 'open a channel',
  terminal: 'type `help`',
  bin: 'abandoned',
}
