/**
 * The desk surface.
 *
 * A single full-screen fragment shader. Domain-warped noise — fbm fed back into
 * itself twice — gives the folded, silk-like bands; the gradient the height is
 * read through carries the same teal-to-violet the rest of the system is built
 * on, so the chrome's glass tints correctly over any part of it.
 *
 * It is lit rather than merely coloured: the height field is differentiated to a
 * normal and shaded with one light, which is what stops it looking like a CSS
 * gradient with noise on top. Everything else is restraint — it drifts at about
 * a hundredth of the noise scale per second, so it is never still and never once
 * competes with a window.
 *
 * WebGL 1, on purpose: it has to run on whatever a stranger opens this on, and
 * the whole thing is under sixty lines of GLSL.
 */

const FRAG = `
precision highp float;
uniform vec2 R; uniform float T; uniform float D;

float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float n(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3. - 2. * f);
  return mix(mix(h(i), h(i + vec2(1, 0)), f.x),
             mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y);
}

float fbm(vec2 p){
  float v = 0., a = .5;
  for (int i = 0; i < 3; i++) { v += a * n(p); p = p * 2.02 + vec2(1.7, 9.2); a *= .5; }
  return v;
}

/* Two rounds of domain warping. The first bends the field, the second bends the
   bend — that second pass is what turns noise into folded cloth. */
float field(vec2 uv){
  vec2 q = vec2(fbm(uv * .55 + vec2(0., T * .015)),
                fbm(uv * .55 + vec2(5.2, 1.3) - T * .012));
  vec2 r = vec2(fbm(uv * .6 + 1.6 * q + vec2(1.7, 9.2)),
                fbm(uv * .6 + 1.6 * q + vec2(8.3, 2.8) + T * .008));
  return fbm(uv * .45 + 2. * r) * 1.15 + .18 * uv.y - .1 * uv.x
       + .05 * sin(uv.x * 2.3 + uv.y * 1.7);
}

/* Five stops, sampled by height. Light is cream through sage to violet and a
   blush at the peaks; dark is near-black through deep teal to indigo. */
vec3 pal(float t){
  vec3 a, b, c, d, e;
  if (D > .5) {
    a = vec3(.03, .05, .07); b = vec3(.06, .22, .24); c = vec3(.16, .42, .38);
    d = vec3(.28, .26, .55); e = vec3(.62, .52, .86);
  } else {
    a = vec3(.93, .94, .92); b = vec3(.58, .84, .74); c = vec3(.18, .58, .52);
    d = vec3(.40, .36, .78); e = vec3(.93, .74, .88);
  }
  t = clamp(t, 0., 1.);
  if (t < .25) return mix(a, b, t / .25);
  if (t < .5)  return mix(b, c, (t - .25) / .25);
  if (t < .75) return mix(c, d, (t - .5) / .25);
  return mix(d, e, (t - .75) / .25);
}

void main(){
  vec2 uv = gl_FragCoord.xy / R.y; uv.x += .2;
  float e = .004, f = field(uv);
  /* Finite differences on the height field give a normal for free. */
  vec3 nrm = normalize(vec3(-(field(uv + vec2(e, 0.)) - f) / e * .11,
                            -(field(uv + vec2(0., e)) - f) / e * .11, 1.));
  vec3 L = normalize(vec3(-.5, .6, .65));
  float diff = clamp(dot(nrm, L), 0., 1.);
  float spec = pow(clamp(dot(reflect(-L, nrm), vec3(0, 0, 1)), 0., 1.), 40.);
  vec3 col = pal(smoothstep(.3, .86, f));
  col *= mix(.62, 1.14, diff);
  col += spec * (D > .5 ? .22 : .35);
  vec2 c = gl_FragCoord.xy / R - .5;
  col *= 1. - dot(c, c) * (D > .5 ? .7 : .25);
  /* A grain of dither. Without it a gradient this wide bands on an 8-bit panel. */
  col += (h(gl_FragCoord.xy + T) - .5) * .025;
  gl_FragColor = vec4(col, 1.);
}`

const VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }'

export interface WallpaperHandle {
  setMode(mode: 'light' | 'dark'): void
  destroy(): void
}

const NOOP: WallpaperHandle = { setMode() {}, destroy() {} }

export function mountWallpaper(
  canvas: HTMLCanvasElement,
  opts: { mode?: 'light' | 'dark'; animate?: boolean } = {},
): WallpaperHandle {
  let gl: WebGLRenderingContext | null = null
  try {
    gl = (canvas.getContext('webgl', { antialias: false, alpha: false, depth: false }) ??
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
  } catch {
    return NOOP
  }
  // No WebGL is a normal outcome, not a failure: the CSS gradient underneath
  // this canvas is a complete wallpaper on its own, and the canvas simply
  // stays transparent.
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

  const uR = gl.getUniformLocation(prog, 'R')
  const uT = gl.getUniformLocation(prog, 'T')
  const uD = gl.getUniformLocation(prog, 'D')

  let dark = opts.mode === 'dark' ? 1 : 0
  let raf = 0
  let live = opts.animate !== false
  let dead = false
  const t0 = performance.now()

  /**
   * Three quarters of device pixel ratio, capped at 1.5. The field has no detail
   * finer than a few pixels, so rendering it at native 3× on a phone is spending
   * nine times the fill rate on something nobody can see.
   */
  const draw = (now: number) => {
    if (dead || !gl) return
    const s = Math.min(1.5, window.devicePixelRatio || 1) * 0.75
    const w = Math.max(1, Math.round(canvas.clientWidth * s))
    const h = Math.max(1, Math.round(canvas.clientHeight * s))
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }
    gl.viewport(0, 0, w, h)
    gl.uniform2f(uR, w, h)
    gl.uniform1f(uT, 8 + (now - t0) / 1000)
    gl.uniform1f(uD, dark)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    if (live) raf = requestAnimationFrame(draw)
  }

  /** Paint one frame regardless of whether the loop is running. */
  const paint = () => {
    const was = live
    live = false
    draw(performance.now())
    live = was
  }

  paint()
  if (live) raf = requestAnimationFrame(draw)

  // A backgrounded tab must not keep a fragment shader running; a restored one
  // must not come back frozen.
  const onVisibility = () => {
    if (!opts.animate) return
    if (document.hidden) {
      cancelAnimationFrame(raf)
      live = false
    } else if (!dead && !live) {
      live = true
      raf = requestAnimationFrame(draw)
    }
  }
  document.addEventListener('visibilitychange', onVisibility)

  // The window can be resized while the loop is stopped (reduced motion, or a
  // hidden tab), and a canvas that is not redrawn comes back stretched.
  const onResize = () => {
    if (!live) paint()
  }
  window.addEventListener('resize', onResize)

  return {
    setMode(mode) {
      dark = mode === 'dark' ? 1 : 0
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
