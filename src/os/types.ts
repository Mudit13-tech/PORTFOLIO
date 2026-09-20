import type { AppId } from '~/data'

export type { AppId }

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface Viewport {
  w: number
  h: number
}

export type SnapSide = 'left' | 'right' | 'top' | null

export type ShellKind = 'mobile' | 'tablet' | 'desktop'

export interface WindowState {
  id: AppId
  /** Which record is open inside the app, e.g. a project id. */
  payload: string | null
  minimized: boolean
  maximized: boolean
  z: number
  rect: Rect
  /** Geometry to return to when un-maximizing. */
  restore: Rect | null
  /** True while the window is showing server-rendered HTML from the entry URL. */
  fromServer: boolean
}

export interface SystemState {
  booted: boolean
  windows: WindowState[]
  /** Last entry is the focused window. */
  focusOrder: AppId[]
  nextZ: number
  /** Which apps have been opened this session — drives the ending. */
  visited: AppId[]
  /** Dock entry to flash when a window is evicted. */
  evicted: AppId | null
  overlay: 'shortcuts' | 'reveal' | null
  devMode: boolean
  sessionStart: number
  revealShown: boolean
  eggs: string[]
}

export interface SystemApi {
  open(id: AppId, payload?: string | null, opts?: { fromServer?: boolean }): void
  close(id: AppId): void
  focus(id: AppId): void
  minimize(id: AppId): void
  toggleMaximize(id: AppId): void
  move(id: AppId, x: number, y: number): void
  resize(id: AppId, rect: Rect): void
  snap(id: AppId, side: Exclude<SnapSide, null>): void
  cycle(): void
  closeFocused(): void
  setBooted(v: boolean): void
  setOverlay(v: SystemState['overlay']): void
  toggleDevMode(): void
  findEgg(id: string): void
  reset(): void
  setViewport(v: Viewport): void
}
