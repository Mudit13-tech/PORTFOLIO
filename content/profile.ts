/**
 * Everything here that is null renders as a designed empty state rather than
 * as filler. Fill a field and its slot lights up; leave it and the interface
 * says, in its own voice, that the channel has no signal yet.
 */
export interface Profile {
  name: string
  /** One sentence of real substance. Not a paragraph, not self-praise. */
  summary: string | null
  discipline: string
  institution: string
  location: string | null
  /** Short current-state line, e.g. "open to summer 2027 internships". */
  status: string | null
  email: string | null
  /** Path to a PDF dropped in /public, or null to disable the :cv command. */
  cv: string | null
  github: string
  leetcode: string
  /** Any extra profiles. Rendered as links in the whoami pane. */
  elsewhere: Array<{ label: string; href: string }>
}

export const profile: Profile = {
  name: 'Mudit Golchha',

  // TODO — one sentence. What you actually do, stated plainly.
  summary: null,

  discipline: 'Instrumentation and Control Engineering',
  institution: 'NIT Jalandhar',

  // TODO
  location: null,

  // TODO
  status: null,

  // TODO
  email: null,

  // TODO — drop a PDF in /public and put its path here, e.g. '/mudit-golchha.pdf'
  cv: null,

  github: 'Mudit13-tech',
  leetcode: 'Mudit1306',

  elsewhere: [],
}
