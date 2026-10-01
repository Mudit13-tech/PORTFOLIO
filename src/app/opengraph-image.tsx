import { ImageResponse } from 'next/og'
import { buildVersion, channels, meta, profile } from '~/data'
import { counts } from '@/lib/derived'

/**
 * The share card — what a link to this system looks like pasted into
 * LinkedIn, a chat or an email, before anyone opens it.
 *
 * Drawn from the same data as the desk, so the counts on it are the counts in
 * it, and painted in the desk's own light: teal rising from the lower left,
 * violet from the upper right, over the near-black the windows sit on. It is
 * rendered once at build time; Geist is next/og's default face, so the card
 * is set in the interface's own type without shipping a font.
 */
export const alt = `${profile.name} — ${meta.systemName}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const pad = (n: number) => String(n).padStart(2, '0')

export default function Image() {
  const open = channels.filter((c) => c.href).length
  const stats = [
    { value: pad(counts.projects), label: 'projects' },
    { value: pad(counts.failures), label: 'crash reports' },
    { value: pad(counts.skills), label: 'modules' },
  ]

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px 64px',
          color: '#e4e7e5',
          backgroundColor: '#0b0f13',
          backgroundImage: [
            'radial-gradient(circle at 4% 108%, rgba(74,198,160,0.55) 0%, rgba(74,198,160,0) 52%)',
            'radial-gradient(circle at 100% -8%, rgba(126,132,232,0.48) 0%, rgba(126,132,232,0) 46%)',
            'linear-gradient(158deg, #1a2734 0%, #0b0f13 56%, #12211f 100%)',
          ].join(', '),
        }}
      >
        {/* the status line */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, letterSpacing: '0.12em' }}>
            <div style={{ width: 12, height: 12, borderRadius: 999, backgroundColor: '#7fa76b' }} />
            {meta.systemName}
          </div>
          <div style={{ display: 'flex', color: '#9ba5a8' }}>{`build ${buildVersion}`}</div>
        </div>

        {/* the name */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 112, lineHeight: 1, letterSpacing: '-0.035em' }}>{profile.name}</div>
          <div style={{ fontSize: 34, color: '#c9d1cf', marginTop: 22 }}>{profile.role}</div>
          <div style={{ fontSize: 26, color: '#9ba5a8', marginTop: 10 }}>
            {`${profile.discipline} · ${profile.institution}`}
          </div>
        </div>

        {/* the readings */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 16 }}>
            {stats.map((s) => (
              <div
                key={s.label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '18px 24px',
                  minWidth: 190,
                  borderRadius: 24,
                  backgroundColor: 'rgba(30,35,39,0.62)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <div style={{ fontSize: 46, lineHeight: 1, letterSpacing: '0.04em' }}>{s.value}</div>
                <div style={{ fontSize: 20, color: '#9ba5a8', marginTop: 10 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: 22, color: '#9ba5a8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#7fa76b' }}>
              <div style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: '#7fa76b' }} />
              {`${open} of ${channels.length} channels open`}
            </div>
            {profile.links.email && <div style={{ display: 'flex', marginTop: 10 }}>{profile.links.email}</div>}
          </div>
        </div>
      </div>
    ),
    size,
  )
}
