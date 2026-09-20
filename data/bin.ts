import type { BinItem } from './types'

/**
 * The recycle bin. Genuinely abandoned work, told briefly and without apology.
 *
 * Everything here is a real repository or a real file, with its measured size.
 * Emptying is disabled — the point of the bin is that it stays readable.
 */
export const bin: BinItem[] = [
  {
    id: 'apogee',
    name: 'apogee/',
    kind: 'folder',
    meta: '0 KB · created 2026-08-10',
    story:
      'A repository with a good name and nothing in it. Created on the same day as two others, which is the actual story. The name is still available for something that deserves it.',
  },
  {
    id: 'cosmic-ai-planner',
    name: 'COSMIC-AI-PLANNER/',
    kind: 'folder',
    meta: '0 KB · created 2026-07-31',
    story:
      'The first attempt at the planner, abandoned empty. Five days later the same idea started again as COSMOS LABS, with a solar system attached, and that one shipped.',
  },
  {
    id: 'backend-project',
    name: 'BACKEND-PROJECT/',
    kind: 'folder',
    meta: '7 KB · one day, 2026-09-04',
    story:
      'A backend with no front of its own, started and left the same day. Whatever it was going to be became part of something else.',
  },
  {
    id: 'leethub',
    name: 'LeetHub-2.0/',
    kind: 'folder',
    meta: 'fork · 21 MB',
    story:
      'A fork of the extension that syncs LeetCode solutions to GitHub. Not written here — kept because it is the thing writing half the commits in Leetcode-Questions, and pretending those commits are hand-authored would be a lie of omission.',
  },
  {
    id: 'old-workspace',
    name: 'old-portfolio/',
    kind: 'folder',
    meta: '1 previous version',
    story:
      'The version of this site before this one: a keyboard-driven terminal workspace with a contribution heatmap. It worked, and the content files were still empty when it was replaced. Kept because a portfolio that claims to show growth should be able to show its own.',
  },
]
