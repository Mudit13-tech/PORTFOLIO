#!/usr/bin/env node
/**
 * The lattice is a claim the site makes about itself, so it is checked rather
 * than trusted. Every pixel value written by hand must be a multiple of 13 —
 * the cell pitch — or one of the few sub-cell values the geometry genuinely
 * needs.
 *
 * src/lib/lattice.ts is exempt: it is where those few numbers are defined.
 */
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const U = 13

/** 0: nothing. 1: a hairline. 2: the gutter. 11: the cell itself. */
const SUB_CELL = new Set([0, 1, 2, 11])
/** The type scale, which is a ratio scale and deliberately not on the lattice. */
const TYPE = new Set([11, 13, 16, 22, 34, 56])

const EXEMPT = new Set([path.join('src', 'lib', 'lattice.ts')])
const EXTS = new Set(['.ts', '.tsx', '.css'])

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue
    const full = path.join(dir, e.name)
    if (e.isDirectory()) yield* walk(full)
    else if (EXTS.has(path.extname(e.name))) yield full
  }
}

const offences = []

for (const dir of ['src', 'content']) {
  for await (const file of walk(path.join(ROOT, dir))) {
    const rel = path.relative(ROOT, file)
    if (EXEMPT.has(rel)) continue
    const src = await readFile(file, 'utf8')
    let inBlock = false
    src.split('\n').forEach((line, i) => {
      // Comments explain numbers rather than apply them, so they are skipped —
      // including the interior of a multi-line block.
      const opens = line.includes('/*')
      const closes = line.includes('*/')
      const wasInBlock = inBlock
      if (opens && !closes) inBlock = true
      else if (closes) inBlock = false
      if (wasInBlock || opens || /^\s*\/\//.test(line)) return
      for (const m of line.matchAll(/(-?\d+(?:\.\d+)?)px\b/g)) {
        const n = Math.abs(Number(m[1]))
        if (Number.isInteger(n) && (n % U === 0 || SUB_CELL.has(n) || TYPE.has(n))) continue
        offences.push({ rel, line: i + 1, value: m[0], text: line.trim() })
      }
    })
  }
}

if (offences.length === 0) {
  console.log(`[lattice] clean · every hand-written px value is on the ${U} px grid`)
  process.exit(0)
}

console.error(`[lattice] ${offences.length} value(s) off the ${U} px grid:\n`)
for (const o of offences) {
  console.error(`  ${o.rel}:${o.line}  ${o.value}`)
  console.error(`    ${o.text}\n`)
}
process.exit(1)
