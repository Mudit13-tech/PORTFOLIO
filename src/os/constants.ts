/** Every magic number the window manager uses, in one place. */

/** The menu bar is a strip, not a header — it holds one line of 12px text. */
export const TOP_BAR_H = 30
/** Reserved for the dock: the floating bar plus the air around it. */
export const DOCK_H = 84
export const CHROME_H = 40

export const MIN_W = 320
export const MIN_H = 240

/** Cascade offset for each newly opened window, reset after this many. */
export const CASCADE = 28
export const CASCADE_RESET = 6

/** A window can never be lost off-canvas: this much chrome always stays on. */
export const KEEP_ON_SCREEN = 80

export const Z_BASE = 100
export const Z_RENORM = 400

/** Opening a seventh window closes the oldest unfocused one. */
export const MAX_WINDOWS = 6

export const BP_TABLET = 768
export const BP_DESKTOP = 1024

/** Drag within this distance of an edge arms the snap preview. */
export const SNAP_EDGE = 24

export const BOOT_STAGGER = 55
export const BOOT_MAX = 2400

/** The ending fires only for visitors who actually explored. */
export const REVEAL_APPS = 5
export const REVEAL_MS = 3 * 60 * 1000
export const NOTICE_DISMISS_MS = 12_000

/** The DO_NOT_OPEN folder appears after this long. */
export const EGG_FOLDER_MS = 90_000
/** The clock runs correctly for this long, then stops. */
export const CLOCK_DRIFT_MS = 4 * 60 * 1000

export const STORAGE_KEY = 'mudit-os.v1'
