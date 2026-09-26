import { skills, type Skill } from '~/data'
import { failuresForSkill, projectsFor, skillsByCategory } from '@/lib/derived'
import { Chip, Empty, Glyph, Section } from '@/components/ui'
import {
  AppHeader,
  AppPage,
  ArrowDot,
  Dash,
  DotNumber,
  Figure,
  Filter,
  Inset,
  Lamps,
  Orb,
  Pill,
  Stat,
} from '@/components/ui/kit'

/**
 * Installed modules.
 *
 * No percentage bars. Self-rated skill levels are unverifiable and everyone
 * inflates them, so the lamps are usage FREQUENCY — how many of the projects
 * actually contain the technology — and the label says exactly that, next to
 * the evidence that backs it.
 */
const CATEGORY_LABEL: Record<string, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  language: 'Languages',
  tooling: 'Tooling',
}

export function SkillsApp() {
  const groups = skillsByCategory().filter((g) => g.modules.length > 0)

  return (
    <AppPage>
      <AppHeader
        path="INSTALLED_MODULES/"
        title="Skills"
        sub="Lamps count the projects a module appears in — usage, not mastery."
        aside={<Pill>{skills.length} modules</Pill>}
      />

      <Filter
        label="Filter modules by category"
        options={groups.map((g) => ({
          value: g.category,
          label: CATEGORY_LABEL[g.category] ?? g.category,
          count: g.modules.length,
        }))}
      >
        <div className="grid gap-4">
          {groups.map(({ category, modules }) => (
            <section key={category} data-f={category}>
              <h2 className="field-label section-title mb-2">{CATEGORY_LABEL[category] ?? category}</h2>
              <ul className="grid gap-2 @xl:grid-cols-2">
                {modules.map((s) => (
                  <li key={s.id}>
                    <a href={`/skills/${s.id}`} className="tile flex items-center gap-3 px-3.5 py-3 h-full">
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] text-primary truncate">{s.name}</span>
                        <span className="block text-[12px] text-tertiary mt-0.5 truncate">
                          {s.projectIds.length} project{s.projectIds.length === 1 ? '' : 's'}
                          {s.firstUsed ? ` · since ${s.firstUsed}` : ''}
                        </span>
                      </span>
                      <Lamps n={s.frequency} />
                      <ArrowDot size={26} glyph="chevron" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Filter>
    </AppPage>
  )
}

export function SkillDetail({ skill }: { skill: Skill }) {
  const used = projectsFor(skill)
  const broke = failuresForSkill(skill)

  return (
    <AppPage>
      <article>
        <Orb tone="violet" className="mb-6">
          <p className="field-label">Module · {CATEGORY_LABEL[skill.category] ?? skill.category}</p>
          <h1 className="text-[26px] @lg:text-[30px] leading-[1.1] tracking-[-0.02em] font-medium text-primary mt-2">
            {skill.name}
          </h1>
          <div className="flex items-center gap-2.5 mt-3">
            <Lamps n={skill.frequency} />
            <span className="text-[12px] text-tertiary">usage frequency, not mastery</span>
          </div>

          <Inset className="mt-5 flex items-end gap-3">
            <Stat label="First used">
              <DotNumber value={skill.firstUsed} size={17} />
            </Stat>
            <Dash />
            <Stat label="Written" align="right">
              {skill.bytes ? (
                <Figure value={`${(skill.bytes / 1000).toFixed(1)} KB`} size={17} />
              ) : (
                <span className="text-[13px] text-tertiary">not measurable</span>
              )}
            </Stat>
          </Inset>
          {skill.bytes ? (
            <p className="micro text-tertiary mt-2">GitHub languages API, summed across public repositories</p>
          ) : null}
        </Orb>

        <Section title="Used in">
          {used.length === 0 ? (
            <Empty>Not yet used in a listed project.</Empty>
          ) : (
            <ul className="grid gap-2 not-prose">
              {used.map((p) => (
                <li key={p.id}>
                  <a href={`/projects/${p.id}`} className="tile flex items-center gap-3 px-3.5 py-3">
                    <Glyph name="projects" size={14} className="text-ok shrink-0" />
                    <span className="text-[14px] text-primary">{p.name}</span>
                    <span className="ml-auto">
                      <ArrowDot size={26} glyph="chevron" />
                    </span>
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
            <ul className="grid gap-2 not-prose">
              {broke.map((f) => (
                <li key={f.id}>
                  <a href={`/failures/${f.id}`} className="tile flex items-center gap-3 px-3.5 py-3">
                    <Glyph name="warn" size={14} className="text-error shrink-0" />
                    <span className="text-[14px] text-primary">{f.title}</span>
                    <span className="ml-auto">
                      <ArrowDot size={26} glyph="chevron" />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
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
    </AppPage>
  )
}
