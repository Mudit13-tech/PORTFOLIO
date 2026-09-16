/**
 * Sorting, as a step machine.
 *
 * Each algorithm is the real implementation; it simply yields after every
 * comparison and every swap instead of running to completion in one tick. The
 * pane pulls one frame per interval from a live generator, so what you watch
 * is the algorithm executing, not a recording of it having executed.
 */
export interface Frame {
  a: number[]
  compare: readonly [number, number] | null
  swap: readonly [number, number] | null
  pivot: number | null
  /** Indices whose final position is proven. */
  done: number[]
  comparisons: number
  writes: number
  note: string
}

export type Algorithm = 'quick' | 'merge' | 'insertion'

export const ALGORITHMS: Array<{ id: Algorithm; label: string; note: string }> = [
  { id: 'quick', label: 'quick', note: 'Lomuto partition, last element as pivot' },
  { id: 'merge', label: 'merge', note: 'bottom-up merge into an auxiliary buffer' },
  { id: 'insertion', label: 'insertion', note: 'shift-into-place, stable' },
]

class Tape {
  comparisons = 0
  writes = 0
  done = new Set<number>()
  constructor(readonly a: number[]) {}
  frame(over: Partial<Frame> = {}): Frame {
    return {
      a: this.a.slice(),
      compare: null,
      swap: null,
      pivot: null,
      done: [...this.done],
      comparisons: this.comparisons,
      writes: this.writes,
      note: '',
      ...over,
    }
  }
}

export function* quicksort(input: readonly number[]): Generator<Frame> {
  const t = new Tape(input.slice())
  const a = t.a

  function* part(lo: number, hi: number): Generator<Frame, number> {
    const pivot = a[hi]
    yield t.frame({ pivot: hi, note: `partition [${lo}..${hi}] · pivot ${pivot}` })
    let i = lo
    for (let j = lo; j < hi; j++) {
      t.comparisons++
      yield t.frame({ compare: [j, hi], pivot: hi, note: `${a[j]} ${a[j] <= pivot ? '<=' : '>'} ${pivot}` })
      if (a[j] <= pivot) {
        if (i !== j) {
          ;[a[i], a[j]] = [a[j], a[i]]
          t.writes += 2
          yield t.frame({ swap: [i, j], pivot: hi, note: `swap ${i} ${j}` })
        }
        i++
      }
    }
    if (i !== hi) {
      ;[a[i], a[hi]] = [a[hi], a[i]]
      t.writes += 2
      yield t.frame({ swap: [i, hi], note: `pivot home at ${i}` })
    }
    t.done.add(i)
    return i
  }

  function* qs(lo: number, hi: number): Generator<Frame> {
    if (lo > hi) return
    if (lo === hi) {
      t.done.add(lo)
      yield t.frame({ note: `index ${lo} settled` })
      return
    }
    const p = yield* part(lo, hi)
    yield* qs(lo, p - 1)
    yield* qs(p + 1, hi)
  }

  yield t.frame({ note: `quicksort · n = ${a.length}` })
  yield* qs(0, a.length - 1)
  for (let i = 0; i < a.length; i++) t.done.add(i)
  yield t.frame({ note: `sorted · ${t.comparisons} comparisons, ${t.writes} writes` })
}

export function* mergesort(input: readonly number[]): Generator<Frame> {
  const t = new Tape(input.slice())
  const a = t.a
  const n = a.length
  const aux = new Array<number>(n)

  yield t.frame({ note: `merge sort · n = ${n}` })

  for (let width = 1; width < n; width *= 2) {
    for (let lo = 0; lo < n; lo += 2 * width) {
      const mid = Math.min(lo + width, n)
      const hi = Math.min(lo + 2 * width, n)
      if (mid >= hi) continue
      for (let k = lo; k < hi; k++) aux[k] = a[k]
      let i = lo
      let j = mid
      for (let k = lo; k < hi; k++) {
        if (i >= mid) {
          a[k] = aux[j++]
        } else if (j >= hi) {
          a[k] = aux[i++]
        } else {
          t.comparisons++
          yield t.frame({ compare: [i, j], note: `merge width ${width} · ${aux[i]} vs ${aux[j]}` })
          a[k] = aux[j] < aux[i] ? aux[j++] : aux[i++]
        }
        t.writes++
        yield t.frame({ swap: [k, k], note: `write ${a[k]} to ${k}` })
      }
    }
    if (width * 2 >= n) for (let k = 0; k < n; k++) t.done.add(k)
  }

  for (let k = 0; k < n; k++) t.done.add(k)
  yield t.frame({ note: `sorted · ${t.comparisons} comparisons, ${t.writes} writes` })
}

export function* insertionsort(input: readonly number[]): Generator<Frame> {
  const t = new Tape(input.slice())
  const a = t.a
  yield t.frame({ note: `insertion sort · n = ${a.length}` })
  t.done.add(0)
  for (let i = 1; i < a.length; i++) {
    const v = a[i]
    let j = i - 1
    yield t.frame({ pivot: i, note: `lift ${v}` })
    while (j >= 0) {
      t.comparisons++
      yield t.frame({ compare: [j, i], pivot: i, note: `${a[j]} ${a[j] > v ? '>' : '<='} ${v}` })
      if (a[j] <= v) break
      a[j + 1] = a[j]
      t.writes++
      yield t.frame({ swap: [j, j + 1], note: `shift ${a[j]} right` })
      j--
    }
    a[j + 1] = v
    t.writes++
    t.done.add(i)
    yield t.frame({ note: `place ${v} at ${j + 1}` })
  }
  yield t.frame({ note: `sorted · ${t.comparisons} comparisons, ${t.writes} writes` })
}

export function make(algo: Algorithm, input: readonly number[]): Generator<Frame> {
  if (algo === 'merge') return mergesort(input)
  if (algo === 'insertion') return insertionsort(input)
  return quicksort(input)
}

export const MAX_N = 32

/** Lenient input. "[5, 3, 8]", "5 3 8" and "5,3,8" all mean the same thing. */
export function parseArray(raw: string): { values: number[] } | { error: string } {
  const body = raw.trim().replace(/^\[|\]$/g, '')
  if (!body) return { error: 'empty input — give me some numbers' }
  const parts = body.split(/[\s,]+/).filter(Boolean)
  const values: number[] = []
  for (const p of parts) {
    const n = Number(p)
    if (!Number.isFinite(n)) return { error: `"${p}" is not a number` }
    values.push(Math.round(n))
  }
  if (values.length < 2) return { error: 'need at least two values to sort' }
  if (values.length > MAX_N) return { error: `${values.length} values — the pane holds ${MAX_N}` }
  return { values }
}

export function randomArray(n = 22, max = 99): number[] {
  return Array.from({ length: n }, () => 1 + Math.floor(Math.random() * max))
}
