import { bin, experiments, failures, meta, profile, projects, skills } from '~/data'
import { counts, stability, system } from '@/lib/derived'

/**
 * The document underneath the operating system.
 *
 * With JavaScript disabled this is the whole portfolio: complete, readable,
 * semantic, and in the right heading order. It is also what a crawler indexes.
 * The OS chrome sits on top of a properly structured document rather than
 * replacing one.
 *
 * `hidden` is applied by the shell once the system boots, so a visitor with
 * JavaScript never sees it twice.
 */
export function StaticDocument() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <h1 className="text-[32px] leading-[1.15] tracking-[-0.02em] text-primary">{profile.name}</h1>
      <p className="mono text-[13px] text-tertiary mt-1">
        {profile.role} · {profile.discipline}, {profile.institution}
      </p>
      <p className="prose-col text-secondary mt-4">{meta.description}</p>

      <p className="mono text-[13px] mt-4 flex gap-4">
        <a href={profile.links.github} className="text-info underline">
          GitHub
        </a>
        <a href={profile.links.leetcode} className="text-info underline">
          LeetCode
        </a>
      </p>

      <section className="mt-9">
        <h2 className="mono text-secondary border-b border-subtle pb-1">Projects ({counts.projects})</h2>
        {projects.map((p) => (
          <article key={p.id} className="mt-5">
            <h3 className="text-[19px] text-primary">
              <a href={`/projects/${p.id}`} className="underline decoration-subtle">
                {p.name}
              </a>
            </h3>
            <p className="mono text-[12px] text-tertiary">
              {p.type} · {p.year} · {p.status} · {p.stack.join(', ')}
            </p>
            <p className="prose-col text-secondary mt-1.5">{p.problem}</p>
          </article>
        ))}
      </section>

      <section className="mt-9">
        <h2 className="mono text-secondary border-b border-subtle pb-1">
          Crash reports ({counts.failures})
        </h2>
        {failures.map((f) => (
          <article key={f.id} className="mt-4">
            <h3 className="text-[15px] text-primary">
              <a href={`/failures/${f.id}`} className="underline decoration-subtle">
                {f.title}
              </a>
            </h3>
            <p className="mono text-[12px] text-tertiary">
              {f.date} · {f.status} · {f.severity} severity{f.resolved ? ' · resolved' : ''}
            </p>
            <p className="prose-col text-secondary mt-1">{f.whatHappened}</p>
            <p className="prose-col text-secondary mt-1">
              <strong className="text-primary">Lesson.</strong> {f.lesson}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-9">
        <h2 className="mono text-secondary border-b border-subtle pb-1">Skills ({counts.skills})</h2>
        <ul className="mt-2 grid gap-1">
          {skills.map((s) => (
            <li key={s.id} className="text-[14px] text-secondary">
              <a href={`/skills/${s.id}`} className="underline decoration-subtle">
                {s.name}
              </a>
              <span className="mono text-[12px] text-tertiary">
                {' '}
                — {s.projectIds.length} project{s.projectIds.length === 1 ? '' : 's'}, since {s.firstUsed}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-9">
        <h2 className="mono text-secondary border-b border-subtle pb-1">
          Experiments ({counts.experiments})
        </h2>
        <ul className="mt-2 grid gap-1">
          {experiments.map((e) => (
            <li key={e.id} className="text-[14px] text-secondary">
              <a href={`/experiments/${e.id}`} className="underline decoration-subtle">
                {e.name}
              </a>
              <span className="mono text-[12px] text-tertiary"> — {e.tested}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-9">
        <h2 className="mono text-secondary border-b border-subtle pb-1">Abandoned ({counts.bin})</h2>
        <ul className="mt-2 grid gap-1.5">
          {bin.map((b) => (
            <li key={b.id} className="text-[14px] text-secondary">
              <span className="mono text-primary">{b.name}</span> — {b.story}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-9">
        <h2 className="mono text-secondary border-b border-subtle pb-1">System</h2>
        <p className="mono text-[13px] text-tertiary mt-2">
          uptime {system.uptime} · build {system.build} · stability {stability.display} (
          {stability.formula})
        </p>
        <p className="prose-col text-secondary mt-3">{profile.process}</p>
      </section>
    </main>
  )
}
