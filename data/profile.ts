import type { ContactChannel, Profile } from './types'

/**
 * The user profile.
 *
 * Fields that are null render as a designed empty state — a visible "not
 * supplied yet" — rather than as a placeholder pretending to be real. A dead
 * mailto: is worse than an honest gap, and a recruiter can tell the difference.
 */
export const profile: Profile = {
  name: 'Mudit Golchha',
  role: 'Developer · Engineer · Builder',
  discipline: 'Instrumentation and Control Engineering',
  institution: 'NIT Jalandhar',
  location: null,
  status: null,

  currently: {
    // Reviewed quarterly. A stale "currently" is the clearest sign of an
    // abandoned portfolio, so the date is rendered next to the list.
    items: [
      'Shipping XCEED to Android and iOS',
      'Building ACTA, a policy layer for agents that spend money',
      '166 LeetCode problems solved, still going',
    ],
    asOf: '2026-09-20',
  },

  interests: [
    'Software architecture',
    'Control systems',
    'Interfaces that behave like tools',
  ],

  process:
    'Build it badly. Find out why it is bad. Build it again. Most of what I know came out of the second and third attempts, which is why the failures in this system are filed where you can read them instead of hidden.',

  links: {
    github: 'https://github.com/Mudit13-tech',
    leetcode: 'https://leetcode.com/u/Mudit1306/',
    // TODO — drop a PDF in /public and set this to '/mudit-golchha.pdf'.
    resume: null,
    // TODO — the address you want a recruiter to actually use.
    email: null,
    linkedin: null,
  },
}

export const channels: ContactChannel[] = [
  {
    id: 'email',
    label: 'Email',
    value: profile.links.email,
    href: profile.links.email ? `mailto:${profile.links.email}` : null,
    pending: 'not published yet',
  },
  {
    id: 'github',
    label: 'GitHub',
    value: '@Mudit13-tech',
    href: profile.links.github,
    pending: '',
  },
  {
    id: 'leetcode',
    label: 'LeetCode',
    value: '@Mudit1306',
    href: profile.links.leetcode,
    pending: '',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    value: profile.links.linkedin,
    href: profile.links.linkedin,
    pending: 'not published yet',
  },
]
