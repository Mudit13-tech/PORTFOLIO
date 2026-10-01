import { projects, type Failure, type Project } from '~/data'
import { failuresFor } from '@/lib/derived'
import { Glyph, StatusTag } from '@/components/ui'
import {
  ActionLink,
  AppPage,
  ArrowDot,
  Badge,
  Chapter,
  DotNumber,
  Figure,
  Inset,
  Orb,
  Pill,
  Stat,
  Ticks,
  type Tone,
} from '@/components/ui/kit'
import { MagneticChips } from '@/components/system/MagneticChips'
import { SectionNav } from '@/components/system/SectionNav'

/**
 * A project, read as a case study — in the same material as every other page.
 *
 * The frosted card, the recessed panel, the dotted leaders and the dot-matrix
 * numbers are the ones the list it was opened from is made of, so opening a
 * project feels like going one level deeper into the same application rather
 * than into a different website. What the page adds is sequence: numbered
 * chapters, a bar that follows you through them, and the few numbers worth
 * reading from across the room set large.
 *
 * Still no hooks and no 'use client' here. The two moving parts — the chapter
 * bar and the stack chips — are islands; everything else renders the same in
 * the plain document, in a window and in a phone sheet.
 *
 * Unwritten fields (`TODO — …`) are the author's notes to himself. They show
 * as a marked draft while developing and are left out of production.
 */
export const SHOW_DRAFTS = process.env.NODE_ENV !== 'production'

const isDraft = (s: string | null | undefined): s is string => !!s && s.startsWith('TODO')
const draftText = (s: string) => {
  const t = s.replace(/^TODO\s*[—–-]\s*/, '')
  return t.charAt(0).toUpperCase() + t.slice(1)
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Split prose into sentences, keeping `code spans` intact. */
function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z`"“])/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Inline `code` becomes <code>; everything else is text. */
function rich(text: string): React.ReactNode {
  const parts = text.split(/`([^`]+)`/g)
  return parts.map((part, i) => (i % 2 ? <code key={i}>{part}</code> : part))
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function shortDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return y && m && d ? `${d} ${MONTHS[m - 1]} ${y}` : iso
}

const toneOf = (p: Project): Tone => (p.status === 'shipped' ? 'ok' : p.status === 'wip' ? 'warn' : 'neutral')

type Written = { text: string } | { draft: string } | null

export function written(text: string | null): Written {
  if (!text) return null
  if (isDraft(text)) return SHOW_DRAFTS ? { draft: draftText(text) } : null
  return { text }
}

/* ------------------------------------------------------------------- page */

export function ProjectDetail({ project }: { project: Project }) {
  const linked = failuresFor(project)
  const resolved = linked.filter((f) => f.resolved).length
  const index = projects.findIndex((p) => p.id === project.id)
  const prev = projects.length > 1 ? projects[(index - 1 + projects.length) % projects.length] : null
  const next = projects.length > 1 ? projects[(index + 1) % projects.length] : null
  const tone = toneOf(project)

  const [problemLead, ...problemRest] = sentences(project.problem)
  const [howLead, ...howSteps] = sentences(project.architecture)
  const contribution = written(project.contribution)
  const retro = written(project.retrospective)

  const chapters: { id: string; short: string; node: (n: number) => React.ReactNode }[] = [
    {
      id: 'problem',
      short: 'Problem',
      node: (n) => (
        <Chapter n={n} id="problem" title="The problem" glyph="target" tone="info">
          <p className="lead">{rich(problemLead)}</p>
          {problemRest.map((s, i) => (
            <p key={i} className="mt-3 prose-col">
              {rich(s)}
            </p>
          ))}
        </Chapter>
      ),
    },
    {
      id: 'architecture',
      short: 'How it works',
      node: (n) => (
        <Chapter n={n} id="architecture" title="How it works" glyph="layers" tone="teal">
          <p className="lead">{rich(howLead)}</p>
          {howSteps.length > 0 && (
            <ol className="steps mt-4">
              {howSteps.map((s, i) => (
                <li key={i} className="tile step">
                  <span className="step-num">
                    <DotNumber value={pad(i + 1)} size={13} />
                  </span>
                  <p>{rich(s)}</p>
                </li>
              ))}
            </ol>
          )}
        </Chapter>
      ),
    },
    ...(contribution
      ? [
          {
            id: 'built',
            short: 'What I built',
            node: (n: number) => (
              <Chapter n={n} id="built" title="What I built" glyph="wrench" tone="ok">
                {'draft' in contribution ? <Draft>{contribution.draft}</Draft> : <p className="lead">{rich(contribution.text)}</p>}
              </Chapter>
            ),
          },
        ]
      : []),
    ...(project.evidence.length > 0
      ? [
          {
            id: 'measured',
            short: 'Measured',
            node: (n: number) => (
              <Chapter
                n={n}
                id="measured"
                title="Measured"
                glyph="pulse"
                tone="violet"
                kicker={`${project.evidence.length} readings`}
              >
                <ul className="spec">
                  {project.evidence.map((e) => (
                    <li key={e.label} className="tile spec-cell">
                      <p className="field-label">{e.label}</p>
                      <div className="mt-2.5 min-h-[26px] flex items-end">
                        <Figure value={e.value} size={24} />
                      </div>
                      <p className="micro text-tertiary mt-2">{e.source}</p>
                    </li>
                  ))}
                </ul>
              </Chapter>
            ),
          },
        ]
      : []),
    {
      id: 'broke',
      short: 'What broke',
      node: (n) => (
        <Chapter
          n={n}
          id="broke"
          title="What broke"
          glyph="warn"
          tone="error"
          kicker={linked.length ? `${resolved} of ${linked.length} resolved` : undefined}
        >
          {linked.length === 0 ? (
            <p className="text-tertiary">No crash reports filed against this project yet.</p>
          ) : (
            <>
              <div className="tone-ok flex items-center gap-3 mb-3">
                <Ticks value={resolved / linked.length} count={linked.length * 6} className="flex-1 max-w-[260px]" />
                <span className="mono text-[11.5px] text-tertiary">
                  {Math.round((resolved / linked.length) * 100)}% fixed
                </span>
              </div>
              <ul className="grid gap-2">
                {linked.map((f, i) => (
                  <li key={f.id}>
                    <Incident failure={f} n={i + 1} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </Chapter>
      ),
    },
    ...(retro
      ? [
          {
            id: 'retro',
            short: 'Hindsight',
            node: (n: number) => (
              <Chapter n={n} id="retro" title="What I’d do differently" glyph="spark" tone="warn">
                {'draft' in retro ? (
                  <Draft>{retro.draft}</Draft>
                ) : (
                  <figure className="tile p-4 flex gap-3">
                    <Glyph name="quote" size={18} className="text-tertiary shrink-0 mt-0.5" />
                    <blockquote className="text-[15.5px] leading-[1.6] text-primary">{rich(retro.text)}</blockquote>
                  </figure>
                )}
              </Chapter>
            ),
          },
        ]
      : []),
  ]

  return (
    <AppPage>
      <article className="project">
        {/* ------------------------------------------------------- the card */}
        <Orb tone={tone} className="project-hero">
          {/* The project's place on the shelf, in the panel's own face, large
              and faint — the one mark that is this page's alone. */}
          <span className="project-index" aria-hidden="true">
            <DotNumber value={pad(index + 1)} size={52} />
          </span>

          <div className="relative flex items-start justify-between gap-3">
            <p className="field-label">
              Project {pad(index + 1)} <span className="opacity-60">/ {pad(projects.length)}</span>
            </p>
            <StatusTag status={project.status} />
          </div>

          <h1 className="project-title">{project.name}</h1>
          <p className="relative text-[14px] text-secondary mt-1">{project.type}</p>

          <Inset className="relative mt-5">
            <div className="facts">
              <Stat label="Role">
                <span className="text-[14px] text-primary">{project.role}</span>
              </Stat>
              <Stat label="Since">
                <DotNumber value={project.year} size={17} />
              </Stat>
              <Stat label="Incidents">
                <DotNumber value={pad(linked.length)} size={17} />
              </Stat>
            </div>
            <div className="facts-rule" aria-hidden="true" />
            <p className="text-[11.5px] text-tertiary leading-none mb-2">Stack</p>
            <MagneticChips items={project.stack} />
          </Inset>

          <div className="relative flex flex-wrap items-center gap-x-3 gap-y-2 mt-4">
            {project.links.source ? (
              <ActionLink href={project.links.source}>View source</ActionLink>
            ) : (
              <Pill>
                <Glyph name="lock" size={11} />
                Source is private
              </Pill>
            )}
            {project.links.live ? (
              <ActionLink href={project.links.live} glyph="globe" quiet>
                Open live
              </ActionLink>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[12.5px] text-tertiary">
                <Glyph name="device" size={13} />
                Runs on device — no web demo
              </span>
            )}
          </div>
        </Orb>

        {/* --------------------------------------------------- the chapters */}
        <SectionNav items={chapters.map((c) => ({ id: c.id, label: c.short }))} />

        {chapters.map((c, i) => (
          <div key={c.id}>{c.node(i + 1)}</div>
        ))}

        {/* ----------------------------------------------------- the shelf */}
        {prev && next && (
          <nav className="pager" aria-label="More projects">
            <PagerCard project={prev} dir="prev" />
            <PagerCard project={next} dir="next" />
          </nav>
        )}
      </article>
    </AppPage>
  )
}

/* ------------------------------------------------------------- pieces */

/** One crash report against this project: number, title, severity, date, outcome. */
function Incident({ failure: f, n }: { failure: Failure; n: number }) {
  return (
    <a href={`/failures/${f.id}`} className="tile incident">
      <span className="text-tertiary shrink-0">
        <DotNumber value={pad(n)} size={11} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] leading-snug text-primary">{f.title}</span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-[12px] text-tertiary">
          <span className="inline-flex items-center gap-1.5">
            <span className={`sev sev-${f.severity}`} aria-hidden="true" />
            {f.severity}
          </span>
          <span aria-hidden="true">·</span>
          <span>{shortDate(f.date)}</span>
          {f.resolved && (
            <span className="pill pill-ok !h-5 !px-2 !text-[11px]">
              <Glyph name="check" size={10} />
              resolved
            </span>
          )}
        </span>
      </span>
      <ArrowDot size={28} glyph="chevron" />
    </a>
  )
}

function PagerCard({ project: p, dir }: { project: Project; dir: 'prev' | 'next' }) {
  return (
    <Orb href={`/projects/${p.id}`} tone={toneOf(p)} className={`pager-card pager-${dir}`}>
      <span className="flex items-center justify-between gap-2">
        <span className="field-label">{dir === 'prev' ? 'Previous' : 'Next project'}</span>
        <span className={dir === 'prev' ? 'rotate-180' : ''}>
          <ArrowDot size={28} glyph="chevron" />
        </span>
      </span>
      <span className="block text-[17px] font-medium text-primary mt-2 truncate">{p.name}</span>
      <span className="block text-[12.5px] text-tertiary mt-0.5 truncate">{p.type}</span>
    </Orb>
  )
}

/** An unwritten chapter. Visible only while developing. */
export function Draft({ children }: { children: React.ReactNode }) {
  return (
    <div className="draft">
      <p className="draft-tag">
        <Badge glyph="file" tone="warn" size={18} />
        Draft · hidden in production
      </p>
      <p>{children}</p>
    </div>
  )
}
