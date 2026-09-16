/**
 * A* over a 4-connected grid, yielding one frame per expansion.
 *
 * Manhattan distance is used as the heuristic. On a 4-connected grid with unit
 * step cost it never overestimates, so the first path found is optimal — which
 * is the property worth watching: the search fans out, then stops the moment
 * the goal is popped rather than when it is first touched.
 */
export interface Frame {
  /** Cells on the frontier, cheapest first. */
  open: number[]
  /** Cells whose expansion is finished. */
  closed: number[]
  current: number | null
  /** Non-null once the goal has been popped. */
  path: number[] | null
  expanded: number
  note: string
}

export interface Grid {
  cols: number
  rows: number
  walls: Set<number>
  start: number
  goal: number
}

const xy = (i: number, cols: number) => [i % cols, Math.floor(i / cols)] as const

export function manhattan(a: number, b: number, cols: number): number {
  const [ax, ay] = xy(a, cols)
  const [bx, by] = xy(b, cols)
  return Math.abs(ax - bx) + Math.abs(ay - by)
}

function neighbours(i: number, g: Grid): number[] {
  const [x, y] = xy(i, g.cols)
  const out: number[] = []
  if (x > 0) out.push(i - 1)
  if (x < g.cols - 1) out.push(i + 1)
  if (y > 0) out.push(i - g.cols)
  if (y < g.rows - 1) out.push(i + g.cols)
  return out.filter((n) => !g.walls.has(n))
}

export function* astar(g: Grid): Generator<Frame> {
  const size = g.cols * g.rows
  const gScore = new Float64Array(size).fill(Infinity)
  const fScore = new Float64Array(size).fill(Infinity)
  const from = new Int32Array(size).fill(-1)
  const open = new Set<number>([g.start])
  const closed = new Set<number>()

  gScore[g.start] = 0
  fScore[g.start] = manhattan(g.start, g.goal, g.cols)

  const byF = () => [...open].sort((a, b) => fScore[a] - fScore[b] || manhattan(a, g.goal, g.cols) - manhattan(b, g.goal, g.cols))

  let expanded = 0
  yield { open: [...open], closed: [], current: null, path: null, expanded, note: `A* · h = manhattan · ${size} cells` }

  while (open.size > 0) {
    const ordered = byF()
    const current = ordered[0]
    open.delete(current)

    if (current === g.goal) {
      const path: number[] = []
      for (let n = current; n !== -1; n = from[n]) path.push(n)
      path.reverse()
      yield {
        open: [...open],
        closed: [...closed],
        current,
        path,
        expanded,
        note: `path found · ${path.length - 1} steps · ${expanded} expansions`,
      }
      return
    }

    closed.add(current)
    expanded++

    for (const n of neighbours(current, g)) {
      if (closed.has(n)) continue
      const tentative = gScore[current] + 1
      if (tentative < gScore[n]) {
        from[n] = current
        gScore[n] = tentative
        fScore[n] = tentative + manhattan(n, g.goal, g.cols)
        open.add(n)
      }
    }

    yield {
      open: [...open],
      closed: [...closed],
      current,
      path: null,
      expanded,
      note: `expand ${expanded} · frontier ${open.size} · g = ${gScore[current]}`,
    }
  }

  yield { open: [], closed: [...closed], current: null, path: null, expanded, note: `no route · ${expanded} expansions, frontier exhausted` }
}

/** A default obstacle field, so the pane is never a blank box on arrival. */
export function seedWalls(cols: number, rows: number): Set<number> {
  const walls = new Set<number>()
  const bar = (x: number, y0: number, y1: number) => {
    for (let y = y0; y <= y1; y++) walls.add(y * cols + x)
  }
  bar(Math.floor(cols * 0.28), 0, rows - 5)
  bar(Math.floor(cols * 0.52), 4, rows - 1)
  bar(Math.floor(cols * 0.76), 0, rows - 6)
  return walls
}
