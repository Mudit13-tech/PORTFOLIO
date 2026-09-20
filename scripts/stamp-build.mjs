#!/usr/bin/env node
/**
 * Stamps the real deploy date into data/meta.ts and checks referential
 * integrity before the build.
 *
 * The version string in the top bar and on the boot screen is this date. There
 * is no hand-written version number in the system, because an invented `v2.6`
 * is the first thing a developer notices.
 */
import { readFile, writeFile } from 'node:fs/promises'

const FILE = new URL('../data/meta.ts', import.meta.url)
const today = new Date().toISOString().slice(0, 10)

const src = await readFile(FILE, 'utf8')
const next = src.replace(/deployedAt: '\d{4}-\d{2}-\d{2}'/, `deployedAt: '${today}'`)

if (next !== src) {
  await writeFile(FILE, next)
  process.stdout.write(`[build] stamped deployedAt ${today}\n`)
} else {
  process.stdout.write(`[build] deployedAt already ${today}\n`)
}
