import * as THREE from 'three'
import type { AppId } from '@/os/types'

/**
 * The icons, as objects.
 *
 * Nine small physical things, modelled, lit on a studio set and photographed in
 * the browser into a short turntable each. Nothing here ships as an image: the
 * whole set is about eleven kilobytes of geometry code, against roughly two
 * megabytes for the same nine icons pre-rendered at every size a retina dock
 * asks for.
 *
 * Two rules hold the set together, and they are the reason it reads as one
 * family rather than nine clip-art objects:
 *
 *   1. **One set, one camera.** Every object is framed by the same 26° lens at
 *      the same distance, scaled to the same 2.2-unit box, and lit by the same
 *      four panels. That shared light is what makes a folder and a keycap look
 *      like they were photographed on the same afternoon.
 *   2. **Every object moves the way its material would.** The hover loop is not
 *      a turntable bolted to all nine — the folder opens, the cone wobbles on
 *      its rubber base, the keycap is pressed, the flask's bubbles rise. Each
 *      one is the visual half of that application's voice in `sfx.ts`.
 *
 * Runs once per session, off the critical path, behind the flat SVG icons —
 * `AppIcon3D` shows those until the frames land, so nothing waits on WebGL and
 * a machine without it never knows this file exists.
 */

/* ------------------------------------------------------------- shop tools */

const std = (o: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(o)
const phys = (o: THREE.MeshPhysicalMaterialParameters) => new THREE.MeshPhysicalMaterial(o)

const mesh = (g: THREE.BufferGeometry, m: THREE.Material, name = '') => {
  const x = new THREE.Mesh(g, m)
  x.name = name
  x.castShadow = true
  x.receiveShadow = true
  return x
}

/** A rounded rectangle as a 2D profile, for extruding into slabs and cards. */
function rrShape(w: number, h: number, r: number) {
  const s = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r)
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r)
  s.quadraticCurveTo(x, y, x + r, y)
  return s
}

/**
 * Extrude a profile with a bevel on both faces. The bevel is the entire reason
 * these read as manufactured objects: a hard 90° edge catches no light, and at
 * 54px an unbevelled slab is a flat rectangle no matter how it is lit.
 */
function ext(shape: THREE.Shape, depth: number, bevel = 0.02) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.001, depth - 2 * bevel),
    bevelEnabled: bevel > 0,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 4,
    curveSegments: 16,
  })
  g.center()
  g.computeVertexNormals()
  return g
}

const slab = (w: number, h: number, d: number, r = 0.06, b = 0.02) => ext(rrShape(w, h, r), d, b)

const lathe = (pts: [number, number][], seg = 64) =>
  new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg)

/** Wrap a group so it can be positioned without disturbing the auto-framing. */
function frame(g: THREE.Object3D, rot: [number, number, number] = [0, 0, 0], y = 0) {
  g.position.y += y
  const w = new THREE.Group()
  w.add(g)
  w.rotation.set(...rot)
  return w
}

/** Smooth 0→1→0 over the loop, so a hover that is cut short never snaps back. */
const swell = (u: number) => 0.5 - 0.5 * Math.cos(u * Math.PI * 2)
const wave = (u: number, cycles = 1) => Math.sin(u * Math.PI * 2 * cycles)

interface Model {
  object: THREE.Object3D
  /** `u` runs 0→1 across the hover loop and must return to rest at both ends. */
  animate?: (u: number) => void
}

/* ------------------------------------------------------------ the objects */

const BUILD: Record<AppId, () => Model> = {
  /**
   * A card folder with work in it. The front panel is hinged: on hover it tips
   * open and the sheets inside lift and fan, which is the folder's whole idea in
   * one movement.
   */
  projects() {
    const g = new THREE.Group()
    const teal = std({ color: 0x3fae86, roughness: 0.42 })
    const tealDark = std({ color: 0x2c8365, roughness: 0.52 })
    const brass = std({ color: 0xe0c489, metalness: 0.9, roughness: 0.3 })

    // Back panel, cut with the tab every folder has.
    const back = new THREE.Shape()
    back.moveTo(-0.82, -0.56)
    back.lineTo(0.82, -0.56)
    back.lineTo(0.82, 0.46)
    back.lineTo(-0.1, 0.46)
    back.lineTo(-0.22, 0.62)
    back.lineTo(-0.82, 0.62)
    back.closePath()
    g.add(mesh(ext(back, 0.06, 0.02), tealDark, 'back'))

    // Three sheets, warmest at the bottom, each on its own hinge.
    const sheets = [0xf7f4ed, 0xf2eee4, 0xeae5d8].map((c, i) => {
      const paper = std({ color: c, roughness: 0.88 })
      const s = mesh(slab(1.36 - i * 0.04, 0.94, 0.012, 0.02, 0.004), paper, 'sheet' + i)
      s.position.set(-0.02 + i * 0.03, 0.04 + i * 0.02, 0.05 + i * 0.022)
      s.rotation.z = (i - 1) * 0.045
      g.add(s)
      // One ruled line per sheet, so the paper is legibly paper at 54px.
      const rule = mesh(slab(0.62, 0.045, 0.006, 0.02, 0.002), std({ color: 0xc9c2b2, roughness: 0.9 }))
      rule.position.set(-0.24, 0.24, 0.012)
      s.add(rule)
      return s
    })

    // Front panel, hinged along its bottom edge.
    const hinge = new THREE.Group()
    hinge.position.set(0, -0.56, 0.16)
    const front = mesh(slab(1.66, 0.96, 0.06, 0.05, 0.022), teal, 'front')
    front.position.y = 0.48
    hinge.add(front)
    const plate = mesh(slab(0.44, 0.15, 0.02, 0.03, 0.008), brass, 'plate')
    plate.position.set(0, -0.06, 0.04)
    front.add(plate)
    g.add(hinge)

    g.rotation.set(-0.34, 0.5, 0)
    return {
      object: g,
      animate: (u) => {
        const s = swell(u)
        hinge.rotation.x = -0.14 - s * 0.42
        sheets.forEach((sh, i) => {
          sh.position.y = 0.04 + i * 0.02 + s * (0.06 + i * 0.05)
          sh.rotation.z = (i - 1) * 0.045 + s * (i - 1) * 0.12
        })
      },
    }
  },

  /**
   * A traffic cone, knocked and rocking. Soft PVC over a heavy rubber base, with
   * two retroreflective bands that are very slightly self-lit — the way the real
   * tape looks when a headlight is anywhere near it.
   */
  failures() {
    const rock = new THREE.Group()
    const cone = new THREE.Group()
    const pvc = std({ color: 0xff5a2a, roughness: 0.46 })
    const rubber = std({ color: 0x2a2c30, roughness: 0.86 })
    const tape = std({ color: 0xf6f6f2, roughness: 0.28, metalness: 0.06, emissive: 0x2a2a28, emissiveIntensity: 0.35 })

    const base = mesh(slab(1.08, 1.08, 0.12, 0.16, 0.035), rubber, 'base')
    base.rotation.x = -Math.PI / 2
    base.position.y = 0.06
    cone.add(base)

    // The body tapers to a small crown with a real hole in the top.
    const radius = (y: number) => 0.4 - (y - 0.12) * 0.255
    cone.add(
      mesh(
        lathe([
          [0.055, 1.4],
          [0.075, 1.4],
          [0.085, 1.36],
          [radius(0.15), 0.15],
          [radius(0.15) + 0.02, 0.135],
          [0.42, 0.135],
          [0.42, 0.155],
          [0, 0.155],
        ]),
        pvc,
        'body',
      ),
    )
    ;([
      [0.48, 0.68],
      [0.9, 1.04],
    ] as [number, number][]).forEach(([a, b], i) =>
      cone.add(mesh(lathe([[radius(a) + 0.008, a], [radius(b) + 0.008, b]]), tape, 'band' + i)),
    )

    rock.add(cone)
    return {
      object: frame(rock, [0.1, 0.55, 0], -0.72),
      animate: (u) => {
        // Pivoting about the base rim, not the centre — a cone tips, it does not spin.
        cone.rotation.z = wave(u, 1) * 0.09
        cone.rotation.x = wave(u + 0.25, 1) * 0.05
        cone.position.x = -wave(u, 1) * 0.06
      },
    }
  },

  /**
   * A cut crystal on a slate plinth. The shards are flat-shaded so every facet
   * takes the light separately, and there is an emissive core inside the largest
   * one that breathes through the loop — the light is coming from the stone.
   */
  skills() {
    const g = new THREE.Group()
    const gem = phys({
      color: 0x7d6cff,
      roughness: 0.06,
      metalness: 0.12,
      clearcoat: 1,
      flatShading: true,
      iridescence: 0.85,
      iridescenceIOR: 1.7,
      envMapIntensity: 2,
      emissive: 0x2a1a80,
      emissiveIntensity: 0.28,
    })
    const core = std({ color: 0xd9d2ff, emissive: 0x8f7dff, emissiveIntensity: 2.6 })
    const slate = std({ color: 0x262a33, roughness: 0.62, metalness: 0.15 })

    const plinth = mesh(new THREE.CylinderGeometry(0.56, 0.62, 0.12, 6), slate, 'plinth')
    plinth.position.y = -0.74
    plinth.rotation.y = 0.4
    g.add(plinth)

    const shards = ([
      [0.5, 1.75, 0, -0.06, 0, 0.4, 0],
      [0.3, 1.6, 0.56, -0.44, 0.16, 0.8, -0.34],
      [0.22, 1.5, -0.48, -0.56, 0.2, 0.2, 0.42],
    ] as number[][]).map(([r, sy, x, y, z, ry, rz], i) => {
      const s = mesh(new THREE.OctahedronGeometry(r, 0), gem, 'shard' + i)
      s.scale.set(1, sy, 1)
      s.position.set(x, y, z)
      s.rotation.set(i === 2 ? 0.2 : 0, ry, rz)
      g.add(s)
      return s
    })

    const glow = mesh(new THREE.SphereGeometry(0.14, 16, 12), core, 'core')
    glow.castShadow = false
    glow.position.set(0, -0.06, 0)
    g.add(glow)

    return {
      object: g,
      animate: (u) => {
        const s = swell(u)
        shards.forEach((sh, i) => {
          sh.rotation.z = (i === 1 ? -0.34 : i === 2 ? 0.42 : 0) + wave(u, 1) * 0.04 * (i + 1)
        })
        glow.scale.setScalar(0.85 + s * 0.5)
        ;(glow.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.8 + s * 2.2
        g.rotation.y = wave(u, 1) * 0.12
      },
    }
  },

  /**
   * An Erlenmeyer flask, rebuilt. The glass is a real wall — an outer skin and
   * an inner one, so the rim has thickness and the silhouette refracts instead of
   * looking like a coloured decal. The liquid has its own flat surface disc (a
   * meniscus, not a dome) and the bubbles rise and shrink across the loop.
   */
  experiments() {
    const g = new THREE.Group()
    const glass = phys({
      color: 0xe6f3ff,
      roughness: 0.02,
      metalness: 0,
      transmission: 0.92,
      thickness: 0.35,
      ior: 1.5,
      transparent: true,
      opacity: 0.42,
      clearcoat: 1,
      envMapIntensity: 2.4,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    const liquid = phys({
      color: 0xffa51f,
      roughness: 0.1,
      clearcoat: 1,
      transmission: 0.35,
      thickness: 0.4,
      ior: 1.36,
      emissive: 0x8a4a00,
      emissiveIntensity: 0.45,
    })
    // One material per bubble: they fade independently as they surface, and a
    // shared material would give all four the last one's opacity.
    const bubbleMat = () =>
      std({ color: 0xfff1d4, roughness: 0.15, emissive: 0xffc46a, emissiveIntensity: 0.8, transparent: true, opacity: 0.85 })

    // Outer wall, up the cone and the neck to a flared lip; inner wall back down.
    const outer: [number, number][] = [
      [0, 0],
      [0.5, 0],
      [0.56, 0.05],
      [0.58, 0.13],
      [0.5, 0.36],
      [0.19, 0.92],
      [0.145, 1.04],
      [0.145, 1.3],
      [0.185, 1.38],
      [0.185, 1.42],
    ]
    const inner: [number, number][] = [
      [0.15, 1.42],
      [0.115, 1.36],
      [0.115, 1.05],
      [0.16, 0.92],
      [0.47, 0.35],
      [0.53, 0.13],
      [0.51, 0.05],
      [0.46, 0.035],
      [0, 0.035],
    ]
    const wall = mesh(lathe([...outer, ...inner]), glass, 'glass')
    wall.castShadow = false
    g.add(wall)

    const fluid = mesh(
      lathe([
        [0, 0.05],
        [0.44, 0.05],
        [0.5, 0.1],
        [0.51, 0.14],
        [0.42, 0.42],
        [0, 0.42],
      ]),
      liquid,
      'liquid',
    )
    g.add(fluid)

    // A paper label, because every flask on every bench has one.
    const label = mesh(lathe([[0.355, 0.55], [0.3, 0.72]], 48), std({ color: 0xf3efe2, roughness: 0.9, side: THREE.DoubleSide }), 'label')
    g.add(label)

    const cork = mesh(new THREE.CylinderGeometry(0.155, 0.125, 0.22, 32), std({ color: 0xa2744a, roughness: 0.92 }), 'cork')
    cork.position.y = 1.46
    g.add(cork)
    const lip = mesh(new THREE.CylinderGeometry(0.175, 0.175, 0.05, 32), std({ color: 0x8e6440, roughness: 0.9 }), 'cork_lip')
    lip.position.y = 1.56
    g.add(lip)

    const bubbles = ([
      [0.14, 0.055],
      [-0.1, 0.04],
      [0.02, 0.03],
      [0.2, 0.035],
    ] as [number, number][]).map(([x, r], i) => {
      const b = mesh(new THREE.SphereGeometry(r, 14, 10), bubbleMat(), 'bubble' + i)
      b.castShadow = false
      b.position.set(x, 0.1, 0.02 * (i % 2 ? 1 : -1))
      g.add(b)
      return { m: b, r, x, phase: i / 4 }
    })

    return {
      object: frame(g, [0.12, 0, -0.07], -0.74),
      animate: (u) => {
        bubbles.forEach(({ m, r, x, phase }) => {
          // Each bubble runs its own loop through the liquid and pops at the top.
          const p = (u + phase) % 1
          m.position.y = 0.08 + p * 0.3
          m.position.x = x + Math.sin(p * 7) * 0.02
          m.scale.setScalar(Math.max(0.12, (1 - p * 0.55) * (1 + p * 0.5)))
          ;(m.material as THREE.MeshStandardMaterial).opacity = 0.85 * (1 - p * p)
        })
        ;(fluid.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 0.35 + swell(u) * 0.35
        g.rotation.z = -0.07 + wave(u, 1) * 0.05
      },
    }
  },

  /**
   * A CRT. The front glass is bulged rather than flat, which is most of what
   * separates a tube from a flat panel at icon size, and the trace on it sweeps
   * left to right across the loop the way a real scope does.
   */
  monitor() {
    const g = new THREE.Group()
    const shell = std({ color: 0x3a8db0, roughness: 0.42 })
    const shellDark = std({ color: 0x2c6d8a, roughness: 0.5 })
    const tube = phys({ color: 0x08120f, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 })
    const trace = std({ color: 0x7dffb0, emissive: 0x4dff99, emissiveIntensity: 2.6 })

    g.add(mesh(slab(1.62, 1.14, 0.42, 0.15, 0.055), shell, 'case'))
    // Bezel groove, then the glass sitting in it.
    const bezel = mesh(slab(1.4, 0.92, 0.06, 0.1, 0.02), shellDark, 'bezel')
    bezel.position.z = 0.19
    g.add(bezel)

    const glassGeo = new THREE.PlaneGeometry(1.3, 0.82, 24, 18)
    const gp = glassGeo.attributes.position
    for (let i = 0; i < gp.count; i++) {
      const x = gp.getX(i) / 0.65
      const y = gp.getY(i) / 0.41
      gp.setZ(i, (1 - x * x * 0.5) * (1 - y * y * 0.5) * 0.06)
    }
    glassGeo.computeVertexNormals()
    const glass = mesh(glassGeo, tube, 'glass')
    glass.position.z = 0.22
    g.add(glass)

    // Vent slots across the top of the case.
    for (let i = 0; i < 7; i++) {
      const v = mesh(slab(0.17, 0.035, 0.02, 0.016, 0.006), shellDark, 'vent' + i)
      v.position.set(-0.51 + i * 0.17, 0.5, 0.2)
      g.add(v)
    }
    const led = mesh(new THREE.SphereGeometry(0.035, 12, 10), std({ color: 0x7dffb0, emissive: 0x4dff99, emissiveIntensity: 3 }), 'led')
    led.castShadow = false
    led.position.set(0.58, -0.44, 0.19)
    g.add(led)

    const pulse = mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(
          ([[-0.54, 0], [-0.26, 0], [-0.15, 0.24], [-0.02, -0.26], [0.1, 0.15], [0.19, 0], [0.54, 0]] as [number, number][]).map(
            // Riding just proud of the bulged glass, curving with it: phosphor
            // is on the inside of the tube, not floating in front of it.
            ([x, y]) => new THREE.Vector3(x, y, 0.3 - x * x * 0.1),
          ),
          false,
          'catmullrom',
          0.05,
        ),
        90,
        0.021,
        8,
      ),
      trace,
      'pulse',
    )
    pulse.castShadow = false
    g.add(pulse)

    // A bright dot riding the trace, so the screen is clearly live.
    const dot = mesh(new THREE.SphereGeometry(0.045, 12, 10), trace, 'dot')
    dot.castShadow = false
    g.add(dot)

    const neck = mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.32, 32), shellDark, 'neck')
    neck.position.y = -0.72
    g.add(neck)
    const foot = mesh(new THREE.CylinderGeometry(0.44, 0.48, 0.07, 48), shell, 'foot')
    foot.position.y = -0.88
    g.add(foot)

    const path = [-0.54, -0.26, -0.15, -0.02, 0.1, 0.19, 0.54]
    const height = [0, 0, 0.24, -0.26, 0.15, 0, 0]
    return {
      object: g,
      animate: (u) => {
        // Linear sweep, wrapped — a scope trace does not ease.
        const t = u * (path.length - 1)
        const i = Math.min(path.length - 2, Math.floor(t))
        const k = t - i
        const x = path[i] + (path[i + 1] - path[i]) * k
        dot.position.set(x, height[i] + (height[i + 1] - height[i]) * k, 0.31 - x * x * 0.1)
        ;(led.material as THREE.MeshStandardMaterial).emissiveIntensity = 2 + swell(u) * 2
        g.rotation.set(-0.12, -0.45 + wave(u, 1) * 0.16, 0)
      },
    }
  },

  /**
   * An access badge on a clip. It swings from the clip rather than turning on the
   * spot, because that is the only way a card hanging off a lanyard ever moves,
   * and the tell is worth more than another turntable.
   */
  about() {
    const swing = new THREE.Group()
    const g = new THREE.Group()
    const card = std({ color: 0xf6f3ee, roughness: 0.52 })
    const accent = std({ color: 0x8a67c4, roughness: 0.44 })
    const ink = std({ color: 0xb8b2c2, roughness: 0.72 })
    const steel = std({ color: 0xd6d9dc, metalness: 1, roughness: 0.26 })

    g.add(mesh(slab(1.02, 1.42, 0.055, 0.1, 0.022), card, 'card'))
    const band = mesh(slab(1.02, 0.34, 0.058, 0.1, 0.022), accent, 'band')
    band.position.y = 0.53
    g.add(band)
    // Two hairlines of "text" on the band, which reads as a printed header.
    ;([[0.58, 0.46], [0.5, 0.3]] as [number, number][]).forEach(([y, w], i) => {
      const l = mesh(slab(w, 0.05, 0.018, 0.02, 0.006), std({ color: 0xe6dcf6, roughness: 0.7 }), 'head' + i)
      l.position.set(-0.2 + (1 - w) * 0.1, y, 0.035)
      g.add(l)
    })

    // A head and shoulders, not a disc: the silhouette has to say "person".
    const av = mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.022, 48), std({ color: 0xe9e3f4, roughness: 0.7 }), 'avatar_bg')
    av.rotation.x = Math.PI / 2
    av.position.set(0, 0.11, 0.032)
    g.add(av)
    const head = mesh(new THREE.SphereGeometry(0.1, 20, 16), accent, 'head')
    head.position.set(0, 0.17, 0.05)
    g.add(head)
    const body = mesh(new THREE.SphereGeometry(0.16, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2), accent, 'shoulders')
    body.position.set(0, 0.0, 0.05)
    g.add(body)
    ;([[-0.27, 0.5], [-0.38, 0.34], [-0.48, 0.42]] as [number, number][]).forEach(([y, w], i) => {
      const l = mesh(slab(w, 0.065, 0.02, 0.03, 0.006), ink, 'line' + i)
      l.position.set(-0.5 + w / 2 + 0.24, y, 0.032)
      g.add(l)
    })

    const clip = mesh(slab(0.3, 0.16, 0.09, 0.045, 0.022), steel, 'clip')
    clip.position.set(0, 0.76, 0.02)
    g.add(clip)
    const ring = mesh(new THREE.TorusGeometry(0.095, 0.024, 16, 40), steel, 'ring')
    ring.position.set(0, 0.9, 0.02)
    g.add(ring)

    // Hang the card off the ring so the pivot is where the metal is.
    g.position.y = -0.9
    swing.add(g)
    swing.position.y = 0.9

    return {
      object: frame(swing, [-0.08, 0.42, 0]),
      animate: (u) => {
        swing.rotation.z = wave(u, 1) * 0.1
        swing.rotation.y = wave(u + 0.12, 1) * 0.28
      },
    }
  },

  /**
   * A sealed letter, rebuilt. The back flap is a folded panel on a real hinge at
   * the top edge rather than a triangle stuck to the front, so on hover it lifts
   * and the letter inside slides out — which is the only thing an envelope icon
   * has to communicate.
   */
  contact() {
    const g = new THREE.Group()
    const paper = std({ color: 0xf5f1e7, roughness: 0.82 })
    const paperBack = std({ color: 0xe2d9c4, roughness: 0.84 })
    const letter = std({ color: 0xfdfcf7, roughness: 0.88 })
    const wax = phys({ color: 0x3475ab, roughness: 0.34, clearcoat: 0.7, clearcoatRoughness: 0.3 })

    // The letter, behind the envelope body and above it on hover.
    const sheet = mesh(slab(1.46, 0.92, 0.02, 0.03, 0.006), letter, 'letter')
    sheet.position.set(0, 0.06, -0.02)
    ;([[0.22, 0.9], [0.06, 1.02], [-0.1, 0.72]] as [number, number][]).forEach(([y, w], i) => {
      const l = mesh(slab(w, 0.05, 0.008, 0.02, 0.002), std({ color: 0xc6bfae, roughness: 0.9 }), 'text' + i)
      l.position.set(-0.73 + w / 2 + 0.12, y, 0.012)
      sheet.add(l)
    })
    g.add(sheet)

    g.add(mesh(slab(1.72, 1.12, 0.07, 0.05, 0.024), paper, 'body'))

    // The two side folds, faint but they are what makes it an envelope and not a card.
    ;([-1, 1] as number[]).forEach((s, i) => {
      const t = new THREE.Shape()
      t.moveTo(s * 0.84, 0.54)
      t.lineTo(s * 0.84, -0.54)
      t.lineTo(s * 0.06, 0)
      t.closePath()
      const f = mesh(ext(t, 0.016, 0.005), paperBack, 'side' + i)
      f.position.set(s * 0.45, 0, 0.045)
      g.add(f)
    })
    const bottom = new THREE.Shape()
    bottom.moveTo(-0.84, -0.54)
    bottom.lineTo(0.84, -0.54)
    bottom.lineTo(0, 0.1)
    bottom.closePath()
    const bf = mesh(ext(bottom, 0.018, 0.006), paperBack, 'bottom')
    bf.position.set(0, -0.22, 0.05)
    g.add(bf)

    // No stamp: it belongs on the face, and this envelope is seen from the back,
    // where the flap and the seal are. One good seal says "letter" on its own.

    // Top flap, hinged on the envelope's top edge.
    const hinge = new THREE.Group()
    hinge.position.set(0, 0.55, 0.035)
    const flapShape = new THREE.Shape()
    flapShape.moveTo(-0.85, 0)
    flapShape.lineTo(0.85, 0)
    flapShape.lineTo(0, -0.68)
    flapShape.closePath()
    const flap = mesh(ext(flapShape, 0.022, 0.007), paperBack, 'flap')
    // ext() centres the geometry, so put the hinge edge back at the pivot.
    flap.position.set(0, -0.23, 0.02)
    hinge.add(flap)

    const seal = mesh(new THREE.CylinderGeometry(0.175, 0.185, 0.055, 40), wax, 'seal')
    seal.rotation.x = Math.PI / 2
    seal.position.set(0, -0.46, 0.035)
    flap.add(seal)
    const monogram = mesh(new THREE.TorusGeometry(0.095, 0.02, 12, 32), wax, 'seal_mark')
    monogram.position.set(0, -0.46, 0.065)
    flap.add(monogram)
    g.add(hinge)

    g.rotation.set(-0.42, 0.34, 0.1)
    return {
      object: g,
      animate: (u) => {
        const s = swell(u)
        hinge.rotation.x = s * 1.5
        sheet.position.y = 0.06 + s * 0.42
        sheet.position.z = -0.02 - s * 0.06
        sheet.rotation.z = s * 0.05
      },
    }
  },

  /**
   * A keycap, pressed. The top is dished the way a sculpted cap is, the walls
   * taper, and the legend is lit from inside — and on hover the cap travels the
   * 0.1 units a real switch does and springs back, in time with the click in
   * `sfx.ts`.
   */
  terminal() {
    const g = new THREE.Group()
    const travel = new THREE.Group()
    const plastic = std({ color: 0x2b3338, roughness: 0.58 })
    const plateMat = std({ color: 0x1a2024, roughness: 0.7, metalness: 0.25 })
    const legend = std({ color: 0x8dffb4, emissive: 0x4dff99, emissiveIntensity: 2 })

    const geo = ext(rrShape(1.22, 1.22, 0.2), 0.64, 0.1)
    geo.rotateX(-Math.PI / 2)
    geo.computeBoundingBox()
    const bb = geo.boundingBox as THREE.Box3
    const p = geo.attributes.position
    for (let i = 0; i < p.count; i++) {
      const t = (p.getY(i) - bb.min.y) / (bb.max.y - bb.min.y)
      // Taper the walls toward the top, then dish the top face itself.
      const s = 1 - 0.19 * t
      const x = p.getX(i) * s
      const z = p.getZ(i) * s + 0.05 * t
      p.setX(i, x)
      p.setZ(i, z)
      if (t > 0.97) p.setY(i, p.getY(i) - (x * x + z * z) * 0.1)
    }
    geo.computeVertexNormals()
    travel.add(mesh(geo, plastic, 'cap'))

    const top = bb.max.y + 0.006
    const bar = (w: number, x: number, z: number, ry: number, name: string) => {
      const m = mesh(new THREE.BoxGeometry(w, 0.014, 0.08), legend, name)
      m.castShadow = false
      m.position.set(x, top - (x * x + z * z) * 0.1, z)
      m.rotation.y = ry
      travel.add(m)
    }
    bar(0.27, -0.2, -0.04, -Math.PI / 4, 'chev_a')
    bar(0.27, -0.2, 0.14, Math.PI / 4, 'chev_b')
    bar(0.3, 0.16, 0.24, 0, 'under')

    // The switch housing under the cap, visible only while it is pressed.
    const stem = mesh(new THREE.BoxGeometry(0.34, 0.3, 0.34), plateMat, 'stem')
    stem.position.y = -0.36
    g.add(stem)
    const plate = mesh(slab(1.5, 1.5, 0.08, 0.08, 0.02), plateMat, 'plate')
    plate.rotation.x = -Math.PI / 2
    plate.position.y = -0.46
    g.add(plate)
    g.add(travel)

    return {
      object: frame(g, [0.6, -0.5, 0], 0.12),
      animate: (u) => {
        // Fast down, slower release — a keyswitch is not symmetric.
        const d = u < 0.3 ? u / 0.3 : Math.max(0, 1 - (u - 0.3) / 0.7)
        travel.position.y = -d * 0.11
        // Brighter at the bottom of the stroke: the legend is lit from under the
        // cap, so pressing it puts the LED closer to the surface.
        legend.emissiveIntensity = 1.7 + d * 1.6
      },
    }
  },

  /**
   * A wire waste bin with two balls of paper in it. Eighteen ribs and two rims:
   * the gaps between them are what makes it read as mesh rather than a bucket,
   * and the paper is an icosahedron pushed about by three sine waves, which is a
   * far better crumple than any amount of hand-placed facets.
   */
  bin() {
    const g = new THREE.Group()
    const steel = std({ color: 0xc4cacf, metalness: 1, roughness: 0.34, side: THREE.DoubleSide })
    const paperMat = std({ color: 0xf2efe8, roughness: 0.9, flatShading: true })

    g.add(
      mesh(
        lathe([
          [0, 0],
          [0.4, 0],
          [0.42, 0.02],
          [0.52, 1.1],
          [0.5, 1.1],
          [0.4, 0.04],
          [0, 0.04],
        ]),
        steel,
        'can',
      ),
    )
    ;([[0.04, 0.42], [1.1, 0.525], [0.58, 0.472]] as [number, number][]).forEach(([y, r], i) => {
      const t = mesh(new THREE.TorusGeometry(r, i === 2 ? 0.014 : 0.024, 12, 64), steel, 'rim' + i)
      t.rotation.x = Math.PI / 2
      t.position.y = y
      g.add(t)
    })
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2
      const rib = mesh(new THREE.CylinderGeometry(0.013, 0.013, 1.06, 6), steel, 'rib' + i)
      rib.position.set(Math.cos(a) * 0.465, 0.56, Math.sin(a) * 0.465)
      rib.rotation.set(Math.sin(a) * 0.09, 0, -Math.cos(a) * 0.09)
      g.add(rib)
    }

    const crumple = new THREE.IcosahedronGeometry(0.3, 2)
    const cp = crumple.attributes.position
    for (let i = 0; i < cp.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(cp, i)
      v.multiplyScalar(1 + Math.sin(v.x * 23) * Math.cos(v.y * 19) * Math.sin(v.z * 17) * 0.19)
      cp.setXYZ(i, v.x, v.y, v.z)
    }
    crumple.computeVertexNormals()

    const balls = ([
      [0.09, 1.07, 0.03, 1],
      [-0.2, 1.11, -0.1, 0.74],
    ] as number[][]).map(([x, y, z, s], i) => {
      const b = mesh(crumple, paperMat, 'paper' + i)
      b.scale.setScalar(s)
      b.position.set(x, y, z)
      b.rotation.set(i, i * 2, 0)
      g.add(b)
      return { m: b, y, phase: i * 0.5 }
    })

    return {
      object: frame(g, [0.28, 0, 0], -0.64),
      animate: (u) => {
        // The paper settles into the can and the whole thing turns a little.
        balls.forEach(({ m, y, phase }, i) => {
          m.position.y = y + Math.abs(wave(u + phase, 1)) * 0.07
          m.rotation.y = i * 2 + u * Math.PI * 2 * 0.4
        })
        g.rotation.y = wave(u, 1) * 0.35
      },
    }
  },
}

/* ------------------------------------------------------------- the studio */

/**
 * Four light panels in a grey box, baked into an environment map. This is the
 * whole lighting rig: a key softbox high and left, a warm fill right, a strip
 * below for a little bounce off the "table", and a cool card behind. Without an
 * environment map the metals in this set — the brass plate, the steel bin — have
 * nothing to reflect and render as flat grey.
 */
function studioEnvironment(renderer: THREE.WebGLRenderer) {
  const s = new THREE.Scene()
  s.add(
    new THREE.Mesh(
      new THREE.BoxGeometry(12, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x5a5d62, side: THREE.BackSide }),
    ),
  )
  const panel = (w: number, h: number, x: number, y: number, z: number, color: number, power: number) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(power), side: THREE.DoubleSide }),
    )
    m.position.set(x, y, z)
    m.lookAt(0, 0, 0)
    s.add(m)
  }
  panel(6, 3, -3, 4, 3, 0xffffff, 5)
  panel(3, 5, 5, 1, -1, 0xfff2e0, 2.6)
  panel(8, 1, 0, -2, 5, 0xffffff, 1.2)
  panel(4, 4, -4, 1, -4, 0xdfe8ff, 1.6)
  const pmrem = new THREE.PMREMGenerator(renderer)
  const tex = pmrem.fromScene(s, 0.03).texture
  pmrem.dispose()
  return tex
}

export type IconFrames = Record<AppId, string[]>

/**
 * Photograph the whole set.
 *
 * One WebGL context for all nine objects, released the moment it is done —
 * mounting a live three.js scene per icon would mean nine contexts on the desk
 * and another nine in the dock, which is more than most browsers will even give
 * out. The result is plain image URLs the rest of the app treats as sprites, so
 * nothing downstream knows or cares that this was 3D.
 */
export async function renderIcons({ size = 192, frames = 16 } = {}): Promise<IconFrames> {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(1)
  renderer.setSize(size, size)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.06
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  scene.environment = studioEnvironment(renderer)

  const key = new THREE.DirectionalLight(0xffffff, 1.7)
  key.position.set(-2, 5, 3)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.radius = 8
  key.shadow.bias = -0.0005
  const cam3 = key.shadow.camera
  cam3.left = -2
  cam3.right = 2
  cam3.top = 2
  cam3.bottom = -2
  cam3.near = 0.1
  cam3.far = 12
  cam3.updateProjectionMatrix()
  scene.add(key)

  // The objects sit on nothing but their own shadow. A visible ground plane
  // would put nine icons in a room; a shadow alone puts them on your desk.
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShadowMaterial({ opacity: 0.3 }))
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  const cam = new THREE.PerspectiveCamera(26, 1, 0.1, 50)
  cam.position.set(0, 1.4, 5.6)
  cam.lookAt(0, 0.02, 0)

  const canvas = renderer.domElement
  const snapshot = (): Promise<string> =>
    typeof canvas.toBlob === 'function'
      ? new Promise((resolve) =>
          canvas.toBlob((b) => resolve(b ? URL.createObjectURL(b) : canvas.toDataURL('image/png')), 'image/png'),
        )
      : Promise.resolve(canvas.toDataURL('image/png'))

  const out = {} as IconFrames

  for (const id of Object.keys(BUILD) as AppId[]) {
    const { object, animate } = BUILD[id]()
    const pivot = new THREE.Group()
    pivot.add(object)

    // Frame every object to the same box so nine different shapes come out the
    // same visual weight — the single most important step in the whole file.
    const box = new THREE.Box3().setFromObject(pivot)
    const span = box.getSize(new THREE.Vector3())
    const centre = box.getCenter(new THREE.Vector3())
    object.position.sub(centre)
    pivot.scale.setScalar(2.2 / Math.max(span.x, span.y, span.z * 0.9))

    const holder = new THREE.Group()
    holder.add(pivot)
    scene.add(holder)
    ground.position.y = new THREE.Box3().setFromObject(holder).min.y - 0.002

    const list: string[] = []
    for (let f = 0; f < frames; f++) {
      const u = f / frames
      animate?.(u)
      // A shared drift under every object's own movement, so the whole set
      // breathes together even though each one is doing its own thing.
      holder.rotation.y = wave(u, 1) * 0.22
      holder.position.y = wave(u, 2) * 0.016
      renderer.render(scene, cam)
      list.push(await snapshot())
    }
    out[id] = list

    scene.remove(holder)
    // Yield to the event loop between objects: this runs while the visitor is
    // already looking at the desk, and it must never block a click.
    await new Promise<void>((r) => {
      const c = new MessageChannel()
      c.port1.onmessage = () => r()
      c.port2.postMessage(0)
    })
  }

  renderer.dispose()
  renderer.forceContextLoss()
  return out
}
