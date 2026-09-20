import type { Project } from './types'

/**
 * Six real repositories, read from github.com/Mudit13-tech on 2026-09-20.
 *
 * Every figure in `evidence` was measured from the GitHub API or the repository
 * tree on that date, and each one carries the method that produced it. Prose in
 * `problem` / `architecture` is drawn from each repository's own README; where a
 * README did not say, the field says so rather than inventing a motive.
 *
 * `contribution` and `retrospective` are the two fields only Mudit can write.
 * They are marked TODO where they are still his to write — an empty slot is
 * honest, a generated paragraph in his voice is not.
 */
export const projects: Project[] = [
  {
    id: 'xceed',
    name: 'XCEED',
    type: 'Android + iOS application',
    status: 'shipped',
    year: 2026,
    role: 'solo',
    stack: ['react', 'vite', 'capacitor', 'swift', 'java', 'tailwind', 'vitest'],
    problem:
      'An academic platform for NIT Jalandhar, delivered as a native app rather than a web page students have to remember to open. The README frames the hard part as distribution rather than features: getting fixes onto phones that are already installed, without a store review sitting between the fix and the student.',
    architecture:
      'A React + Vite client wrapped by Capacitor into Android and iOS builds, so one codebase produces both. The interesting layer is over-the-air updates: a version bump publishes a new JavaScript bundle that installed apps pull on launch, so a fix ships in minutes instead of waiting on review. A GitHub Actions workflow syncs content from an upstream AMS server and resolves additive conflicts automatically instead of failing the run. Biometric auth is split per platform, because Face ID and Android biometrics did not want the same code.',
    contribution:
      'TODO — you wrote all 305 commits of this solo. Name the specific pieces: the OTA bundle mechanism, the AMS sync conflict resolution, the per-platform biometric split, the iOS safe-area work. Two or three sentences, first person.',
    retrospective:
      'TODO — two sentences. The iOS port took a run of commits fighting the WebView over safe areas, downloads and the share sheet. Worth saying what you would set up differently before starting a second platform.',
    failureIds: ['ota-dev-bundle', 'share-sheet-cancel', 'ios-safe-area', 'ams-sync-conflict', 'faceid-split'],
    links: { source: 'https://github.com/Mudit13-tech/Xceed-Ios', live: null },
    evidence: [
      { label: 'commits', value: '305', source: 'GitHub API commit count, 2026-09-20' },
      { label: 'repository size', value: '25.9 MB', source: 'GitHub API repo size field' },
      { label: 'first commit', value: '2026-09-13', source: 'repository created_at' },
      { label: 'platforms', value: 'android, ios', source: 'android/ and ios/ directories in the repo tree' },
      { label: 'javascript', value: '17.4 MB', source: 'GitHub languages API' },
    ],
    featured: true,
  },
  {
    id: 'acta',
    name: 'ACTA',
    type: 'Django service + TypeScript client',
    status: 'wip',
    year: 2026,
    role: 'solo',
    stack: ['typescript', 'react', 'python', 'django', 'rest'],
    problem:
      'A trust and transaction layer for AI agents. Its README states the problem precisely: you give an agent a goal and a set of boundaries, and it searches, compares, decides, waits for the right price and pays — but only inside the limits you wrote. The unsolved part it targets is not the shopping, it is the guardrail around an agent that can spend money.',
    architecture:
      'The backend owns the loop and the frontend is described in the README as "its phone client". `backend/agent/engine.py` runs one stage per call through Understand, Search, Compare, Decide, Monitor, Prepare, Request approval, Execute, Verify. `backend/agent/models.py` holds offers, policies, runs and activity; `backend/agent/views.py` is the API. The client polls `POST /api/runs/<id>/advance/` while a task is live, so the loop on screen is the server\'s rather than a local imitation. Every payment passes `check_policy` first, with an auto-approve limit below which it pays without asking. There is no sign-in yet: each browser generates a device key sent as `X-ACTA-Device`, and JWT endpoints are wired but unused, with the user foreign keys already in place and nullable.',
    contribution:
      'TODO — first person, specific. The policy engine and `check_policy`, the staged engine loop, the device-key scoping, the client polling design.',
    retrospective:
      'TODO — two sentences. The README already admits auth is deferred and scoped by device key; that is a real trade worth explaining.',
    failureIds: [],
    links: { source: 'https://github.com/Mudit13-tech/ACTA', live: null },
    evidence: [
      { label: 'typescript', value: '95.0 KB', source: 'GitHub languages API' },
      { label: 'python', value: '73.0 KB', source: 'GitHub languages API' },
      { label: 'created', value: '2026-09-12', source: 'repository created_at' },
      { label: 'auth', value: 'device key, JWT wired not enabled', source: "the repository's own README" },
    ],
    featured: true,
  },
  {
    id: 'cosmos-labs',
    name: 'COSMOS LABS',
    type: 'Django + Three.js web application',
    status: 'shipped',
    year: 2026,
    role: 'solo',
    stack: ['javascript', 'three.js', 'python', 'django', 'groq', 'sqlite'],
    problem:
      'An AI learning planner that turns a goal and a timeline into a day-by-day roadmap, then draws that roadmap as a solar system where each planet is a phase of the plan. The bet is that a plan you can fly around is one you come back to.',
    architecture:
      'A goal and duration go to a Django API, which asks the Groq API for a structured JSON roadmap and stores it as Plan to Phase to Day to Task. Three.js renders the result as orbits, camera transitions, stars and asteroid fields. Completing a task makes the backend re-check whether its day and then its phase are complete, and finishing a phase unlocks the next one. Auth, sessions and persistence are Django\'s; the database is SQLite in development.',
    contribution:
      'TODO — first person. The roadmap prompt and its JSON contract, the phase-unlocking logic, the Three.js scene and camera work, the deploy.',
    retrospective:
      'TODO — two sentences. This is the one project with a live URL, so what deploying it taught is worth a line.',
    failureIds: [],
    links: {
      source: 'https://github.com/Mudit13-tech/COSMOS-LABS-',
      live: 'https://cosmos-labs.onrender.com/',
    },
    evidence: [
      { label: 'javascript', value: '267.1 KB', source: 'GitHub languages API' },
      { label: 'python', value: '38.5 KB', source: 'GitHub languages API' },
      { label: 'repository size', value: '8.8 MB', source: 'GitHub API repo size field' },
      { label: 'deployed', value: 'render.com', source: 'repository homepage field' },
    ],
    featured: true,
  },
  {
    id: 'dsa',
    name: 'DSA practice',
    type: 'two C++ repositories',
    status: 'wip',
    year: 2026,
    role: 'solo',
    stack: ['c++', 'stl'],
    problem:
      'Data structures and algorithms worked through in C++ rather than read about — one repository synced from LeetCode by a browser extension, the other following the Striver A2Z sheet by topic.',
    architecture:
      'Leetcode-Questions is written by LeetHub, which commits each accepted solution into its own directory with the runtime and memory percentile in the commit message, and maintains a topic index in the README. DSA-STRIVER is organised by hand into folders per topic: arrays, hashing, linked lists, doubly linked lists, recursion, sorting, stack, STL and basic maths.',
    contribution:
      'TODO — one honest line. What this practice is actually for, and which topics you found hardest.',
    retrospective: null,
    failureIds: [],
    links: { source: 'https://github.com/Mudit13-tech/Leetcode-Questions', live: null },
    evidence: [
      { label: 'problems solved', value: '166', source: 'LeetCode profile, lifetime accepted, sampled 2026-09-16' },
      { label: 'by difficulty', value: '90 easy · 68 medium · 8 hard', source: 'LeetCode profile' },
      { label: 'synced to git', value: '67 problem directories', source: 'Leetcode-Questions repository tree' },
      { label: 'c++ written', value: '70.9 KB', source: 'GitHub languages API, both repositories summed' },
      { label: 'topics covered', value: '11 folders', source: 'DSA-STRIVER repository tree' },
    ],
    featured: false,
  },
  {
    id: 'mock-test',
    name: 'JEE mock test',
    type: 'single-file web page',
    status: 'archived',
    year: 2026,
    role: 'solo',
    stack: ['html', 'css', 'javascript'],
    problem:
      'A clone of the JEE mock test interface, built to reproduce the part that actually affects a candidate: the proctoring. It enters full screen when the test begins, warns once if you leave it, and submits the test automatically the second time.',
    architecture:
      'One file, `jeeexam2.html`, containing the markup, styling and behaviour. The Fullscreen API drives the lock, and a counter on the exit event decides between a warning and a forced submit.',
    contribution: 'TODO — one line. What you were testing by building this.',
    retrospective:
      'TODO — one sentence. A whole application in one 29 KB HTML file is a real decision worth owning either way.',
    failureIds: [],
    links: { source: 'https://github.com/Mudit13-tech/Mock_Test01', live: null },
    evidence: [
      { label: 'size', value: '29.1 KB of HTML', source: 'GitHub languages API' },
      { label: 'files', value: '1', source: 'repository tree: jeeexam2.html' },
      { label: 'built', value: '2026-03-17', source: 'repository created_at and pushed_at, the same day' },
    ],
    featured: false,
  },
  {
    id: 'portfolio',
    name: 'MUDIT OS',
    type: 'this system',
    status: 'wip',
    year: 2026,
    role: 'solo',
    stack: ['typescript', 'react', 'next.js', 'tailwind'],
    problem:
      'A portfolio that behaves like a workstation instead of a page. Projects are applications, skills are installed modules, abandoned work sits in the bin, and the things that broke are filed as crash reports rather than hidden.',
    architecture:
      'Next.js App Router. Every app is server-rendered at its own URL, so the whole system is readable with JavaScript disabled and crawlable by search engines; the window manager is a client layer that opens those same components in windows and rewrites the URL as it goes. Drag and resize are raw pointer events with no animation library, because the spec asks for exactly 1:1 dragging and a spring would break it. Every count on screen is derived from the length of a data array.',
    contribution:
      'TODO — you are inside it. Say what you built, and be specific about the window manager.',
    retrospective: null,
    failureIds: [],
    links: { source: 'https://github.com/Mudit13-tech/PORTFOLIO', live: null },
    evidence: [
      { label: 'you are here', value: 'this window', source: 'the page you are reading' },
    ],
    featured: false,
  },
]
