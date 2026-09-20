import type { Metadata } from 'next'
import { Desk } from '@/components/shell/Desk'

export const metadata: Metadata = {
  title: 'Terminal',
  description: 'A second way to navigate the system. Never the only way to anything.',
}

/**
 * With JavaScript the shell opens the interactive terminal. Without it, this
 * reference is what remains — which is the point: the terminal is a second
 * navigation layer, never the only path to anything.
 */
export default function Page() {
  return (
    <Desk entry="/terminal">
      <div className="p-5 term-col">
        <h1 className="mono text-secondary border-b border-subtle pb-2">TERMINAL</h1>
        <pre className="mono text-[13px] text-secondary mt-4 whitespace-pre-wrap">{`NAVIGATION    projects, failures, skills, experiments,
              about, contact, bin, monitor
FILES         ls, cd <dir>, cat <file>, open <app>
SYSTEM        whoami, uptime, stats, theme <dark|light>, clear
LINKS         github, leetcode, resume

Tab completes. Up and down arrows for history. Try: sudo hire-mudit`}</pre>
      </div>
    </Desk>
  )
}
