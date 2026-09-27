/**
 * The lock screen's surface: a pond of silk with a name made of glass in it.
 *
 * One fragment shader. The water is the desk's own domain-warped field, run
 * brighter and a few times faster, so the lock screen is recognisably the same
 * material as the desktop it opens onto. The name is not drawn on top of it —
 * it is *in* it: the letters are rendered once into a mask (a sharp coverage
 * channel and a blurred height channel), the height is differentiated into a
 * normal, and the water behind each letter is refracted through that normal
 * and lit by one light that leans toward the pointer. So the name is only
 * visible as glass, and it moves when the water does.
 *
 * Touching the water drops a ring into it; a few fall on their own, so the
 * screen is never quite still. Unlocking melts the glass back into the pond.
 *
 * WebGL 1 like the wallpaper, and just as optional: without it, the DOM name
 * and a CSS gradient are a complete lock screen, and this canvas stays clear.
 */

const FRAG = `
precision highp float;
uniform vec2 R; uniform float T; uniform float D; uniform float U; uniform vec2 P;
uniform vec4 W[6];
uniform sampler2D M; uniform float HM;

float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3. - 2. * f);
  return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p){
  float v = 0., a = .5;
  for (int i = 0; i < 3; i++) { v += a * n(p); p = p * 2.03 + vec2(1.7, 9.2); a *= .5; }
  return v;
}
float field(vec2 uv){
  vec2 q = vec2(fbm(uv * .7 + vec2(0., T * .05)), fbm(uv * .7 + vec2(5.2, 1.3) - T * .04));
  vec2 r = vec2(fbm(uv * .8 + 1.8 * q + vec2(1.7, 9.2) + T * .025),
                fbm(uv * .8 + 1.8 * q + vec2(8.3, 2.8) - T * .02));
  return fbm(uv * .55 + 2.2 * r) + .12 * uv.y;
}
vec3 pal(float t){
  vec3 a, b, c, d, e;
  if (D > .5) {
    a = vec3(.02, .04, .06); b = vec3(.04, .2, .22); c = vec3(.12, .44, .4);
    d = vec3(.3, .27, .62); e = vec3(.78, .56, .9);
  } else {
    a = vec3(.95, .95, .92); b = vec3(.66, .88, .79); c = vec3(.27, .66, .6);
    d = vec3(.5, .45, .85); e = vec3(.97, .78, .9);
  }
  t = clamp(t, 0., 1.);
  if (t < .25) return mix(a, b, t / .25);
  if (t < .5)  return mix(b, c, (t - .25) / .25);
  if (t < .75) return mix(c, d, (t - .5) / .25);
  return mix(d, e, (t - .75) / .25);
}
vec3 scene(vec2 p){ return pal(smoothstep(.22, .92, field(p))); }

void main(){
  vec2 fc = gl_FragCoord.xy;
  vec2 uv = fc / R;
  float asp = R.x / R.y;
  vec2 p = vec2(uv.x * asp, uv.y);

  /* Rings on the water: a gaussian band riding outward from each drop,
     pushing the surface along its radius and dying as it spreads. */
  vec2 disp = vec2(0.);
  float ring = 0.;
  for (int i = 0; i < 6; i++) {
    vec4 w = W[i];
    float age = T - w.z;
    if (w.w <= 0. || age < 0. || age > 5.) continue;
    vec2 d = p - vec2(w.x * asp, w.y);
    float r = length(d);
    float k = r - age * .3;
    float env = exp(-k * k * 80.) * exp(-age * 1.05) * w.w;
    disp += d / max(r, 1e-3) * sin(k * 64.) * env * .014;
    ring += env * (.5 + .5 * sin(k * 64.));
  }
  /* A swell, so the surface is never still even with no drops in it. */
  disp += vec2(sin(p.y * 8. + T * .7), cos(p.x * 6. - T * .55)) * .0022;

  vec2 sp = p * 1.15 + vec2(.2, 0.) + disp * 1.4 - vec2(0., U * .35);
  vec3 base = scene(sp);
  vec3 col = base;

  if (HM > .5) {
    /* The mask is in canvas space, y down. The letters float: the same
       displacement that moves the water moves them. */
    vec2 t = vec2(uv.x, 1. - uv.y) + vec2(disp.x / asp, -disp.y) * .7
           + vec2(sin(uv.y * 21. + T * 1.25), cos(uv.x * 15. + T * 1.05)) * .0011;
    vec2 m = texture2D(M, t).rg;
    float a = m.r * (1. - smoothstep(0., .55, U));
    if (a > .003) {
      vec2 e = vec2(1.6 / R.x, 1.6 / R.y);
      float gx = texture2D(M, t + vec2(e.x, 0.)).g - texture2D(M, t - vec2(e.x, 0.)).g;
      float gy = texture2D(M, t + vec2(0., e.y)).g - texture2D(M, t - vec2(0., e.y)).g;
      vec3 nrm = normalize(vec3(-gx * 5.5, gy * 5.5, 1.));
      /* Through the glass: the water behind, bent by the bevel and magnified
         a little toward the middle of the letter. */
      vec2 mag = (p - vec2(.5 * asp, .5)) * .05 * m.g;
      /* Glass disperses: red bends a little less than blue, which is the
         faint coloured fringe that makes it read as glass and not as plastic. */
      vec3 tr = scene(sp + nrm.xy * .075 - mag);
      vec3 tb = scene(sp + nrm.xy * .115 - mag);
      vec3 through = vec3(tr.r, mix(tr.g, tb.g, .5), tb.b);
      vec3 L = normalize(vec3((P.x - uv.x) * asp * .9 - .25, (P.y - uv.y) * .9 + .45, .85));
      float diff = clamp(dot(nrm, L), 0., 1.);
      float spec = pow(clamp(dot(reflect(-L, nrm), vec3(0., 0., 1.)), 0., 1.), 34.);
      float fres = pow(clamp(1. - nrm.z, 0., 1.), 1.4);
      vec3 glass = D > .5 ? through * 1.5 + .1 : through * 1.02 + .14;
      glass *= .84 + diff * .32;
      glass += spec * (D > .5 ? 1.05 : 1.) + fres * (D > .5 ? .5 : .55);
      /* The lit top edge of every stroke. */
      glass += smoothstep(.15, .85, nrm.y) * (D > .5 ? .14 : .1);
      /* A faint shadow under the glass, so it sits on the water. */
      col = mix(base * (1. - .18 * m.g), glass, a);
    }
  }

  col += ring * (D > .5 ? .03 : .045);
  vec2 c = uv - .5;
  col *= 1. - dot(c, c) * (D > .5 ? .6 : .2);
  col += (h(fc + fract(T)) - .5) * .02;
  gl_FragColor = vec4(col, 1.);
}`

const VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }'

export interface LockHandle {
  setMode(mode: 'light' | 'dark'): void
  /** 0 locked, 1 gone. */
  setUnlock(p: number): void
  /** In client pixels. */
  setPointer(x: number, y: number): void
  /** Drop a ring into the water, in client pixels. */
  ripple(x: number, y: number, strength?: number): void
  /** Redraw the name, e.g. once the font has loaded or the layout moved. */
  refreshMask(): void
  destroy(): void
}

const NOOP: LockHandle = {
  setMode() {},
  setUnlock() {},
  setPointer() {},
  ripple() {},
  refreshMask() {},
  destroy() {},
}

export function mountLock(
  canvas: HTMLCanvasElement,
  opts: {
    mode: 'light' | 'dark'
    animate: boolean
    /** Draw the name into a canvas of this pixel size; null for no name. */
    drawMask: (w: number, h: number) => HTMLCanvasElement | null
    /** Called once the first frame with the name in it is on screen. */
    onLive?: () => void
  },
): LockHandle {
  let gl: WebGLRenderingContext | null = null
  try {
    gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, premultipliedAlpha: false })
  } catch {
    return NOOP
  }
  if (!gl) return NOOP

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)
    if (!s) return null
    gl.shaderSource(s, src)
    gl.compileShader(s)
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null
  }
  const vs = compile(gl.VERTEX_SHADER, VERT)
  const fs = compile(gl.FRAGMENT_SHADER, FRAG)
  if (!vs || !fs) return NOOP
  const prog = gl.createProgram()
  if (!prog) return NOOP
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return NOOP
  gl.useProgram(prog)

  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(prog, 'p')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

  const u = (name: string) => gl!.getUniformLocation(prog, name)
  const uR = u('R'), uT = u('T'), uD = u('D'), uU = u('U'), uP = u('P'), uW = u('W'), uM = u('M'), uHM = u('HM')

  const tex = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.uniform1i(uM, 0)

  let dark = opts.mode === 'dark' ? 1 : 0
  let unlock = 0
  let px = 0.5
  let py = 0.62
  let hasMask = 0
  let masked = { w: 0, h: 0 }
  let live = opts.animate
  let dead = false
  let raf = 0
  let told = false
  const t0 = performance.now()
  const now = () => 4 + (performance.now() - t0) / 1000
  const rings = new Float32Array(24)
  let next = 0

  /** The whole screen, at up to 1.5 device pixels — the letters need the edge. */
  const scale = () => Math.min(1.5, window.devicePixelRatio || 1)

  const uploadMask = (w: number, h: number) => {
    const m = opts.drawMask(w, h)
    if (!m || !gl) {
      hasMask = 0
      return
    }
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, m)
    hasMask = 1
    masked = { w, h }
  }

  const draw = () => {
    if (dead || !gl) return
    const s = scale()
    const w = Math.max(1, Math.round(canvas.clientWidth * s))
    const h = Math.max(1, Math.round(canvas.clientHeight * s))
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }
    if (masked.w !== w || masked.h !== h) uploadMask(w, h)
    gl.viewport(0, 0, w, h)
    gl.uniform2f(uR, w, h)
    gl.uniform1f(uT, now())
    gl.uniform1f(uD, dark)
    gl.uniform1f(uU, unlock)
    gl.uniform2f(uP, px, py)
    gl.uniform4fv(uW, rings)
    gl.uniform1f(uHM, hasMask)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    if (!told && hasMask) {
      told = true
      opts.onLive?.()
    }
  }

  const loop = () => {
    draw()
    if (live) raf = requestAnimationFrame(loop)
  }
  const paint = () => {
    if (!live) draw()
  }

  draw()
  if (live) raf = requestAnimationFrame(loop)

  const onVisibility = () => {
    if (!opts.animate) return
    if (document.hidden) {
      live = false
      cancelAnimationFrame(raf)
    } else if (!dead && !live) {
      live = true
      raf = requestAnimationFrame(loop)
    }
  }
  const onResize = () => paint()
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('resize', onResize)

  const toUv = (x: number, y: number) => {
    const r = canvas.getBoundingClientRect()
    return [(x - r.left) / Math.max(1, r.width), 1 - (y - r.top) / Math.max(1, r.height)]
  }

  return {
    setMode(mode) {
      dark = mode === 'dark' ? 1 : 0
      paint()
    },
    setUnlock(p) {
      unlock = Math.min(1, Math.max(0, p))
      paint()
    },
    setPointer(x, y) {
      ;[px, py] = toUv(x, y)
    },
    ripple(x, y, strength = 1) {
      if (!opts.animate) return
      const [ux, uy] = toUv(x, y)
      rings.set([ux, uy, now(), strength], next * 4)
      next = (next + 1) % 6
    },
    refreshMask() {
      masked = { w: 0, h: 0 }
      paint()
    },
    destroy() {
      dead = true
      live = false
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('resize', onResize)
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}

/**
 * The name, as the shader wants it: sharp coverage in red, a blurred copy in
 * green for the height of the glass. It is drawn from the DOM heading's own
 * layout — every `[data-word]` span at its measured box, in its computed font —
 * so the glass letters land exactly where the real, accessible text is, and
 * the page's CSS decides the size and the line breaks rather than this file.
 *
 * The blur is a shadow cast from off-canvas rather than `ctx.filter`, because
 * Safari does not implement canvas filters and does implement shadows.
 */
export function drawNameMask(heading: HTMLElement, surface: HTMLElement, w: number, h: number): HTMLCanvasElement | null {
  const words = [...heading.querySelectorAll<HTMLElement>('[data-word]')]
  if (!words.length) return null
  const box = surface.getBoundingClientRect()
  if (!box.width || !box.height) return null
  const sx = w / box.width
  const sy = h / box.height

  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, h)
  ctx.globalCompositeOperation = 'lighter'

  for (const el of words) {
    const cs = getComputedStyle(el)
    const size = parseFloat(cs.fontSize) * sy
    const r = el.getBoundingClientRect()
    ctx.font = `${cs.fontWeight} ${size}px ${cs.fontFamily}`
    const spacing = parseFloat(cs.letterSpacing)
    if ('letterSpacing' in ctx && Number.isFinite(spacing)) {
      ;(ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${spacing * sy}px`
    }
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    const text = el.textContent ?? ''
    const mt = ctx.measureText(text)
    const asc = mt.fontBoundingBoxAscent ?? size * 0.9
    const desc = mt.fontBoundingBoxDescent ?? size * 0.25
    const x = (r.left - box.left + r.width / 2) * sx
    const y = (r.top - box.top) * sy + (r.height * sy - (asc + desc)) / 2 + asc

    // Height: the letters blurred, cast as a shadow from a copy drawn off to
    // the left so only the shadow lands on the canvas.
    ctx.save()
    ctx.shadowColor = 'rgb(0,255,0)'
    ctx.shadowBlur = size * 0.085
    ctx.shadowOffsetX = w * 2
    ctx.fillStyle = 'rgb(0,255,0)'
    ctx.fillText(text, x - w * 2, y)
    ctx.restore()

    // Coverage: the letters themselves.
    ctx.fillStyle = 'rgb(255,0,0)'
    ctx.fillText(text, x, y)
  }
  return c
}
