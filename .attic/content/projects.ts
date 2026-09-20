/**
 * The process table.
 *
 * state    running  — actively maintained
 *          sleeping — finished and working, not being touched
 *          zombie   — abandoned, kept because the code is still instructive
 *
 * uptime   how long you actively maintained it, in your own words
 *          ("4 months", "one semester"). Not a fake uptime counter.
 *
 * metric   one number you can defend, with its label. Omit it entirely rather
 *          than rounding something up. The row renders fine without it.
 */
export type ProcState = 'running' | 'sleeping' | 'zombie'

export interface Project {
  /** Stable slug — becomes /work/<slug>. */
  slug: string
  name: string
  /** One line. Shown in the table. */
  summary: string
  /** Full case study, shown when the row is attached. Markdown-ish plain text; blank line separates paragraphs. */
  detail: string | null
  state: ProcState
  uptime: string
  /** Who actually used it. Null if the honest answer is "only me". */
  users: string | null
  metric: { value: string; label: string } | null
  stack: string[]
  repo: string | null
  demo: string | null
}

/**
 * TODO — four or five real ones. Example of the shape, kept commented so the
 * empty state stays visible until you fill it in:
 *
 * {
 *   slug: 'flow-rig',
 *   name: 'flow-rig',
 *   summary: 'PID loop tuner for a lab flow rig, with live step-response capture.',
 *   detail: 'What the problem was.\n\nWhat you built.\n\nWhat it cost you.',
 *   state: 'sleeping',
 *   uptime: '5 months',
 *   users: 'the control systems lab, 2 batches',
 *   metric: { value: '±0.4%', label: 'steady-state error' },
 *   stack: ['Python', 'NumPy', 'Arduino'],
 *   repo: 'https://github.com/Mudit13-tech/flow-rig',
 *   demo: null,
 * },
 */
export const projects: Project[] = []
