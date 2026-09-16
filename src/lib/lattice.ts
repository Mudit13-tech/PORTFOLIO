/**
 * The lattice.
 *
 * One contribution cell is CELL wide with GUT of air after it. That sum, U, is
 * the only spacing value the site is permitted to use. Every number in this
 * file is a multiple of U, a factor of U, or derived from the two — and every
 * other module imports its geometry from here rather than typing a number.
 */
export const CELL = 11
export const GUT = 2
export const U = CELL + GUT // 13

export const WEEKS = 53
export const DAYS = 7

/** Room for the day-of-week labels down the left of the calendar. */
export const LABEL_W = U * 3 // 39
/** Room for the month labels along the top. */
export const LABEL_H = U * 2 // 26

/** Intrinsic size of the calendar drawing, in CSS pixels, 1:1 with the viewBox. */
export const GRID_W = LABEL_W + WEEKS * U - GUT // 726
export const GRID_H = LABEL_H + DAYS * U - GUT // 115

/** Hairline that keeps the two ramps from bleeding into each other at the join. */
export const SEAM = 0.75

/** Simulation cadence, in milliseconds per generation. ~6fps. */
export const LIFE_MS = 166
/** Crossfade between measured data and simulation. */
export const LIFE_FADE_MS = 400

export const u = (n: number) => n * U
