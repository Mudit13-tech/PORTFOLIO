import { skills, type Skill } from '~/data'
import { failuresForSkill, projectsFor, skillsByCategory } from '@/lib/derived'
import { Chip, Empty, Field, Glyph, Rule, Section } from '@/components/ui'

/**
 * Installed modules.
 *
 * No percentage bars. Self-rated skill levels are unverifiable and everyone
 * inflates them, so the dots are usage FREQUENCY — how many of the six projects
 * actually contain the technology — and the label says exactly that, next to
 * the evidence that backs it.
 */
function FrequencyDots({ n }: { n: number }) {
  return (
    <span className="mono text-[12px] tracking-[0.15em]" aria-hidden="true">
      <span className="text-ok">{'●'.repeat(n)}</span>
      <span className="text-tertiary">{'○'.repeat(Math.max(0, 4 - n))}</span>
    </span>
  )
}

const CATEGORY_LABEL: Record<string, string> = {
  frontend: 'FRONTEND',
  backend: 'BACKEND',
  language: 'LANGUAGES',
  tooling: 'TOOLING',
}

export function SkillsApp() {
  const groups = skillsByCategory()

  return (
    <div className="p-5">
      <header className="flex items-baseline justify-between border-b border-subtle pb-2 mb-3">
        <h1 className="mono text-secondary">INSTALLED MODULES</h1>
        <span className="micro text-tertiary">{skills.length} modules</span>
      </header>

      {groups.map(({ category, modules }) =>
        modules.length === 0 ? null : (
          <section key={category} className="mb-5">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="field-label">{CATEGORY_LABEL[category]}</h2>
              <span className="micro text-tertiary">{modules.length}</span>
            </div>
            <ul>
              {modules.map((s) => (
                <li key={s.id}>
                  <a
                    href={`/skills/${s.id}`}
                    className="flex items-center gap-3 py-1.5 px-2 -mx-2 rounded-sm hover:bg-raised/60 border-b border-subtle/40"
                  >
                    <span className="mono text-[13px] text-primary w-36 shrink-0 truncate">{s.name}</span>
                    <FrequencyDots n={s.frequency} />
                    <span className="mono text-[12px] text-tertiary truncate">
                      {s.projectIds.length} project{s.projectIds.length === 1 ? '' : 's'}
                      {s.firstUsed ? ` · since ${s.firstUsed}` : ''}
                    </span>
                    <Glyph name="chevron" size={11} className="ml-auto text-tertiary shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ),
      )}

      <p className="mono text-[12px] text-tertiary">
        The dots are usage frequency — how many projects contain it — not mastery.
        Anchoring the scale to something checkable is the only way to keep it honest.
      </p>
    </div>
  )
}

export function SkillDetail({ skill }: { skill: Skill }) {
  const used = projectsFor(skill)
  const broke = failuresForSkill(skill)

  return (
    <article className="p-5">
      <header>
        <h1 className="text-[24px] leading-[1.25] tracking-[-0.01em] text-primary">{skill.name}</h1>
        <div className="flex items-center gap-3 mt-2">
          <FrequencyDots n={skill.frequency} />
          <span className="micro text-tertiary">usage frequency, not mastery</span>
        </div>
      </header>

      <Rule />

      <Section title="Used in">
        {used.length === 0 ? (
          <Empty>Not yet used in a listed project.</Empty>
        ) : (
          <ul className="grid gap-1 not-prose">
            {used.map((p) => (
              <li key={p.id}>
                <a
                  href={`/projects/${p.id}`}
                  className="flex items-center gap-2 py-1 mono text-[13px] text-info hover:text-primary"
                >
                  <span className="text-tertiary">→</span>
                  {p.name}
                </a>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Broke it in">
        {broke.length === 0 ? (
          <Empty>No crash report names this module yet.</Empty>
        ) : (
          <ul className="grid gap-1 not-prose">
            {broke.map((f) => (
              <li key={f.id}>
                <a
                  href={`/failures/${f.id}`}
                  className="flex items-center gap-2 py-1 mono text-[13px] text-error hover:text-primary"
                >
                  <Glyph name="warn" size={12} />
                  {f.title}
                </a>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Measured">
        <dl className="grid gap-2 not-prose">
          <Field label="first used">
            <span className="mono">{skill.firstUsed}</span>
          </Field>
          <Field
            label="written"
            hint={skill.bytes ? 'GitHub languages API, summed across public repositories' : undefined}
          >
            {skill.bytes ? (
              <span className="mono">{(skill.bytes / 1000).toFixed(1)} KB</span>
            ) : (
              <Empty>not separately measurable</Empty>
            )}
          </Field>
        </dl>
      </Section>

      {skill.adjacent.length > 0 && (
        <Section title="Adjacent">
          <div className="flex flex-wrap gap-1.5 not-prose">
            {skill.adjacent.map((a) => (
              <Chip key={a}>{a}</Chip>
            ))}
          </div>
        </Section>
      )}
    </article>
  )
}
