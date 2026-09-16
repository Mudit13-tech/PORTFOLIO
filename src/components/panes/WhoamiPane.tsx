'use client'

import { profile } from '~/content/profile'
import { Idle, Pane } from '../Pane'
import type { Snapshot } from '@/lib/types'

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="flex gap-1 text-xs">
      <span className="shrink-0 text-dim" style={{ width: 39 }}>
        {label}
      </span>
      <span className="min-w-0 text-dim">{children}</span>
    </p>
  )
}

export function WhoamiPane({ snapshot, seq }: { snapshot: Snapshot; seq: number }) {
  const solved = snapshot.channels.find((c) => c.id === 'leetcode')?.total ?? 0

  return (
    <Pane id="whoami" seq={seq} meta={profile.institution}>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl text-text">{profile.name}</h1>

        {profile.summary ? (
          <p className="text-base text-text">{profile.summary}</p>
        ) : (
          <div className="border-l border-wire pl-1">
            <Idle compact line="summary · channel idle" hint="one sentence, set in content/profile.ts" />
          </div>
        )}

        <div className="rule pt-1">
          <Line label="field">{profile.discipline}</Line>
          <Line label="at">{profile.institution}</Line>
          {profile.location ? <Line label="loc">{profile.location}</Line> : null}
          <Line label="ch0">
            <a href={`https://github.com/${profile.github}`} rel="me noreferrer" target="_blank">
              github/{profile.github}
            </a>
          </Line>
          <Line label="ch1">
            <a href={`https://leetcode.com/u/${profile.leetcode}/`} rel="me noreferrer" target="_blank">
              leetcode/{profile.leetcode}
            </a>
          </Line>
          {profile.email ? (
            <Line label="mail">
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
            </Line>
          ) : null}
          {profile.cv ? (
            <Line label="cv">
              <a href={profile.cv}>{profile.cv.replace(/^\//, '')}</a>
            </Line>
          ) : null}
          {profile.elsewhere.map((l) => (
            <Line key={l.href} label="also">
              <a href={l.href} rel="me noreferrer" target="_blank">
                {l.label}
              </a>
            </Line>
          ))}
        </div>

        <p className="rule flex items-center gap-1 pt-1 text-xs">
          <span
            aria-hidden="true"
            className="inline-block shrink-0"
            style={{ width: 11, height: 11, background: 'var(--c-live)' }}
          />
          {profile.status ? (
            <span className="text-text">{profile.status}</span>
          ) : (
            <span className="text-dim">
              status · channel idle
              <span className="text-dim"> · set profile.status</span>
            </span>
          )}
        </p>

        {snapshot.difficulty ? (
          <p className="text-xs text-dim tabular-nums">
            {solved} accepted in the window · lifetime{' '}
            <span className="text-cool">{snapshot.difficulty.easy} easy</span>
            <span className="text-wire"> / </span>
            <span className="text-cool">{snapshot.difficulty.medium} medium</span>
            <span className="text-wire"> / </span>
            <span className="text-alert">{snapshot.difficulty.hard} hard</span>
          </p>
        ) : null}
      </div>
    </Pane>
  )
}
