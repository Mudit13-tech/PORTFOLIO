import type { AppId } from '@/os/types'

/**
 * The system's voice.
 *
 * Everything here is synthesised — there is not one audio file in the bundle,
 * because nine icons with three sounds each would be twenty-seven requests for
 * something a visitor may never switch on. Web Audio builds them from noise and
 * oscillators in a few hundred bytes of code.
 *
 * The rule the whole file follows: **every application has its own voice**, and
 * that voice is the material the icon is made of. The terminal keycap thocks
 * like a keyswitch, the crystal rings like struck glass, the bin is metal with
 * paper in it. Hover, press and launch are three sizes of the same voice, not
 * three different sounds — so you learn the object by ear before you read the
 * label, and a launch from the dock tells you which application without looking.
 *
 * Sound is off-by-default territory for a portfolio, so it is gated on one flag
 * the visitor owns, everything is quiet (nothing peaks above roughly −20 dBFS),
 * and every call is wrapped: a browser that refuses to make an AudioContext
 * must cost the interface nothing.
 */

/* ------------------------------------------------------------------ engine */

let ctx: AudioContext | null = null
let bus: GainNode | null = null
let on = false

/** Last time each voice fired, so a pointer skimming the dock cannot machine-gun. */
const lastAt = new Map<string, number>()

export function setSound(value: boolean): void {
  on = value
  if (!value && ctx && ctx.state === 'running') void ctx.suspend()
  if (value && ctx && ctx.state === 'suspended') void ctx.resume()
}

export function soundOn(): boolean {
  return on
}

/**
 * Browsers will not start audio outside a gesture, so the context is built on
 * the first sound that follows one and resumed on every later call. Returning
 * `null` is the normal path on a machine with no audio — callers do nothing.
 */
function audio(): { ac: AudioContext; out: GainNode; t: number } | null {
  if (!on || typeof window === 'undefined') return null
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      ctx = new Ctor()
      // A gentle limiter. Two icons hovered in the same frame should not add up
      // to something louder than either of them.
      const comp = ctx.createDynamicsCompressor()
      comp.threshold.value = -20
      comp.knee.value = 26
      comp.ratio.value = 8
      comp.attack.value = 0.002
      comp.release.value = 0.14
      bus = ctx.createGain()
      bus.gain.value = 0.85
      bus.connect(comp)
      comp.connect(ctx.destination)
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return { ac: ctx, out: bus as GainNode, t: ctx.currentTime + 0.004 }
  } catch {
    return null
  }
}

/** One second of white noise, made once and re-pitched for every noise voice. */
let noiseBuf: AudioBuffer | null = null
function noiseBuffer(ac: AudioContext): AudioBuffer {
  if (noiseBuf && noiseBuf.sampleRate === ac.sampleRate) return noiseBuf
  const n = Math.floor(ac.sampleRate)
  const b = ac.createBuffer(1, n, ac.sampleRate)
  const d = b.getChannelData(0)
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1
  noiseBuf = b
  return b
}

/* ------------------------------------------------------------- instruments
 * Five primitives. Everything an icon says is built from these, which is what
 * keeps nine distinct voices inside one consistent sound world.
 */

interface Env {
  /** Peak gain. Keep these small; the numbers below are the whole mix. */
  vol: number
  /** Seconds to peak. 0 is a click. */
  attack?: number
  dur: number
}

/** Filtered noise with a swept band — air, paper, crumple, sweep, hiss. */
function hiss(
  a: { ac: AudioContext; out: GainNode; t: number },
  o: Env & { from: number; to: number; q?: number; type?: BiquadFilterType; curve?: number },
) {
  const { ac, out, t } = a
  const src = ac.createBufferSource()
  src.buffer = noiseBuffer(ac)
  src.playbackRate.value = 0.8 + Math.random() * 0.4
  const f = ac.createBiquadFilter()
  f.type = o.type ?? 'bandpass'
  f.Q.value = o.q ?? 1
  f.frequency.setValueAtTime(o.from, t)
  f.frequency.exponentialRampToValueAtTime(Math.max(40, o.to), t + o.dur)
  const g = ac.createGain()
  const atk = o.attack ?? 0.001
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(o.vol, t + atk)
  // A high curve makes a percussive tick; a low one makes a breath.
  g.gain.setTargetAtTime(0.0001, t + atk, o.dur / (o.curve ?? 3))
  src.connect(f)
  f.connect(g)
  g.connect(out)
  src.start(t)
  src.stop(t + o.dur + 0.05)
}

/** A pitched body with an optional glide — plops, blips, thumps. */
function tone(
  a: { ac: AudioContext; out: GainNode; t: number },
  o: Env & { freq: number; to?: number; type?: OscillatorType; detune?: number; lp?: number },
) {
  const { ac, out, t } = a
  const osc = ac.createOscillator()
  osc.type = o.type ?? 'sine'
  if (o.detune) osc.detune.value = o.detune
  osc.frequency.setValueAtTime(o.freq, t)
  if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + o.dur)
  const g = ac.createGain()
  const atk = o.attack ?? 0.002
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(o.vol, t + atk)
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur)
  let tail: AudioNode = g
  if (o.lp) {
    const f = ac.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = o.lp
    g.connect(f)
    tail = f
  }
  osc.connect(g)
  tail.connect(out)
  osc.start(t)
  osc.stop(t + o.dur + 0.02)
}

/**
 * Struck metal and glass. Real bells are inharmonic — the partials are not
 * whole multiples of the root, which is the whole difference between a bell and
 * an organ. Longer partials decay first-order so the tail thins as it fades.
 */
function strike(
  a: { ac: AudioContext; out: GainNode; t: number },
  o: { freq: number; dur: number; vol: number; partials: number[]; type?: OscillatorType; spread?: number },
) {
  const { ac, out, t } = a
  o.partials.forEach((ratio, i) => {
    const osc = ac.createOscillator()
    osc.type = o.type ?? 'sine'
    osc.frequency.value = o.freq * ratio
    if (o.spread) osc.detune.value = (i % 2 ? 1 : -1) * o.spread
    const g = ac.createGain()
    const life = o.dur / (1 + i * 0.55)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(o.vol / (1 + i * 1.3), t + 0.002)
    g.gain.exponentialRampToValueAtTime(0.0001, t + life)
    osc.connect(g)
    g.connect(out)
    osc.start(t)
    osc.stop(t + life + 0.02)
  })
}

/**
 * Two-operator FM. One modulator on one carrier buys metallic, glassy and reedy
 * timbres that additive synthesis would need a dozen oscillators for.
 */
function fm(
  a: { ac: AudioContext; out: GainNode; t: number },
  o: Env & { freq: number; ratio: number; index: number; decay?: number },
) {
  const { ac, out, t } = a
  const car = ac.createOscillator()
  const mod = ac.createOscillator()
  const depth = ac.createGain()
  car.frequency.value = o.freq
  mod.frequency.value = o.freq * o.ratio
  depth.gain.setValueAtTime(o.freq * o.index, t)
  // The modulation index falls faster than the amplitude: bright on the strike,
  // pure in the tail, which is how a struck object actually behaves.
  depth.gain.exponentialRampToValueAtTime(o.freq * 0.01, t + (o.decay ?? o.dur * 0.4))
  const g = ac.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(o.vol, t + (o.attack ?? 0.003))
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur)
  mod.connect(depth)
  depth.connect(car.frequency)
  car.connect(g)
  g.connect(out)
  mod.start(t)
  car.start(t)
  mod.stop(t + o.dur + 0.02)
  car.stop(t + o.dur + 0.02)
}

/** Run a voice again `n` times at `gap` seconds, quieter each time. */
function repeat(n: number, gap: number, fn: (i: number, at: number) => void) {
  for (let i = 0; i < n; i++) fn(i, i * gap)
}

/* ------------------------------------------------------------- app voices
 * Three sizes of one idea per application: `hover` is a whisper of the material,
 * `press` is the object being touched, `launch` is it opening. `shut` is the
 * launch played backwards in spirit — falling where the launch rises.
 */

type Part = 'hover' | 'press' | 'launch' | 'shut'

type Voice = (a: { ac: AudioContext; out: GainNode; t: number }, part: Part) => void

const at = (a: { ac: AudioContext; out: GainNode; t: number }, dt: number) => ({ ...a, t: a.t + dt })

const VOICES: Record<AppId, Voice> = {
  /* Card stock. Sheets sliding over each other in a folder — all air, no pitch,
   * with a soft wooden tap underneath for the folder itself. */
  projects: (a, part) => {
    if (part === 'hover') return hiss(a, { from: 2600, to: 1500, vol: 0.035, dur: 0.07, q: 0.6, curve: 4 })
    if (part === 'press') {
      hiss(a, { from: 3400, to: 900, vol: 0.09, dur: 0.14, q: 0.5, curve: 3 })
      tone(a, { freq: 190, to: 140, vol: 0.05, dur: 0.09, type: 'triangle', lp: 900 })
      return
    }
    if (part === 'launch') {
      // Three sheets fanning out, each a little brighter and later.
      repeat(3, 0.052, (i, dt) =>
        hiss(at(a, dt), { from: 1500 + i * 900, to: 700 + i * 400, vol: 0.075 - i * 0.015, dur: 0.2, q: 0.55, curve: 2.4 }),
      )
      tone(a, { freq: 150, to: 240, vol: 0.055, dur: 0.22, type: 'triangle', lp: 1100, attack: 0.02 })
      return
    }
    hiss(a, { from: 1800, to: 500, vol: 0.06, dur: 0.18, q: 0.5, curve: 2.5 })
    tone(a, { freq: 230, to: 130, vol: 0.04, dur: 0.14, type: 'triangle', lp: 800 })
  },

  /* A traffic cone: soft PVC over a rubber base. The warning is in the interval,
   * not the volume — a falling minor third, the sound every alarm is built on. */
  failures: (a, part) => {
    if (part === 'hover') return tone(a, { freq: 520, vol: 0.022, dur: 0.06, type: 'square', lp: 2200 })
    if (part === 'press') {
      tone(a, { freq: 440, to: 370, vol: 0.05, dur: 0.1, type: 'square', lp: 1800 })
      tone(a, { freq: 90, to: 62, vol: 0.07, dur: 0.12, type: 'sine' })
      return
    }
    if (part === 'launch') {
      tone(a, { freq: 587, vol: 0.05, dur: 0.14, type: 'square', lp: 2400 })
      tone(at(a, 0.13), { freq: 494, vol: 0.05, dur: 0.2, type: 'square', lp: 2000 })
      tone(a, { freq: 98, to: 74, vol: 0.075, dur: 0.24, type: 'sine' })
      hiss(a, { from: 900, to: 300, vol: 0.03, dur: 0.16, q: 0.8, curve: 3 })
      return
    }
    tone(a, { freq: 440, to: 300, vol: 0.05, dur: 0.18, type: 'square', lp: 1400 })
    tone(a, { freq: 84, to: 56, vol: 0.06, dur: 0.2, type: 'sine' })
  },

  /* Cut crystal. FM at a near-irrational ratio gives the glassy inharmonic edge;
   * the launch is a struck chord with a shimmer that hangs on after it. */
  skills: (a, part) => {
    if (part === 'hover') return fm(a, { freq: 1760, ratio: 2.41, index: 1.6, vol: 0.02, dur: 0.14, decay: 0.05 })
    if (part === 'press') {
      fm(a, { freq: 1320, ratio: 2.41, index: 3.2, vol: 0.05, dur: 0.3, decay: 0.09 })
      return
    }
    if (part === 'launch') {
      // Root, fifth, octave — struck together, released in that order.
      ;[1, 1.5, 2].forEach((m, i) =>
        fm(at(a, i * 0.035), { freq: 880 * m, ratio: 2.41, index: 3.6 - i, vol: 0.045 - i * 0.008, dur: 0.75 - i * 0.12, decay: 0.12 }),
      )
      strike(at(a, 0.09), { freq: 2640, dur: 0.5, vol: 0.012, partials: [1, 2.76, 5.4] })
      return
    }
    ;[2, 1.5, 1].forEach((m, i) =>
      fm(at(a, i * 0.035), { freq: 660 * m, ratio: 2.41, index: 2.4, vol: 0.03, dur: 0.26, decay: 0.07 }),
    )
  },

  /* Laboratory glass with something alive in it. Bubbles are the classic trick:
   * a sine snapped up an octave in a few milliseconds reads as a plop, and a
   * handful at random pitches reads as a flask on the boil. */
  experiments: (a, part) => {
    const plop = (dt: number, f: number, v: number) =>
      tone(at(a, dt), { freq: f, to: f * 2.6, vol: v, dur: 0.055, type: 'sine', attack: 0.004 })
    if (part === 'hover') return plop(0, 300, 0.03)
    if (part === 'press') {
      plop(0, 260, 0.055)
      plop(0.07, 380, 0.035)
      return
    }
    if (part === 'launch') {
      repeat(5, 0.062, (i, dt) => plop(dt, 210 + Math.random() * 260, 0.05 - i * 0.006))
      // The glass itself, tapped once the liquid moves.
      strike(at(a, 0.1), { freq: 1480, dur: 0.6, vol: 0.022, partials: [1, 2.9, 5.1], spread: 6 })
      hiss(a, { from: 400, to: 1400, vol: 0.02, dur: 0.34, q: 0.7, curve: 1.8 })
      return
    }
    repeat(3, 0.05, (i, dt) => plop(dt, 340 - i * 70, 0.04))
    strike(at(a, 0.04), { freq: 980, dur: 0.3, vol: 0.016, partials: [1, 2.9] })
  },

  /* A CRT. Square waves, a capacitor whine, and the degauss thump of a tube
   * coming to life — the only voice here that is deliberately electronic. */
  monitor: (a, part) => {
    if (part === 'hover') return tone(a, { freq: 2200, vol: 0.016, dur: 0.035, type: 'square', lp: 5000 })
    if (part === 'press') {
      tone(a, { freq: 1200, to: 1900, vol: 0.035, dur: 0.06, type: 'square', lp: 4000 })
      return
    }
    if (part === 'launch') {
      // Thump, then the line-frequency whine settling in.
      tone(a, { freq: 120, to: 48, vol: 0.075, dur: 0.22, type: 'sine' })
      tone(at(a, 0.04), { freq: 620, to: 1570, vol: 0.03, dur: 0.26, type: 'square', lp: 3400, attack: 0.03 })
      hiss(at(a, 0.02), { from: 3000, to: 9000, vol: 0.018, dur: 0.24, q: 2.2, curve: 1.6 })
      return
    }
    // Switched off: the picture collapsing to a line and away.
    tone(a, { freq: 1500, to: 220, vol: 0.035, dur: 0.2, type: 'square', lp: 2600 })
    hiss(at(a, 0.04), { from: 6000, to: 700, vol: 0.02, dur: 0.2, q: 1.6, curve: 2.4 })
  },

  /* A laminated badge on a lanyard. Felt-soft: a damped woodblock and the tap of
   * card on card. Nothing bright — this is the quietest voice in the system. */
  about: (a, part) => {
    if (part === 'hover') return tone(a, { freq: 420, vol: 0.02, dur: 0.05, type: 'triangle', lp: 1400 })
    if (part === 'press') {
      tone(a, { freq: 330, to: 300, vol: 0.05, dur: 0.1, type: 'triangle', lp: 1200 })
      hiss(a, { from: 1600, to: 700, vol: 0.03, dur: 0.05, q: 1.2, curve: 4 })
      return
    }
    if (part === 'launch') {
      tone(a, { freq: 392, vol: 0.045, dur: 0.24, type: 'triangle', lp: 1600 })
      tone(at(a, 0.09), { freq: 587, vol: 0.035, dur: 0.3, type: 'triangle', lp: 1800 })
      // The metal clip, once, well behind the card.
      strike(at(a, 0.06), { freq: 2100, dur: 0.22, vol: 0.01, partials: [1, 3.4] })
      return
    }
    tone(a, { freq: 392, to: 294, vol: 0.04, dur: 0.18, type: 'triangle', lp: 1200 })
  },

  /* Paper and wax. The flutter is noise with no pitch at all; the seal is a
   * soft, dead thump with no ring in it, because wax does not ring. */
  contact: (a, part) => {
    if (part === 'hover') return hiss(a, { from: 4200, to: 2400, vol: 0.028, dur: 0.06, q: 0.7, curve: 4 })
    if (part === 'press') {
      hiss(a, { from: 3800, to: 1400, vol: 0.07, dur: 0.11, q: 0.6, curve: 3 })
      tone(a, { freq: 140, to: 96, vol: 0.055, dur: 0.1, type: 'sine', lp: 400 })
      return
    }
    if (part === 'launch') {
      // The flap lifting, then the seal breaking.
      hiss(a, { from: 1200, to: 3600, vol: 0.05, dur: 0.22, q: 0.5, curve: 2, attack: 0.03 })
      hiss(at(a, 0.16), { from: 2600, to: 800, vol: 0.055, dur: 0.14, q: 0.8, curve: 3 })
      tone(at(a, 0.16), { freq: 165, to: 110, vol: 0.06, dur: 0.16, type: 'sine', lp: 500 })
      return
    }
    hiss(a, { from: 3200, to: 900, vol: 0.055, dur: 0.16, q: 0.6, curve: 2.6 })
    tone(at(a, 0.08), { freq: 130, to: 88, vol: 0.05, dur: 0.12, type: 'sine', lp: 400 })
  },

  /* A mechanical keyswitch. The whole sound is in the ratio: a 3 ms click of
   * very high noise for the leaf, a 40 Hz-ish thock for the keycap bottoming
   * out on the plate. Get that balance right and it is unmistakable. */
  terminal: (a, part) => {
    if (part === 'hover') return hiss(a, { from: 7000, to: 5200, vol: 0.02, dur: 0.012, q: 3, curve: 6 })
    if (part === 'press') {
      hiss(a, { from: 6400, to: 3200, vol: 0.075, dur: 0.02, q: 2.2, curve: 6 })
      tone(a, { freq: 168, to: 84, vol: 0.075, dur: 0.055, type: 'triangle', lp: 700 })
      return
    }
    if (part === 'launch') {
      // Down-stroke, then the cap springing back up a moment later.
      hiss(a, { from: 6400, to: 3000, vol: 0.08, dur: 0.022, q: 2.2, curve: 6 })
      tone(a, { freq: 180, to: 76, vol: 0.085, dur: 0.07, type: 'triangle', lp: 760 })
      hiss(at(a, 0.075), { from: 8200, to: 5000, vol: 0.045, dur: 0.016, q: 3, curve: 6 })
      tone(at(a, 0.075), { freq: 260, to: 150, vol: 0.04, dur: 0.045, type: 'triangle', lp: 1100 })
      return
    }
    hiss(a, { from: 5200, to: 2400, vol: 0.05, dur: 0.02, q: 2, curve: 6 })
    tone(a, { freq: 140, to: 70, vol: 0.06, dur: 0.06, type: 'triangle', lp: 600 })
  },

  /* A steel bin with paper in it. Inharmonic partials with a wide spread beat
   * against each other, which is exactly what thin metal does; the paper is
   * crumple noise thrown in on top. */
  bin: (a, part) => {
    if (part === 'hover') return strike(a, { freq: 1400, dur: 0.14, vol: 0.014, partials: [1, 2.3, 3.7], spread: 14 })
    if (part === 'press') {
      strike(a, { freq: 980, dur: 0.3, vol: 0.03, partials: [1, 2.31, 3.72, 5.1], spread: 18 })
      hiss(a, { from: 4200, to: 2000, vol: 0.035, dur: 0.07, q: 1.4, curve: 4 })
      return
    }
    if (part === 'launch') {
      // Paper going in, then the can ringing.
      repeat(4, 0.03, (i, dt) =>
        hiss(at(a, dt), { from: 3000 + Math.random() * 3000, to: 1600, vol: 0.04 - i * 0.007, dur: 0.05, q: 1.8, curve: 5 }),
      )
      strike(at(a, 0.09), { freq: 760, dur: 0.75, vol: 0.035, partials: [1, 2.31, 3.72, 5.11, 6.9], spread: 22 })
      return
    }
    strike(a, { freq: 620, dur: 0.4, vol: 0.03, partials: [1, 2.31, 3.72], spread: 20 })
    hiss(a, { from: 2600, to: 900, vol: 0.03, dur: 0.1, q: 1.2, curve: 3 })
  },
}

/* ------------------------------------------------------------------- api */

/**
 * Play an application's own voice.
 *
 * `hover` is rate-limited per app: the pointer crossing a dock at speed should
 * brush the icons, not fire nine sounds in one frame.
 */
export function appSfx(id: AppId, part: Part): void {
  const a = audio()
  if (!a) return
  const key = `${id}:${part}`
  const now = a.ac.currentTime
  const gap = part === 'hover' ? 0.09 : 0.04
  if ((lastAt.get(key) ?? -1) > now - gap) return
  lastAt.set(key, now)
  try {
    VOICES[id]?.(a, part)
  } catch {
    /* an icon is not worth an exception */
  }
}

/** The chrome's own sounds — windows, menus, the dock. Shared by every app. */
export type Ui = 'tick' | 'minimize' | 'restore' | 'maximize' | 'menu' | 'boot'

export function sfx(kind: Ui): void {
  const a = audio()
  if (!a) return
  const now = a.ac.currentTime
  if ((lastAt.get(kind) ?? -1) > now - 0.03) return
  lastAt.set(kind, now)
  try {
    if (kind === 'tick') hiss(a, { from: 5200, to: 4200, vol: 0.012, dur: 0.012, q: 3, curve: 6 })
    if (kind === 'minimize') {
      // Down and away, matching the genie curve the window takes.
      tone(a, { freq: 760, to: 150, vol: 0.05, dur: 0.34, type: 'sine', attack: 0.01 })
      hiss(a, { from: 2200, to: 400, vol: 0.022, dur: 0.32, q: 0.9, curve: 2 })
    }
    if (kind === 'restore') {
      tone(a, { freq: 180, to: 820, vol: 0.05, dur: 0.28, type: 'sine', attack: 0.012 })
      hiss(a, { from: 500, to: 2400, vol: 0.022, dur: 0.26, q: 0.9, curve: 2 })
    }
    if (kind === 'maximize') hiss(a, { from: 700, to: 2600, vol: 0.03, dur: 0.16, q: 0.8, curve: 2.4 })
    if (kind === 'menu') hiss(a, { from: 3600, to: 2600, vol: 0.016, dur: 0.02, q: 2.4, curve: 5 })
    if (kind === 'boot') {
      // The one flourish in the system, and it plays exactly once per session.
      ;[1, 1.25, 1.5, 2].forEach((m, i) =>
        fm(at(a, i * 0.055), { freq: 440 * m, ratio: 2.41, index: 2.2, vol: 0.038, dur: 1.1 - i * 0.12, decay: 0.2 }),
      )
      tone(a, { freq: 110, to: 55, vol: 0.06, dur: 0.6, type: 'sine', attack: 0.04 })
    }
  } catch {
    /* ignored by design */
  }
}
