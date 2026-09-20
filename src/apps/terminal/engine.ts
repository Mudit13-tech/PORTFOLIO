import { bin, experiments, failures, profile, projects, skills } from '~/data'
import { counts, stability, system } from '@/lib/derived'
import { APP_ORDER, APP_PATH, type AppRef } from '@/os/routes'

/**
 * The terminal's command layer.
 *
 * Kept free of React so it can be reasoned about and tested on its own. `ls`,
 * `cd` and `cat` traverse the same content the windows render — a terminal that
 * only pretends to have a filesystem is a costume, and visitors who use one can
 * tell within two commands.
 */

export interface Line {
  kind: 'in' | 'out' | 'err' | 'note'
  text: string
}

export interface Result {
  lines: Line[]
  /** An app to open as a side effect, echoed so the link to the desktop is visible. */
  open?: AppRef
  clear?: boolean
  theme?: 'dark' | 'light'
}

/** The virtual tree, built from the real data. */
const TREE: Record<string, string[]> = {
  '/': ['projects/', 'failures/', 'skills/', 'experiments/', 'bin/', 'about', 'contact'],
  '/projects': projects.map((p) => p.id),
  '/failures': failures.map((f) => f.id),
  '/skills': skills.map((s) => s.id),
  '/experiments': experiments.map((e) => e.id),
  '/bin': bin.map((b) => b.id),
}

const NAV = ['projects', 'failures', 'skills', 'experiments', 'about', 'contact', 'bin', 'monitor', 'terminal']

export const COMMANDS = [
  'help',
  'ls',
  'cd',
  'cat',
  'open',
  'whoami',
  'uptime',
  'stats',
  'theme',
  'clear',
  'github',
  'leetcode',
  'resume',
  'sudo',
  ...NAV,
]

const HELP = `NAVIGATION    projects, failures, skills, experiments,
              about, contact, bin, monitor
FILES         ls, cd <dir>, cat <file>, open <app>
SYSTEM        whoami, uptime, stats, theme <dark|light>, clear
LINKS         github, leetcode, resume

Tab completes. ↑ ↓ for history. Try: sudo hire-mudit`

function out(...text: string[]): Line[] {
  return text.map((t) => ({ kind: 'out' as const, text: t }))
}

/** "skils" → "skills". Cheap edit distance, good enough for one-word typos. */
function nearest(word: string): string | null {
  let best: string | null = null
  let bestScore = Infinity
  for (const c of COMMANDS) {
    const d = distance(word, c)
    if (d < bestScore) {
      bestScore = d
      best = c
    }
  }
  return bestScore <= 2 ? best : null
}

function distance(a: string, b: string): number {
  const m = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 0; j <= b.length; j++) m[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      m[i][j] = Math.min(
        m[i - 1][j] + 1,
        m[i][j - 1] + 1,
        m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
    }
  }
  return m[a.length][b.length]
}

export function completions(input: string, cwd: string): string[] {
  const parts = input.split(/\s+/)
  if (parts.length <= 1) return COMMANDS.filter((c) => c.startsWith(parts[0] ?? ''))
  const entries = TREE[cwd] ?? []
  const last = parts.at(-1) ?? ''
  return entries.filter((e) => e.startsWith(last)).map((e) => e.replace(/\/$/, ''))
}

export function run(input: string, cwd: string): Result & { cwd: string } {
  const trimmed = input.trim()
  if (!trimmed) return { lines: [], cwd }

  const [cmd, ...args] = trimmed.split(/\s+/)
  const arg = args[0]

  switch (cmd) {
    case 'help':
      return { lines: out(...HELP.split('\n')), cwd }

    case 'clear':
      return { lines: [], clear: true, cwd }

    case 'ls': {
      const dir = arg ? resolve(cwd, arg) : cwd
      const entries = TREE[dir]
      if (!entries) return { lines: [{ kind: 'err', text: `ls: ${dir}: no such directory` }], cwd }
      return { lines: out(entries.join('  ')), cwd }
    }

    case 'cd': {
      if (!arg || arg === '/') return { lines: [], cwd: '/' }
      if (arg === '..') return { lines: [], cwd: '/' }
      const next = resolve(cwd, arg)
      if (!TREE[next]) return { lines: [{ kind: 'err', text: `cd: ${arg}: no such directory` }], cwd }
      return { lines: [], cwd: next }
    }

    case 'cat': {
      if (!arg) return { lines: [{ kind: 'err', text: 'cat: missing operand' }], cwd }
      const text = read(cwd, arg)
      return text
        ? { lines: out(...text), cwd }
        : { lines: [{ kind: 'err', text: `cat: ${arg}: no such file` }], cwd }
    }

    case 'whoami':
      return {
        lines: out(
          profile.name,
          `${profile.discipline}, ${profile.institution}`,
          profile.role,
        ),
        cwd,
      }

    case 'uptime':
      return { lines: out(`up ${system.uptime} · build ${system.build}`), cwd }

    case 'stats':
      return {
        lines: out(
          `projects      ${counts.projects}`,
          `failures      ${counts.failures}  (${counts.resolved} resolved)`,
          `experiments   ${counts.experiments}`,
          `modules       ${counts.skills}`,
          `stability     ${stability.display}   ${stability.formula}`,
        ),
        cwd,
      }

    case 'theme': {
      const t = arg === 'light' || arg === 'dark' ? arg : null
      if (!t) return { lines: [{ kind: 'err', text: 'theme: expected `dark` or `light`' }], cwd }
      return { lines: out(`theme → ${t}`), theme: t, cwd }
    }

    case 'github':
      return { lines: out(`opening ${profile.links.github}`), cwd }

    case 'leetcode':
      return { lines: out(`opening ${profile.links.leetcode}`), cwd }

    case 'resume':
      return profile.links.resume
        ? { lines: out(`opening ${profile.links.resume}`), cwd }
        : {
            lines: [{ kind: 'note', text: 'resume: no PDF published yet — see the About window' }],
            cwd,
          }

    case 'open': {
      const target = APP_ORDER.find((a) => a === arg)
      if (!target) return { lines: [{ kind: 'err', text: `open: unknown app '${arg ?? ''}'` }], cwd }
      return { lines: out(`→ ${APP_PATH[target]}`), open: { id: target, payload: null }, cwd }
    }

    case 'sudo': {
      if (args.join(' ') === 'hire-mudit') {
        return {
          lines: out(
            'Checking credentials............ OK',
            'Verifying budget................ assuming yes',
            'Opening communication channel...',
            '',
            '→ CONTACT',
          ),
          open: { id: 'contact', payload: null },
          cwd,
        }
      }
      return { lines: [{ kind: 'err', text: `sudo: ${args.join(' ') || 'usage: sudo <command>'}` }], cwd }
    }

    default: {
      const nav = APP_ORDER.find((a) => a === cmd)
      if (nav) return { lines: out(`→ ${APP_PATH[nav]}`), open: { id: nav, payload: null }, cwd }

      const guess = nearest(cmd)
      return {
        lines: [
          {
            kind: 'err',
            text: `zsh: command not found: ${cmd}${guess ? ` — did you mean '${guess}'?` : ''}`,
          },
        ],
        cwd,
      }
    }
  }
}

function resolve(cwd: string, arg: string): string {
  if (arg.startsWith('/')) return arg.replace(/\/$/, '') || '/'
  const clean = arg.replace(/\/$/, '')
  return cwd === '/' ? `/${clean}` : `${cwd}/${clean}`
}

/** `cat failures/ota-dev-bundle` prints the crash report as text. */
function read(cwd: string, arg: string): string[] | null {
  const path = resolve(cwd, arg)
  const [, dir, id] = path.split('/')

  if (dir === 'projects') {
    const p = projects.find((x) => x.id === id)
    if (!p) return null
    return [p.name, p.type, '', p.problem, '', p.architecture, '', `stack: ${p.stack.join(', ')}`]
  }
  if (dir === 'failures') {
    const f = failures.find((x) => x.id === id)
    if (!f) return null
    return [
      `CRASH REPORT · ${f.title}`,
      `${f.date} · ${f.status} · ${f.severity} severity`,
      '',
      'WHAT HAPPENED',
      f.whatHappened,
      '',
      'CAUSE',
      f.cause,
      '',
      'HOW I FOUND IT',
      ...f.investigation.map((s) => `→ ${s}`),
      '',
      'FIX',
      f.fix,
      '',
      'WHAT I LEARNED',
      f.lesson,
      ...(f.commit ? ['', `commit ${f.commit.sha} — "${f.commit.message}"`] : []),
    ]
  }
  if (dir === 'skills') {
    const s = skills.find((x) => x.id === id)
    if (!s) return null
    return [s.name, `${s.category} · frequency ${s.frequency}/4 · since ${s.firstUsed}`, `used in: ${s.projectIds.join(', ') || 'nothing yet'}`]
  }
  if (dir === 'experiments') {
    const e = experiments.find((x) => x.id === id)
    if (!e) return null
    return [e.name, '', `TESTED   ${e.tested}`, `WHY      ${e.why}`, `RESULT   ${e.result}`, `LEARNED  ${e.learned}`]
  }
  if (dir === 'bin') {
    const b = bin.find((x) => x.id === id)
    if (!b) return null
    return [b.name, b.meta, '', b.story]
  }
  if (path === '/about') {
    return [profile.name, profile.role, '', profile.process]
  }
  return null
}
