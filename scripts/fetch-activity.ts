/**
 * Data acquisition. Runs at build time and from the daily workflow; never in
 * the browser.
 *
 * Two channels are sampled into one committed snapshot. The site renders from
 * that snapshot alone, so a third-party outage can never produce an empty grid
 * — the worst case is a stale window with the channel marked degraded.
 *
 * Resolution order per channel:  live fetch -> last good snapshot -> fallback.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { WEEKS, DAYS } from '../src/lib/lattice'
import type { Channel, Day, Difficulty, LogEvent, Snapshot } from '../src/lib/types'

const ROOT = process.cwd()
const OUT = path.join(ROOT, 'data', 'activity.json')
const FALLBACK = path.join(ROOT, 'data', 'activity.fallback.json')

const GH_USER = process.env.GITHUB_USERNAME?.trim() || 'Mudit13-tech'
const GH_TOKEN = process.env.GITHUB_TOKEN?.trim() || ''
const LC_USER = process.env.LEETCODE_USERNAME?.trim() || 'Mudit1306'

const CELLS = WEEKS * DAYS
const DAY_MS = 86_400_000
const UA = 'ics-workspace/1.0 (+build-time snapshot)'

const iso = (d: Date) => d.toISOString().slice(0, 10)
const at = (s: string) => new Date(`${s}T00:00:00Z`)
const plus = (s: string, n: number) => iso(new Date(at(s).getTime() + n * DAY_MS))

function log(ch: string, msg: string) {
  process.stdout.write(`[daq] ${ch.padEnd(9)} ${msg}\n`)
}

/** Sunday-aligned 53x7 window ending on the Saturday of the current week. */
function window() {
  const today = new Date()
  const end = iso(new Date(today.getTime() + (6 - today.getUTCDay()) * DAY_MS))
  const start = plus(end, -(CELLS - 1))
  return { start, end }
}

async function withTimeout<T>(p: (signal: AbortSignal) => Promise<T>, ms = 15_000): Promise<T> {
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), ms)
  try {
    return await p(ac.signal)
  } finally {
    clearTimeout(timer)
  }
}

/* ------------------------------------------------------------------ channel 0
 * GitHub. contributionsCollection is capped at one year per request, and the
 * window is 371 days, so it is sampled in two abutting spans and merged.
 */

type Counts = Map<string, number>

async function ghGraphql(start: string, end: string): Promise<{ counts: Counts; total: number }> {
  const query = `query($login:String!,$from:DateTime!,$to:DateTime!){
    user(login:$login){ contributionsCollection(from:$from,to:$to){
      contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount } } } } } }`

  const counts: Counts = new Map()
  let total = 0
  const spans: Array<[string, string]> = []
  let cursor = start
  while (at(cursor) <= at(end)) {
    const stop = plus(cursor, 364)
    spans.push([cursor, at(stop) > at(end) ? end : stop])
    cursor = plus(stop, 1)
  }

  for (const [from, to] of spans) {
    const res = await withTimeout((signal) =>
      fetch('https://api.github.com/graphql', {
        method: 'POST',
        signal,
        headers: {
          authorization: `bearer ${GH_TOKEN}`,
          'content-type': 'application/json',
          'user-agent': UA,
        },
        body: JSON.stringify({
          query,
          variables: { login: GH_USER, from: `${from}T00:00:00Z`, to: `${to}T23:59:59Z` },
        }),
      }),
    )
    if (!res.ok) throw new Error(`graphql ${res.status}`)
    const json = (await res.json()) as any
    if (json.errors?.length) throw new Error(json.errors[0]?.message ?? 'graphql error')
    const cal = json?.data?.user?.contributionsCollection?.contributionCalendar
    if (!cal) throw new Error('no calendar in response')
    total += cal.totalContributions ?? 0
    for (const w of cal.weeks ?? [])
      for (const d of w.contributionDays ?? [])
        counts.set(d.date, (counts.get(d.date) ?? 0) + (d.contributionCount ?? 0))
  }
  return { counts, total }
}

/**
 * Token-free path. The public contributions document is the same calendar the
 * profile page renders. Exact counts live in the tool-tip elements; if that
 * markup shifts, counts are estimated from data-level and the channel says so
 * rather than quietly reporting numbers it cannot stand behind.
 */
async function ghPublic(start: string, end: string): Promise<{ counts: Counts; exact: boolean }> {
  const url = `https://github.com/users/${encodeURIComponent(GH_USER)}/contributions?from=${start}&to=${end}`
  const res = await withTimeout((signal) =>
    fetch(url, { signal, headers: { 'user-agent': UA, accept: 'text/html' } }),
  )
  if (!res.ok) throw new Error(`contributions ${res.status}`)
  const html = await res.text()

  const tips = new Map<string, number>()
  for (const m of html.matchAll(/<tool-tip[^>]*\bfor="([^"]+)"[^>]*>([^<]*)</g)) {
    const n = /^\s*(No|\d+)\s+contribution/i.exec(m[2])
    if (n) tips.set(m[1], n[1].toLowerCase() === 'no' ? 0 : Number(n[1]))
  }

  const counts: Counts = new Map()
  let exact = tips.size > 0
  const LEVEL_EST = [0, 1, 3, 6, 10]
  for (const m of html.matchAll(/<td[^>]*\bdata-date="(\d{4}-\d{2}-\d{2})"[^>]*>/g)) {
    const tag = m[0]
    const id = /\bid="([^"]+)"/.exec(tag)?.[1]
    const lvl = Number(/\bdata-level="(\d)"/.exec(tag)?.[1] ?? '0')
    const tipped = id ? tips.get(id) : undefined
    counts.set(m[1], tipped ?? LEVEL_EST[Math.min(4, Math.max(0, lvl))])
    if (tipped === undefined) exact = false
  }
  if (counts.size === 0) throw new Error('no day cells in contributions document')
  return { counts, exact }
}

async function ghApi<T>(path: string): Promise<T> {
  const res = await withTimeout((signal) =>
    fetch(`https://api.github.com${path}`, {
      signal,
      headers: {
        accept: 'application/vnd.github+json',
        'user-agent': UA,
        ...(GH_TOKEN ? { authorization: `bearer ${GH_TOKEN}` } : {}),
      },
    }),
  )
  if (!res.ok) throw new Error(`${path.split('?')[0]} ${res.status}`)
  return (await res.json()) as T
}

const firstLine = (s: unknown) => String(s ?? '').split('\n')[0].trim()

/**
 * The public events feed, which is the only place non-push activity shows up.
 *
 * Unauthenticated, GitHub now trims PushEvent payloads down to push_id, ref
 * and head — the commits array and their messages are gone — so this returns
 * what the feed can still stand behind, plus the set of repositories that were
 * pushed to, which ghRepoCommits then reads the actual messages from.
 */
async function ghEvents(): Promise<{ events: LogEvent[]; pushed: string[] }> {
  const raw = await ghApi<any[]>(`/users/${encodeURIComponent(GH_USER)}/events/public?per_page=100`)
  const events: LogEvent[] = []
  const pushed: string[] = []

  for (const e of raw) {
    const repo: string = e.repo?.name ?? ''
    const short = repo.split('/').pop() ?? repo

    if (e.type === 'PushEvent') {
      if (repo && !pushed.includes(repo)) pushed.push(repo)
      for (const c of e.payload?.commits ?? []) {
        const msg = firstLine(c.message)
        if (!msg) continue
        events.push({ t: e.created_at, kind: 'commit', channel: 'github', text: msg, meta: short, href: `https://github.com/${repo}/commit/${c.sha}` })
      }
    } else if (e.type === 'CreateEvent' && e.payload?.ref_type === 'repository') {
      events.push({ t: e.created_at, kind: 'repo', channel: 'github', text: `created ${short}`, meta: short, href: `https://github.com/${repo}` })
    } else if (e.type === 'PullRequestEvent' && e.payload?.action === 'opened') {
      const title = firstLine(e.payload?.pull_request?.title)
      if (title) events.push({ t: e.created_at, kind: 'commit', channel: 'github', text: `opened pr: ${title}`, meta: short, href: e.payload?.pull_request?.html_url ?? null })
    } else if (e.type === 'ReleaseEvent' && e.payload?.action === 'published') {
      const tag = firstLine(e.payload?.release?.tag_name)
      if (tag) events.push({ t: e.created_at, kind: 'repo', channel: 'github', text: `released ${tag}`, meta: short, href: e.payload?.release?.html_url ?? null })
    }
  }
  return { events, pushed }
}

/**
 * Real commit messages, read from the repositories the feed says were pushed
 * to. The commits endpoint still returns full messages without a token, and
 * filtering by author server-side keeps other people's commits out of a log
 * that is supposed to be one person's.
 */
async function ghRepoCommits(repos: string[], perRepo = 5): Promise<LogEvent[]> {
  const out: LogEvent[] = []
  for (const repo of repos) {
    try {
      const commits = await ghApi<any[]>(
        `/repos/${repo}/commits?author=${encodeURIComponent(GH_USER)}&per_page=${perRepo}`,
      )
      const short = repo.split('/').pop() ?? repo
      for (const c of commits) {
        const msg = firstLine(c.commit?.message)
        const when = c.commit?.author?.date ?? c.commit?.committer?.date
        if (!msg || !when) continue
        out.push({ t: when, kind: 'commit', channel: 'github', text: msg, meta: short, href: c.html_url ?? null })
      }
    } catch {
      /* one unreadable repository does not cost us the rest of the log */
    }
  }
  return out
}

/* ------------------------------------------------------------------ channel 1
 * LeetCode. Unofficial GraphQL, queried from Node at build time — CORS is a
 * browser policy and never applies here, so no proxy is involved. The shape is
 * validated on arrival because this endpoint can change without notice.
 */

async function lc<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await withTimeout((signal) =>
    fetch('https://leetcode.com/graphql', {
      method: 'POST',
      signal,
      headers: {
        'content-type': 'application/json',
        referer: `https://leetcode.com/u/${LC_USER}/`,
        origin: 'https://leetcode.com',
        'user-agent': UA,
      },
      body: JSON.stringify({ query, variables }),
    }),
  )
  if (!res.ok) throw new Error(`leetcode ${res.status}`)
  const json = (await res.json()) as any
  if (json.errors?.length) throw new Error(json.errors[0]?.message ?? 'leetcode error')
  return json.data as T
}

async function lcCalendar(start: string, end: string): Promise<Counts> {
  const years = new Set([at(start).getUTCFullYear(), at(end).getUTCFullYear()])
  const counts: Counts = new Map()
  for (const year of years) {
    const data = await lc<any>(
      `query userProfileCalendar($username:String!,$year:Int){ matchedUser(username:$username){
        userCalendar(year:$year){ totalActiveDays streak submissionCalendar } } }`,
      { username: LC_USER, year },
    )
    const raw = data?.matchedUser?.userCalendar?.submissionCalendar
    if (!raw) continue
    const parsed = JSON.parse(raw) as Record<string, number>
    for (const [ts, n] of Object.entries(parsed)) {
      const date = iso(new Date(Number(ts) * 1000))
      counts.set(date, (counts.get(date) ?? 0) + Number(n))
    }
  }
  if (counts.size === 0) throw new Error('empty submission calendar')
  return counts
}

async function lcDifficulty(): Promise<{ easy: number; medium: number; hard: number } | null> {
  try {
    const data = await lc<any>(
      `query userProblemsSolved($username:String!){ matchedUser(username:$username){
        submitStatsGlobal{ acSubmissionNum{ difficulty count } } } }`,
      { username: LC_USER },
    )
    const rows = data?.matchedUser?.submitStatsGlobal?.acSubmissionNum ?? []
    const pick = (d: string) => rows.find((r: any) => r.difficulty === d)?.count ?? 0
    const out = { easy: pick('Easy'), medium: pick('Medium'), hard: pick('Hard') }
    return out.easy + out.medium + out.hard > 0 ? out : null
  } catch {
    return null
  }
}

/**
 * Per-day hardest difficulty exists only for the recent-accepted window, which
 * is roughly the last twenty solves. Days outside it carry null and the readout
 * omits the field entirely.
 */
async function lcRecent(): Promise<{ events: LogEvent[]; hardest: Map<string, Difficulty> }> {
  const events: LogEvent[] = []
  const hardest = new Map<string, Difficulty>()
  const rank: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 }

  const data = await lc<any>(
    `query recentAc($username:String!,$limit:Int!){ recentAcSubmissionList(username:$username,limit:$limit){
      title titleSlug timestamp } }`,
    { username: LC_USER, limit: 20 },
  )
  const list: any[] = data?.recentAcSubmissionList ?? []

  for (const s of list) {
    const date = iso(new Date(Number(s.timestamp) * 1000))
    let difficulty: Difficulty | null = null
    try {
      const q = await lc<any>(
        `query q($titleSlug:String!){ question(titleSlug:$titleSlug){ difficulty } }`,
        { titleSlug: s.titleSlug },
      )
      const d = String(q?.question?.difficulty ?? '').toLowerCase()
      if (d === 'easy' || d === 'medium' || d === 'hard') difficulty = d
    } catch {
      /* difficulty stays unknown rather than guessed */
    }
    if (difficulty && (!hardest.has(date) || rank[difficulty] > rank[hardest.get(date)!])) {
      hardest.set(date, difficulty)
    }
    events.push({
      t: new Date(Number(s.timestamp) * 1000).toISOString(),
      kind: 'solved',
      channel: 'leetcode',
      text: String(s.title ?? s.titleSlug),
      meta: difficulty,
      href: `https://leetcode.com/problems/${s.titleSlug}/`,
    })
    await new Promise((r) => setTimeout(r, 120))
  }
  return { events, hardest }
}

async function lcContests(): Promise<LogEvent[]> {
  try {
    const data = await lc<any>(
      `query contests($username:String!){ userContestRankingHistory(username:$username){
        attended ranking problemsSolved totalProblems rating contest{ title startTime } } }`,
      { username: LC_USER },
    )
    const rows: any[] = (data?.userContestRankingHistory ?? []).filter((r: any) => r.attended)
    return rows.slice(-8).map((r) => ({
      t: new Date(Number(r.contest?.startTime ?? 0) * 1000).toISOString(),
      kind: 'contest' as const,
      channel: 'leetcode' as const,
      text: String(r.contest?.title ?? 'contest'),
      meta: `rank ${r.ranking} · ${r.problemsSolved}/${r.totalProblems}`,
      href: null,
    }))
  } catch {
    return []
  }
}

/* -------------------------------------------------------------------- assemble */

function emptyDays(start: string): Day[] {
  return Array.from({ length: CELLS }, (_, i) => ({
    date: plus(start, i),
    commits: 0,
    solved: 0,
    hardest: null,
  }))
}

async function readJson(file: string): Promise<Snapshot | null> {
  if (!existsSync(file)) return null
  try {
    const s = JSON.parse(await readFile(file, 'utf8')) as Snapshot
    return Array.isArray(s?.days) && s.days.length === CELLS ? s : null
  } catch {
    return null
  }
}

async function main() {
  const { start, end } = window()
  log('window', `${start} .. ${end}  (${WEEKS}w x ${DAYS}d = ${CELLS} cells)`)

  const previous = (await readJson(OUT)) ?? (await readJson(FALLBACK))
  const prevByDate = new Map((previous?.days ?? []).map((d) => [d.date, d]))
  const days = emptyDays(start)
  const byDate = new Map(days.map((d) => [d.date, d]))
  const events: LogEvent[] = []

  /* channel 0 */
  const gh: Channel = { id: 'github', label: 'github', user: GH_USER, state: 'offline', total: 0, activeDays: 0, note: 'no sample taken' }
  try {
    let counts: Counts
    let exact = true
    if (GH_TOKEN) {
      const r = await ghGraphql(start, end)
      counts = r.counts
      log('ch0', `graphql ok · ${r.total} contributions`)
    } else {
      const r = await ghPublic(start, end)
      counts = r.counts
      exact = r.exact
      log('ch0', `public document ok · ${counts.size} days${exact ? '' : ' · counts estimated from levels'}`)
    }
    for (const [date, n] of counts) {
      const cell = byDate.get(date)
      if (cell) cell.commits = n
    }
    gh.total = days.reduce((a, d) => a + d.commits, 0)
    gh.activeDays = days.filter((d) => d.commits > 0).length
    gh.state = exact ? 'ok' : 'degraded'
    gh.note = exact ? null : 'counts estimated from intensity levels — set GITHUB_TOKEN for exact figures'
  } catch (err) {
    log('ch0', `signal lost · ${(err as Error).message}`)
    for (const d of days) d.commits = prevByDate.get(d.date)?.commits ?? 0
    gh.total = days.reduce((a, d) => a + d.commits, 0)
    gh.activeDays = days.filter((d) => d.commits > 0).length
    gh.state = gh.total > 0 ? 'degraded' : 'offline'
    gh.note = gh.total > 0 ? `signal lost — holding last good sample (${previous?.generatedAt?.slice(0, 10) ?? 'unknown'})` : 'signal lost — no prior sample held'
  }

  try {
    const feed = await ghEvents()
    events.push(...feed.events)
    const fromFeed = feed.events.filter((e) => e.kind === 'commit').length
    log('ch0', `feed ok · ${feed.events.length} entries · ${feed.pushed.length} repos pushed`)

    // Without a token the feed carries no commit messages, so they are read
    // from the repositories it named instead.
    if (fromFeed === 0 && feed.pushed.length > 0) {
      const commits = await ghRepoCommits(feed.pushed.slice(0, 6))
      events.push(...commits)
      log('ch0', `commits ok · ${commits.length} messages from ${Math.min(6, feed.pushed.length)} repos`)
    }
  } catch (err) {
    log('ch0', `feed unavailable · ${(err as Error).message}`)
  }

  /* channel 1 */
  const lcCh: Channel = { id: 'leetcode', label: 'leetcode', user: LC_USER, state: 'offline', total: 0, activeDays: 0, note: 'no sample taken' }
  let difficulty: Snapshot['difficulty'] = null
  try {
    const counts = await lcCalendar(start, end)
    for (const [date, n] of counts) {
      const cell = byDate.get(date)
      if (cell) cell.solved = n
    }
    lcCh.total = days.reduce((a, d) => a + d.solved, 0)
    lcCh.activeDays = days.filter((d) => d.solved > 0).length
    lcCh.state = 'ok'
    lcCh.note = null
    log('ch1', `calendar ok · ${lcCh.total} accepted over ${lcCh.activeDays} days`)

    difficulty = await lcDifficulty()
    const recent = await lcRecent()
    for (const [date, d] of recent.hardest) {
      const cell = byDate.get(date)
      if (cell) cell.hardest = d
    }
    events.push(...recent.events, ...(await lcContests()))
    log('ch1', `recent ok · ${recent.events.length} solves, ${recent.hardest.size} days with difficulty`)
  } catch (err) {
    log('ch1', `signal lost · ${(err as Error).message}`)
    for (const d of days) {
      const p = prevByDate.get(d.date)
      d.solved = p?.solved ?? 0
      d.hardest = p?.hardest ?? null
    }
    difficulty = previous?.difficulty ?? null
    lcCh.total = days.reduce((a, d) => a + d.solved, 0)
    lcCh.activeDays = days.filter((d) => d.solved > 0).length
    lcCh.state = lcCh.total > 0 ? 'degraded' : 'offline'
    lcCh.note = lcCh.total > 0 ? `signal lost — holding last good sample (${previous?.generatedAt?.slice(0, 10) ?? 'unknown'})` : 'signal lost — no prior sample held'
  }

  // Anything that arrived without readable text is dropped rather than shown
  // as an empty row; the log reports what happened or says nothing.
  const clean = events.filter((e) => e.text.trim().length > 0)
  clean.sort((a, b) => new Date(b.t).getTime() - new Date(a.t).getTime())

  const snapshot: Snapshot = {
    generatedAt: new Date().toISOString(),
    from: start,
    to: end,
    days,
    channels: [gh, lcCh],
    difficulty,
    events: clean.slice(0, 48),
    fallback: false,
  }

  await writeFile(OUT, `${JSON.stringify(snapshot, null, 0)}\n`, 'utf8')
  log('write', `${path.relative(ROOT, OUT)} · ${gh.total} + ${lcCh.total} events · ${(JSON.stringify(snapshot).length / 1024).toFixed(1)} kB`)
  log('done', 'loop closed')
}

main().catch((err) => {
  // Acquisition must never fail the build. The committed snapshot stands.
  log('fault', `${(err as Error).message} — retaining committed snapshot`)
  process.exit(0)
})
