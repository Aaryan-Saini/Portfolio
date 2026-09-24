/* ============================================================================
   lib/horizonHero.ts — the imperative engine behind the "horizon" hero
   (components/sections/Hero.tsx).

   One pinned stage, three layers, one scroll-scrubbed timeline:

   · WebGL canvas — a code-drawn dusk horizon (the planet's limb seen from
     orbit, film grain, atmosphere streaks) flanked by two torn-paper photo
     "prints". Every print is bent so its rows follow the same curved horizon.
     As the visitor scrolls the prints retract to thin torn strips.
   · SVG overlay — "Introducing" rises from behind the limb on load, then the
     name rises along the horizon arc with an ink-press texture and a
     left→right sweep, clipped to the middle print.
   · HTML landing — role eyebrow + numbered contents list, placed from the
     same arc geometry.
   · Introduction (formerly the About section) — the name and contents fade
     and a short "How I earn trust." block fades in where they stood.
   · Paper — white paper under a torn edge (components/ui/TornPaperEdge),
     with the hero showing straight through above the edge, waits just below
     the stage, so at rest the hero fills the whole screen.
     Once the introduction is up it rises into view, gently accelerating;
     when the pin lets go the scroll carries it on up at the same speed and
     FeaturedProjects' paper (the same paper) follows straight behind it.

   Everything after the load intro is a pure function of scroll progress, so
   scrolling back up plays the whole sequence in reverse. Nothing is ever
   locked or collapsed once the name has landed.

   Lenis (lib/lenis.ts) drives page scroll; the engine only reads the hero's
   rect each frame and renders on demand — the rAF loop sleeps whenever the
   scene is settled or off screen.
   ========================================================================== */

import { getLenis, subscribeScroll } from "@/lib/lenis";
import { whenUnlocked } from "@/lib/gl";

export type HorizonPrint = {
  /** intrinsic pixel size of the image */
  w: number;
  h: number;
  /** 0…1 — the image row that is laid on the horizon line */
  horizon: number;
  /** 0…1 — the image column kept at the centre of the print's band */
  focusX: number;
  /** extra zoom over a plain cover fit (slack for the bend) */
  zoom?: number;
  /** print grade: 1 = untouched colour, <1 desaturates */
  saturation?: number;
};

export type HorizonConfig = {
  prints: { left: HorizonPrint; right: HorizonPrint };
  /** called whenever the paper layer moves (lets the WebGL tear redraw) */
  onPaperMove?: () => void;
};

/* ---------------------------------------------------------------- helpers */
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const seg = (v: number, a: number, b: number) => clamp((v - a) / (b - a), 0, 1);
const ease = {
  inOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: (t: number) => 1 - Math.pow(1 - t, 3),
  quint: (t: number) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2),
};
/** CSS `ease` — cubic-bezier(.25,.1,.25,1) — for the auto glide */
function cssEase(x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bez = (t: number, p1: number, p2: number) =>
    3 * (1 - t) * (1 - t) * t * p1 + 3 * (1 - t) * t * t * p2 + t * t * t;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (bez(mid, 0.25, 0.25) < x) lo = mid;
    else hi = mid;
  }
  return bez((lo + hi) / 2, 0.1, 1);
}

/* Track: the hero is 190lvh tall (stage 100lvh + 90lvh of runway). Scroll
   progress t ∈ 0…1 over that runway maps onto the scene clock f = t·F_SCALE.
   The name has fully landed by f = .62; LAND_F is where the glide stops. */
const F_SCALE = 0.904 / 1.1;
const LAND_F = 0.64;
const LAND_T = LAND_F / F_SCALE;
/* Runway, in stage heights p (the hero is 385lvh = 1 stage + 2.85 of scroll):
   the name act over p 0 … RUN_NAME, the introduction crossfading in over
   INTRO, then the paper rising in from below over PAPER. PAPER ends where the pin
   releases: the tear is at PAPER_END of the stage and moving at the same
   speed the natural scroll then carries it, so it sweeps on up without a
   hitch while FeaturedProjects (its paper continuing this paper) follows
   straight behind — no blank screen of paper in between. Under reduced
   motion the track is 200lvh and the introduction and the paper (at its end
   position) replace the landing halfway down. */
const RUN_NAME = 0.9;
const INTRO_OUT: [number, number] = [0.92, 1.08];
const INTRO_IN: [number, number] = [1.02, 1.2];
/* the about line fills word by word over this stretch (starting once the
   introduction has fully faded in), then holds to be read */
const ABOUT_FILL: [number, number] = [1.2, 1.66];
/* the introduction holds on its own for a while after the fill (reading time) */
const PAPER: [number, number] = [1.8, 2.85];
/* where the tear line sits (fraction of the stage height) as the pin lets go */
const PAPER_END = 0.45;
/* The rise curve f(t) = a·t + (1 − a)·t^m: a slow start, and a slope at t = 1
   chosen (per viewport, in paper()) so the tear's screen speed as the pin lets
   go equals what the free scroll then gives it — no hitch at the hand-off. */
const RISE_A = 0.15;
/* page background under the prints (the dusk night, a shade under --night) */
const BG: [number, number, number] = [0.071, 0.043, 0.09];

/* ---------------------------------------------------------------- shaders */
const VERT = `
attribute vec2 aPos;
uniform vec4 uQuad;
uniform vec2 uView;
void main(){
  vec2 p = mix(uQuad.xy, uQuad.zw, aPos);
  vec2 c = p / uView * 2. - 1.;
  gl_Position = vec4(c.x, -c.y, 0., 1.);
}`;

const FRAG = `
precision highp float;
uniform vec2 uView;
uniform float uDpr;
uniform float uMode;
uniform vec3 uG;
uniform float uK;
uniform float uGrain;
uniform float uSeed;
uniform float uAlpha;
uniform vec3 uSolid;
uniform sampler2D uTex;
uniform vec2 uImg;
uniform vec3 uMap;
uniform float uBend;
uniform vec2 uBand;
uniform vec3 uTearL;
uniform vec3 uTearR;
uniform vec3 uPaper;
uniform float uSat;
uniform vec2 uRes;

float h1(float n){ return fract(sin(n * 12.9898 + 4.1414) * 43758.5453); }
float h2(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float vn(float y, float span, float key, float seed){
  float t = (y + 40.) / span, i = floor(t), f = t - i;
  f = f * f * (3. - 2. * f);
  return mix(h1(i * 1.731 + key * 57.3 + seed * 11.13), h1((i + 1.) * 1.731 + key * 57.3 + seed * 11.13), f);
}
float vn2(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3. - 2. * f);
  float a = h2(i), b = h2(i + vec2(1., 0.)), c = h2(i + vec2(0., 1.)), d = h2(i + vec2(1., 1.));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p){
  float s = 0., a = .5;
  for (int i = 0; i < 4; i++){ s += a * vn2(p); p = p * 2.03 + 17.1; a *= .5; }
  return s;
}

/* dusk sky above the limb, in the site palette (berry → dawn rose → pale
   rose → mauve → lilac → plum night) — u is altitude in .55 stage heights */
vec3 sky(float u){
  vec3 c = vec3(.851, .345, .463);
  c = mix(c, vec3(.937, .518, .608), smoothstep(0., .014, u));
  c = mix(c, vec3(.969, .765, .812), smoothstep(.012, .055, u));
  c = mix(c, vec3(.847, .62, .749), smoothstep(.045, .13, u));
  c = mix(c, vec3(.604, .459, .678), smoothstep(.11, .24, u));
  c = mix(c, vec3(.435, .325, .561), smoothstep(.19, .34, u));
  c = mix(c, vec3(.259, .176, .4), smoothstep(.3, .5, u));
  c = mix(c, vec3(.157, .098, .259), smoothstep(.45, .68, u));
  c = mix(c, vec3(.094, .059, .157), smoothstep(.62, .86, u));
  c = mix(c, vec3(.063, .039, .098), smoothstep(.8, 1.2, u));
  return c;
}
/* the night side below the limb — ends on the site's dusk plum */
vec3 ground(float u){
  vec3 c = vec3(.42, .14, .24);
  c = mix(c, vec3(.16, .07, .16), smoothstep(0., .035, -u));
  c = mix(c, vec3(.11, .066, .14), smoothstep(.03, .25, -u));
  c = mix(c, vec3(.094, .058, .114), smoothstep(.25, .9, -u));
  return c;
}

/* a torn paper edge: x = image coverage, y = paper fringe, z = cast shadow */
vec3 edge(float d, float y, vec3 T){
  float yy = y / uK, sd = T.y, amp = T.x;
  float w = ((vn(yy, 240., 1., sd) - .5) * 1.8 + (vn(yy, 13., 2., sd) - .5) * .7 + (vn(yy, 1.9, 3., sd) - .5) * .35) * uK * (1. + amp * 2.2);
  float g = max(0., vn(yy, 170., 4., sd) * 2.9 - 1.1 + (vn(yy, 22., 5., sd) - .5) * .9) * uK * (.6 + amp) + .5;
  float dc = d - w;
  float im = smoothstep(-.5, .5, dc - g);
  float band = max(smoothstep(-.5, .5, dc) - im, 0.);
  float sh = dc < 0. ? exp(dc / 5.) * .34 : 0.;
  return vec3(im, band, sh);
}

vec3 grain(vec3 c, vec2 S){
  float lum = dot(c, vec3(.2126, .7152, .0722));
  float g = (h2(gl_FragCoord.xy + uSeed) * .55 + h2(floor(S * 1.1) + uSeed + 3.1) * .45) * 2. - 1.;
  return c + g * uGrain * (.07 + .09 * (1. - abs(lum - .45) * 1.6));
}

void main(){
  vec2 S = vec2(gl_FragCoord.x / uDpr, uView.y - gl_FragCoord.y / uDpr);

  if (uMode > 2.5) { gl_FragColor = vec4(texture2D(uTex, gl_FragCoord.xy / uRes).rgb * uAlpha, uAlpha); return; }
  if (uMode > 1.5) { gl_FragColor = vec4(uSolid * uAlpha, uAlpha); return; }

  if (uMode < .5) {
    vec2 d = S - uG.xy;
    float rho = length(d);
    float h = rho - uG.z;
    float Hs = uView.y * .55;
    float u = h / Hs;
    float along = atan(d.x, -d.y) * uG.z;

    vec3 s = sky(max(u, 0.));
    float glow = exp(-pow((S.x - uG.x) / (uView.x * .55), 2.));
    s *= mix(1., mix(.84, 1.08, glow), 1. - smoothstep(0., .4, u));
    s *= 1. + (fbm(vec2(along / 260., h / 16.)) - .5) * .1 * (1. - smoothstep(0., .9, u));

    vec3 gr = ground(min(u, 0.));
    gr += vec3(.018, .02, .034) * (fbm(vec2(along / 90., h / 30.)) - .45);

    vec3 c = mix(gr, s, smoothstep(-.8, .8, h));
    c *= 1. + (fbm(S / 180.) - .5) * .06;

    vec2 cell = floor(S / 2.5);
    float r = h2(cell + uSeed * 3.1);
    if (r > .99965) c = mix(c, h2(cell + 7.7) > .5 ? vec3(.95, .93, .9) : vec3(.02), .55);

    c = grain(c, S);
    c *= 1. - .22 * pow(clamp(length((S / uView - .5) * vec2(1.2, 1.)), 0., 1.), 2.2);
    gl_FragColor = vec4(clamp(c, 0., 1.) * uAlpha, uAlpha);
    return;
  }

  float dl = S.x - uBand.x, dr = uBand.y - S.x;
  vec3 eL = uTearL.z > .5 ? edge(dl, S.y, uTearL) : vec3(smoothstep(-.6, .6, dl), 0., 0.);
  vec3 eR = uTearR.z > .5 ? edge(dr, S.y + 311., uTearR) : vec3(smoothstep(-.6, .6, dr), 0., 0.);
  float img = eL.x * eR.x;
  float pap = max(eL.y * (eR.x + eR.y), eR.y * (eL.x + eL.y));
  float sh = max(eL.z * (eR.x + eR.y), eR.z * (eL.x + eL.y));
  float cov = (img + pap) * uAlpha;
  if (cov < .002 && sh * uAlpha < .002) discard;

  float dx = S.x - uG.x;
  float arcY = uG.y - sqrt(max(uG.z * uG.z - dx * dx, 0.));
  float shift = clamp(arcY - (uG.y - uG.z), -uBend, uBend);
  vec2 r = (vec2(S.x, S.y - shift) - uMap.xy) / uMap.z;
  vec3 col = texture2D(uTex, clamp(r / uImg, vec2(.0005), vec2(.9995))).rgb;
  float Y = dot(col, vec3(.2126, .7152, .0722));
  col = mix(vec3(Y), col, uSat) * .94 + .025;

  float mott = h2(floor(S * .7)) * .5 + h2(floor(S * .23)) * .5;
  vec3 paper = uPaper * (.955 + .05 * mott);
  vec3 c2 = (col * img + paper * pap) / max(img + pap, .0001);
  c2 = grain(c2, S);
  float a = clamp(cov, 0., 1.);
  float shA = clamp(sh, 0., 1.) * (1. - a) * uAlpha;
  gl_FragColor = vec4(clamp(c2, 0., 1.) * a, a + shA);
}`;

/* ---------------------------------------------------------------- engine */
type Uniforms = Record<string, WebGLUniformLocation | null>;
type Tex = { tex: WebGLTexture; w: number; h: number };
type Circle = { cx: number; cy: number; r: number };
type Rect = [number, number, number, number];

export function mountHorizonHero(root: HTMLElement, cfg: HorizonConfig): () => void {
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = <T extends Element>(sel: string) => {
    const el = root.querySelector<T>(sel);
    if (!el) throw new Error(`horizon hero: missing ${sel}`);
    return el;
  };

  const stage = $<HTMLElement>(".hz-stage");
  const ov = $<SVGSVGElement>(".hz-ov");
  const landingEl = $<HTMLElement>(".hz-landing");
  const cue = root.querySelector<HTMLButtonElement>(".hz-cue");
  const introText = $<SVGTextElement>("#hz-intro");
  const introArc = $<SVGPathElement>("#hz-intro-arc");
  const skyGrad = $<SVGRadialGradientElement>("#hz-sky-grad");
  const riseGrad = $<SVGRadialGradientElement>("#hz-rise-grad");
  const midClip = $<SVGPathElement>("#hz-mid-clip-path");
  const t1 = $<SVGTextElement>("#hz-t1");
  const t2 = $<SVGTextElement>("#hz-t2");
  const arc1 = $<SVGPathElement>("#hz-name-arc");
  const arc2 = $<SVGPathElement>("#hz-name-arc2");
  const t1Rest = $<SVGTSpanElement>("#hz-t1 .rest");
  const restText = t1Rest.textContent ?? "";
  const sweepGrads = [$<SVGLinearGradientElement>("#hz-sweep0g"), $<SVGLinearGradientElement>("#hz-sweep1g")];
  const printImgs = {
    left: $<HTMLImageElement>('img[data-hz-print="left"]'),
    right: $<HTMLImageElement>('img[data-hz-print="right"]'),
  };
  const titleGroup = $<SVGGElement>(".hz-title");
  const credoEl = root.querySelector<HTMLElement>(".hz-credo");
  const aboutWords = credoEl ? Array.from(credoEl.querySelectorAll<HTMLElement>(".hz-about .hz-w")) : [];
  const paperEl = root.querySelector<HTMLElement>(".hz-paper");
  const tearEl = root.querySelector<HTMLElement>(".hz-paper-tear");
  const fbLeft = root.querySelector<HTMLElement>(".hz-fb-left");
  const fbRight = root.querySelector<HTMLElement>(".hz-fb-right");

  let destroyed = false;
  const cleanups: Array<() => void> = [];
  const timers = new Set<number>();
  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
    return id;
  };

  /* ----------------------------------------------------------- WebGL */
  let canvas: HTMLCanvasElement | null = document.createElement("canvas");
  canvas.className = "hz-canvas";
  canvas.setAttribute("aria-hidden", "true");
  stage.insertBefore(canvas, ov);

  let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  let isGL2 = false;
  let prog: WebGLProgram | null = null;
  let buf: WebGLBuffer | null = null;
  const U: Uniforms = {};
  const texes: { left?: Tex; right?: Tex } = {};

  function initGL(): boolean {
    if (!canvas) return false;
    const opts: WebGLContextAttributes = { alpha: false, antialias: false, premultipliedAlpha: true, preserveDrawingBuffer: false };
    gl = canvas.getContext("webgl2", opts) as WebGL2RenderingContext | null;
    isGL2 = !!gl;
    if (!gl) gl = canvas.getContext("webgl", opts) as WebGLRenderingContext | null;
    if (!gl) return false;
    const g = gl;
    const sh = (type: number, src: string) => {
      const s = g.createShader(type)!;
      g.shaderSource(s, src);
      g.compileShader(s);
      return s;
    };
    prog = g.createProgram();
    if (!prog) return false;
    g.attachShader(prog, sh(g.VERTEX_SHADER, VERT));
    g.attachShader(prog, sh(g.FRAGMENT_SHADER, FRAG));
    g.linkProgram(prog);
    if (!g.getProgramParameter(prog, g.LINK_STATUS)) return false;
    g.useProgram(prog);
    const n = g.getProgramParameter(prog, g.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < n; i++) {
      const info = g.getActiveUniform(prog, i);
      if (info) U[info.name] = g.getUniformLocation(prog, info.name);
    }
    buf = g.createBuffer();
    g.bindBuffer(g.ARRAY_BUFFER, buf);
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]), g.STATIC_DRAW);
    const loc = g.getAttribLocation(prog, "aPos");
    g.enableVertexAttribArray(loc);
    g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
    g.enable(g.BLEND);
    g.blendFunc(g.ONE, g.ONE_MINUS_SRC_ALPHA);
    canvas.addEventListener("webglcontextlost", onLost);
    return true;
  }

  function onLost(e: Event) {
    e.preventDefault();
    gl = null;
    goFallback();
  }

  function upload(img: HTMLImageElement): Tex | undefined {
    if (!gl) return undefined;
    const g = gl;
    const tex = g.createTexture();
    if (!tex) return undefined;
    g.bindTexture(g.TEXTURE_2D, tex);
    g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, false);
    g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, img);
    if (isGL2) {
      g.generateMipmap(g.TEXTURE_2D);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR_MIPMAP_LINEAR);
    } else {
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR);
    }
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
    return { tex, w: img.naturalWidth, h: img.naturalHeight };
  }

  function goFallback() {
    root.classList.remove("is-gl");
    root.classList.add("is-nogl");
    if (canvas) {
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.remove();
      canvas = null;
    }
    dirty = true;
    kick();
  }

  /* ----------------------------------------------------------- geometry */
  let W = 1;
  let H = 1;
  let dpr = 1;
  const widthCache = new WeakMap<SVGTextElement, { txt: string; r: number }>();

  function measure() {
    W = stage.clientWidth || window.innerWidth;
    H = stage.clientHeight || window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas) {
      const cw = Math.round(W * dpr);
      const ch = Math.round(H * dpr);
      if (canvas.width !== cw) canvas.width = cw;
      if (canvas.height !== ch) canvas.height = ch;
    }
    ov.setAttribute("viewBox", `0 0 ${W} ${H}`);
    dirty = true;
  }

  /** The curved horizon: a huge circle. Its apex is placed so the text set
      on it sits in the vertical middle of the stage on every screen: halfway
      between the visual centres of "Introducing" (on load) and the landed
      name, so each lands within a few percent of the true middle. */
  function horizon(): Circle {
    const u = nameSize();
    const gap = W <= 760 ? 16 : 0;
    // visual centres above the apex (Cormorant: caps/ascenders ≈ .68em above
    // the baseline, descenders ≈ .2em below): the name's baseline sits
    // .24u + gap above the apex (two lines: the upper one 1.05u higher),
    // "Introducing"'s .42J above it
    const nameUp = gap + (twoLine ? 1.005 * u : 0.48 * u);
    const introUp = 0.66 * introSize();
    const apexY = clamp(H / 2 + (nameUp + introUp) / 2, 0.45 * H, 0.66 * H);
    let r = 8091.52 * Math.max(W / 2560, H / 1440);
    if (W < 1000) r = Math.min(r, W * (4.4 + 0.8 * clamp((W - 390) / 610, 0, 1)));
    return { cx: W / 2, cy: apexY + r, r };
  }

  /** cover-fit a print into `rect`, focus column centred, horizon row on the apex */
  function place(p: HorizonPrint, iw: number, ih: number, rect: Rect, apexY: number) {
    const [x0, y0, x1, y1] = rect;
    const s = Math.max((x1 - x0) / iw, (y1 - y0) / ih) * (p.zoom ?? 1.12);
    const w = iw * s;
    const h = ih * s;
    const ox = clamp((x0 + x1) / 2 - p.focusX * w, x1 - w, x0);
    const oy = clamp(apexY - p.horizon * h, y1 - h, y0);
    return { ox, oy, s, w, h };
  }

  /** text advance per 1px of font size (cached, cleared when fonts land) */
  function tw(el: SVGTextElement): number {
    const txt = el.textContent ?? "";
    const hit = widthCache.get(el);
    if (hit && hit.txt === txt) return hit.r;
    const fs = parseFloat(el.getAttribute("font-size") || "") || 16;
    let len = txt.length * fs * 0.5;
    try {
      len = el.getComputedTextLength();
    } catch {
      /* not rendered yet */
    }
    const r = len / fs;
    if (len > 0) widthCache.set(el, { txt, r });
    return r;
  }

  const arcPath = (c: Circle, e: number) =>
    `M${(c.cx - 0.8912 * e).toFixed(1)} ${(c.cy - 0.4536 * e).toFixed(1)}A${e.toFixed(1)} ${e.toFixed(1)} 0 0 1 ${(c.cx + 0.8912 * e).toFixed(1)} ${(c.cy - 0.4536 * e).toFixed(1)}`;

  /* ----------------------------------------------------------- draw */
  let hzFbo: WebGLFramebuffer | null = null;
  let hzTex: WebGLTexture | null = null;
  let hzSize = "";
  let hzKey = "";
  let hzBroken = false;

  /** render the horizon into hzTex when the size or geometry changed;
      false → caching unavailable, draw it directly instead */
  function cacheHorizon(g: WebGLRenderingContext | WebGL2RenderingContext, G: Circle): boolean {
    if (hzBroken || !canvas) return false;
    const cw = canvas.width;
    const ch = canvas.height;
    const key = `${cw}x${ch}|${G.cx.toFixed(2)}|${G.cy.toFixed(2)}|${G.r.toFixed(2)}`;
    if (key === hzKey && hzTex) return true;
    if (!hzFbo) hzFbo = g.createFramebuffer();
    if (!hzTex) hzTex = g.createTexture();
    if (!hzFbo || !hzTex) {
      hzBroken = true;
      return false;
    }
    g.bindTexture(g.TEXTURE_2D, hzTex);
    if (hzSize !== `${cw}x${ch}`) {
      g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, cw, ch, 0, g.RGBA, g.UNSIGNED_BYTE, null);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.NEAREST);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.NEAREST);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
      hzSize = `${cw}x${ch}`;
    }
    g.bindFramebuffer(g.FRAMEBUFFER, hzFbo);
    g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, hzTex, 0);
    if (g.checkFramebufferStatus(g.FRAMEBUFFER) !== g.FRAMEBUFFER_COMPLETE) {
      g.bindFramebuffer(g.FRAMEBUFFER, null);
      hzBroken = true;
      return false;
    }
    // the target texture must not stay bound while it is drawn into
    // (WebGL rejects the draw as a feedback loop)
    g.activeTexture(g.TEXTURE0);
    g.bindTexture(g.TEXTURE_2D, null);
    g.viewport(0, 0, cw, ch);
    g.clearColor(BG[0], BG[1], BG[2], 1);
    g.clear(g.COLOR_BUFFER_BIT);
    g.uniform1f(U.uMode, 0);
    g.drawArrays(g.TRIANGLES, 0, 6);
    g.bindFramebuffer(g.FRAMEBUFFER, null);
    g.viewport(0, 0, cw, ch);
    hzKey = key;
    return true;
  }

  function drawGL(G: Circle, alpha: number, xL: number, xR: number, Lw: number, Rw: number) {
    const g = gl;
    if (!g || !prog || !canvas) return;
    g.viewport(0, 0, canvas.width, canvas.height);
    g.clearColor(BG[0], BG[1], BG[2], 1);
    g.clear(g.COLOR_BUFFER_BIT);
    g.useProgram(prog);
    g.uniform2f(U.uView, W, H);
    g.uniform1f(U.uDpr, dpr);
    g.uniform1f(U.uK, (Math.max(W, 900) / 1600) * (1 + 0.5 * clamp((W - 1024) / 896, 0, 1)));
    g.uniform1f(U.uGrain, 0.55);
    g.uniform1f(U.uSeed, 17);
    g.uniform3f(U.uPaper, 0.945, 0.937, 0.918);
    g.uniform1f(U.uAlpha, 1);

    // the horizon, full bleed — it never moves with scroll, so it is drawn
    // once per size into a texture and every frame after is a plain blit
    g.uniform4f(U.uQuad, 0, 0, W, H);
    g.uniform3f(U.uG, G.cx, G.cy, G.r);
    if (cacheHorizon(g, G)) {
      g.uniform1f(U.uMode, 3);
      g.uniform2f(U.uRes, canvas.width, canvas.height);
      g.activeTexture(g.TEXTURE0);
      g.bindTexture(g.TEXTURE_2D, hzTex);
      g.uniform1i(U.uTex, 0);
    } else {
      g.uniform1f(U.uMode, 0);
    }
    g.drawArrays(g.TRIANGLES, 0, 6);

    const apexY = G.cy - G.r;
    const bend = Math.max(18, 0.035 * Math.max(W, H));
    const prints: Array<[keyof typeof texes, Rect, Rect, [number, number], [number, number, number], [number, number, number]]> = [
      ["left", [-40, 0, Lw + 60, H], [-10, 0, xL + 40, H], [-1e5, xL], [0, 0, 0], [0.62, 7, 1]],
      ["right", [W - Rw - 60, 0, W + 40, H], [xR - 40, 0, W + 10, H], [xR, 1e5], [0.6, 13, 1], [0, 0, 0]],
    ];
    g.uniform1f(U.uMode, 1);
    g.uniform1f(U.uBend, bend);
    for (const [id, cover, quad, band, tearL, tearR] of prints) {
      const t = texes[id];
      if (!t) continue;
      const pl = place(cfg.prints[id], t.w, t.h, cover, apexY);
      g.activeTexture(g.TEXTURE0);
      g.bindTexture(g.TEXTURE_2D, t.tex);
      g.uniform1i(U.uTex, 0);
      g.uniform2f(U.uImg, t.w, t.h);
      g.uniform3f(U.uMap, pl.ox, pl.oy, pl.s);
      g.uniform2f(U.uBand, band[0], band[1]);
      g.uniform3f(U.uTearL, tearL[0], tearL[1], tearL[2]);
      g.uniform3f(U.uTearR, tearR[0], tearR[1], tearR[2]);
      g.uniform1f(U.uSat, cfg.prints[id].saturation ?? 1);
      g.uniform4f(U.uQuad, quad[0], quad[1], quad[2], quad[3]);
      g.drawArrays(g.TRIANGLES, 0, 6);
    }

    // the load fade: one veil over the finished composite, so the middle
    // never shows through the prints while they come up
    if (alpha < 0.999) {
      g.uniform1f(U.uMode, 2);
      g.uniform3f(U.uSolid, BG[0], BG[1], BG[2]);
      g.uniform1f(U.uAlpha, 1 - alpha);
      g.uniform4f(U.uQuad, 0, 0, W, H);
      g.drawArrays(g.TRIANGLES, 0, 6);
    }
  }

  /** no-WebGL path: the same bands as CSS on the fallback layer */
  function drawFallback(G: Circle, alpha: number, xL: number, xR: number, Lw: number, Rw: number) {
    root.style.setProperty("--hz-hs", `${(H * 0.55).toFixed(1)}px`);
    root.style.setProperty("--hz-fb-alpha", alpha.toFixed(3));
    if (fbLeft) {
      fbLeft.style.width = `${xL.toFixed(1)}px`;
      fbLeft.style.setProperty("--hz-band", `${(Lw + 60).toFixed(1)}px`);
    }
    if (fbRight) {
      fbRight.style.width = `${(W - xR).toFixed(1)}px`;
      fbRight.style.setProperty("--hz-band", `${(Rw + 60).toFixed(1)}px`);
    }
  }

  /* DOM writes go through these: a value is only written when it changed,
     so a settled frame never dirties SVG layout or style */
  const attrs = new WeakMap<Element, Map<string, string>>();
  function setA(el: Element | null | undefined, name: string, value: string) {
    if (!el) return;
    let m = attrs.get(el);
    if (!m) attrs.set(el, (m = new Map()));
    if (m.get(name) === value) return;
    m.set(name, value);
    el.setAttribute(name, value);
  }
  function delA(el: Element, name: string) {
    attrs.get(el)?.delete(name);
    el.removeAttribute(name);
  }
  function setP(el: HTMLElement, prop: string, value: string) {
    let m = attrs.get(el);
    if (!m) attrs.set(el, (m = new Map()));
    const key = `style:${prop}`;
    if (m.get(key) === value) return;
    m.set(key, value);
    el.style.setProperty(prop, value);
  }

  /* ----------------------------------------------------------- title */
  let twoLine: boolean | null = null;
  let tsize = 60;
  let tlines = 1;

  function buildTitle() {
    const narrow = W < 600;
    if (narrow === twoLine) return;
    twoLine = narrow;
    t1Rest.textContent = narrow ? "" : restText;
    const g2 = t2.parentNode as SVGGElement;
    g2.style.display = narrow ? "" : "none";
  }

  /** the landed name's font size for this stage width (px) */
  function nameSize(): number {
    buildTitle();
    let u = clamp(0.066 * W, 34, 112);
    if (twoLine) u *= 1.75;
    const widest = Math.max(tw(t1), twoLine ? tw(t2) : 0, 0.001);
    return Math.min(u, (0.84 * W) / widest);
  }

  /** "Introducing"'s font size for this stage width (px) */
  function introSize(): number {
    const small = clamp((1000 - W) / 600, 0, 1);
    return clamp(W * (0.03 + 0.05 * small), 22, 58);
  }

  function landing(G: Circle, o: number) {
    const apexY = G.cy - G.r;
    const gap = W <= 760 ? 16 : 0;
    const u = nameSize();
    setA(t1, "font-size", u.toFixed(1));
    setA(t2, "font-size", u.toFixed(1));
    let ttop: number;
    if (twoLine) {
      const e = G.r + 0.24 * u + gap;
      setA(arc2, "d", arcPath(G, e));
      setA(arc1, "d", arcPath(G, e + 1.05 * u));
      ttop = apexY - 0.24 * u - gap - 1.05 * u - 1.37 * u;
      tlines = 2;
    } else {
      setA(arc1, "d", arcPath(G, G.r + 0.24 * u + gap));
      ttop = apexY - 0.24 * u - gap - 1.37 * u;
      tlines = 1;
    }
    tsize = u;
    setP(stage, "--apex", `${apexY.toFixed(1)}px`);
    setP(stage, "--tsize", `${u.toFixed(1)}px`);
    setP(stage, "--ttop", `${ttop.toFixed(1)}px`);
    setP(landingEl, "opacity", o.toFixed(3));
    setP(landingEl, "visibility", o > 0.01 ? "visible" : "hidden");
  }

  /* the name rises from behind the limb: a radial mask centred on the
     horizon circle lifts with it, each line slides up, and a soft
     left→right sweep inks it in. K chases the scroll target over ~.5s
     (1.5× quicker on the way back) so a fast flick still reads as a rise. */
  let riseK: number | null = null;
  function rise(G: Circle, target: number, dt: number) {
    if (riseK === null || REDUCED) riseK = target;
    else {
      const step = dt / 0.5;
      riseK = target > riseK ? Math.min(target, riseK + step) : Math.max(target, riseK - 1.5 * step);
    }
    const k = riseK;
    if (Math.abs(k - target) > 1e-4) animating = true;

    const n = tsize;
    const c = 0.55 * n;
    const lift = ease.inOut(clamp(k, 0, 1)) * (c + 0.3 * n);
    const inner = G.r - lift;
    const outer = G.r + c - lift;
    const rad = outer + 1;
    setA(riseGrad, "cx", G.cx.toFixed(1));
    setA(riseGrad, "cy", G.cy.toFixed(1));
    setA(riseGrad, "r", rad.toFixed(1));
    const stops = riseGrad.querySelectorAll("stop");
    [0, 0.35, 0.7, 1].forEach((t, i) => setA(stops[i], "offset", ((inner + (outer - inner) * t) / rad).toFixed(6)));

    [t1, t2].forEach((el, i) => {
      const delay = [0, 0.16][i];
      const a = clamp((k - delay) / (1 - delay), 0, 1);
      const drop = (i === 0 ? n * (1.08 + (tlines - 1) * 1.05) : 1.08 * n) * (1 - ease.out(a));
      setA(el.parentNode as SVGGElement, "transform", `translate(0 ${drop.toFixed(1)})`);
      setA(el, "opacity", a > 0.001 ? "1" : "0");

      // the first word trails its line by a beat
      const first = el.querySelector<SVGTSpanElement>(".stg");
      const lag = ease.out(clamp((k - 0.04 - 0.12 * i) / 0.62, 0, 1));
      if (first) {
        const dy = (1 - lag) * n * 0.28;
        setA(first, "dy", dy.toFixed(2));
        const next = first.nextElementSibling;
        if (next) setA(next, "dy", (-dy).toFixed(2));
      }

      const sweep = clamp((k - 0.04 - 0.12 * i) / 0.7, 0, 1);
      if (sweep >= 1) {
        delA(el, "mask");
        return;
      }
      let bb: DOMRect | null = null;
      try {
        bb = el.getBBox();
      } catch {
        bb = null;
      }
      if (!bb || !bb.width) return;
      const gr = sweepGrads[i];
      setA(gr, "x1", bb.x.toFixed(1));
      setA(gr, "x2", (bb.x + bb.width).toFixed(1));
      const d = 1.22 * ease.inOut(sweep) - 0.22;
      const st = gr.querySelectorAll("stop");
      setA(st[1], "offset", clamp(d, 0, 1).toFixed(4));
      setA(st[2], "offset", clamp(d + 0.22, 0, 1).toFixed(4));
      setA(el, "mask", `url(#hz-sweep${i})`);
    });
  }

  /* ----------------------------------------------------------- introduction */
  /* the short introduction fades up where the name stood — a plain fade,
     scrubbed, so it fades back out on the way up */
  function credo(k: number, p: number) {
    if (!credoEl) return;
    setP(credoEl, "opacity", k.toFixed(3));
    setP(credoEl, "transform", `translateY(${((1 - k) * 16).toFixed(1)}px)`);
    // the line below the horizon is highlighted word by word, scrubbed by
    // scroll over ABOUT_FILL (so it empties again on the way back up): each
    // word lifts from a readable ghost to full, flaring rose with a soft glow
    // as the scroll reaches it, then settling to cream (--hl peaks mid-fill)
    const n = aboutWords.length;
    const q = REDUCED ? n + 3 : seg(p, ABOUT_FILL[0], ABOUT_FILL[1]) * (n + 2);
    aboutWords.forEach((w, i) => {
      const t = clamp((q - i) / 2, 0, 1);
      const hl = REDUCED ? 0 : Math.sin(Math.PI * t);
      setP(w, "opacity", (0.3 + 0.7 * t).toFixed(3));
      setP(w, "--hl", hl.toFixed(3));
      setP(w, "transform", `translateY(${((1 - t) * 0.18).toFixed(3)}em)`);
    });
  }

  /* ----------------------------------------------------------- paper */
  /* The torn paper rides the bottom of the stage. Its tear line is placed by
     TornPaperEdge from the strip's own position on screen (the line sweeps
     through the strip as the strip crosses the viewport), so the strip top
     that puts the line at a given screen height e solves
       e = y + T − T·(n − y)/(n + T)   (T strip height, n viewport height).
     Until PAPER it waits wholly below the stage (the hero owns the screen);
     over PAPER it rises in to PAPER_END, and the released scroll carries it
     the rest of the way while FeaturedProjects' paper follows it in. */
  let paperY = NaN;
  function paper(p: number, alpha: number) {
    if (!paperEl) return;
    const T = tearEl?.offsetHeight || 320;
    const n = window.innerHeight;
    const k = T / (n + T);
    const topFor = (e: number) => (e - T + k * n) / (1 + k);
    const hidden = H + 2; // strip top just below the stage: nothing shows
    const risen = topFor(PAPER_END * H);
    // released, the strip moves 1 px per px scrolled; pinned it moves
    // (hidden − risen)·f′(t) over the phase's (P1 − P0)·H px — match at t = 1
    // (the tear line is linear in the strip top, so its speed matches too)
    const slope = ((PAPER[1] - PAPER[0]) * H) / Math.max(1, hidden - risen);
    const m = Math.max(1, (slope - RISE_A) / (1 - RISE_A));
    const t = seg(p, PAPER[0], PAPER[1]);
    const f = RISE_A * t + (1 - RISE_A) * Math.pow(t, m);
    // reduced motion: no rise — the paper stays below the stage, clear of the
    // introduction, and the next section simply follows
    const y = REDUCED ? hidden : lerp(hidden, risen, f);
    setP(paperEl, "opacity", alpha.toFixed(3));
    // (written as a negation so the first frame — paperY still NaN — writes)
    if (!(Math.abs(y - paperY) <= 0.05)) {
      paperY = y;
      setP(paperEl, "transform", `translate3d(0, ${y.toFixed(2)}px, 0)`);
      cfg.onPaperMove?.();
    }
  }

  /* ----------------------------------------------------------- scene */
  let wordsHold: number | null = null;
  let lastT: number | null = null;

  /** p = how far the hero has been scrolled, in stage heights */
  function scene(p: number, time: number, dt: number) {
    // the name act runs on the scene clock f; the introduction swaps in after
    const f = (REDUCED ? LAND_T : clamp(p / RUN_NAME, 0, 1)) * F_SCALE;
    const swap = REDUCED ? (p >= 0.5 ? 1 : 0) : 0;
    const out = REDUCED ? swap : seg(p, INTRO_OUT[0], INTRO_OUT[1]);
    const into = REDUCED ? swap : ease.out(seg(p, INTRO_IN[0], INTRO_IN[1]));
    const G = horizon();
    // the horizon, published on the hero root: the no-WebGL fallback sky is
    // drawn from it, and the boot loader (components/Preloader.tsx) splits
    // open along exactly this curve
    setP(root, "--hz-r", `${G.r.toFixed(1)}px`);
    setP(root, "--hz-apex", `${(G.cy - G.r).toFixed(1)}px`);

    // prints: fade up on load, then retract to torn strips as you scroll
    const alpha = ease.out(clamp((time - 0.15) / 1.1, 0, 1));
    const y = ease.inOut(seg(f, 0.06, 0.48));
    const small = clamp((1000 - W) / 600, 0, 1);
    const Lw = W * (0.27 - 0.1 * small);
    const Rw = W * (0.31 - 0.11 * small);
    const Lmin = W < 600 ? Math.max(18, 0.045 * W) : Math.max(28, 0.06 * W);
    const Rmin = W < 600 ? Math.max(24, 0.06 * W) : Math.max(40, 0.085 * W);
    const xL = lerp(Lw, Lmin, y);
    const xR = lerp(W - Rw, W - Rmin, y);
    setA(midClip, "d", `M${xL.toFixed(1)} ${-H}H${xR.toFixed(1)}V${2 * H}H${xL.toFixed(1)}Z`);
    if (gl) drawGL(G, alpha, xL, xR, Lw, Rw);
    else drawFallback(G, alpha, xL, xR, Lw, Rw);

    // "Introducing" — rises from behind the limb on load, lifts away on scroll
    const J = introSize();
    setA(introText, "font-size", J.toFixed(1));
    const sr = 0.28 * J;
    const skyIn = G.r - sr / 2;
    const skyOut = G.r + sr;
    setA(skyGrad, "cx", G.cx.toFixed(1));
    setA(skyGrad, "cy", G.cy.toFixed(1));
    setA(skyGrad, "r", skyOut.toFixed(1));
    const ss = skyGrad.querySelectorAll("stop");
    setA(ss[1], "offset", (skyIn / skyOut).toFixed(6));
    setA(ss[2], "offset", (G.r / skyOut).toFixed(6));
    setA(ss[3], "offset", ((G.r + sr / 2) / skyOut).toFixed(6));

    const et = clamp((time - 0.8) / 1.25, 0, 1);
    const up = et >= 1 ? 1 : 1 - Math.pow(2, -10 * et);
    const intro = ease.out(clamp(et / 0.5, 0, 1));
    const away = (riseK ?? 0) > 0.001 ? 1 : ease.inOut(seg(f, 0.06, 0.18));
    const since = Math.min(0.1, Math.max(0, time - (lastT ?? time)));
    lastT = time;
    wordsHold = wordsHold === null || away >= wordsHold ? away : Math.max(away, wordsHold - since / 0.5);
    if (wordsHold !== away) animating = true;
    const el = wordsHold;
    const er = G.r + 0.42 * J - (1 - up) * J * 1.5 + el * J * 0.55;
    // centred on the visible sky between the two prints (the left print is
    // narrower than the right, so that gap sits left of the stage centre),
    // riding the arc to that point so the word still follows the curve
    const th0 = Math.asin(clamp(((xL + xR) / 2 - G.cx) / er, -1, 1));
    const [ax, ay] = [G.cx + er * Math.sin(th0 - 0.35), G.cy - er * Math.cos(th0 - 0.35)];
    const [bx, by] = [G.cx + er * Math.sin(th0 + 0.35), G.cy - er * Math.cos(th0 + 0.35)];
    setA(introArc, "d", `M${ax.toFixed(1)} ${ay.toFixed(1)}A${er.toFixed(1)} ${er.toFixed(1)} 0 0 1 ${bx.toFixed(1)} ${by.toFixed(1)}`);
    setA(introText, "opacity", ((up > 0 ? 1 : 0) * (1 - el)).toFixed(3));

    // the name + contents give way to the introduction in the same place
    landing(G, ease.out(seg(f, 0.4, 0.62)) * (1 - out));
    rise(G, ease.quint(seg(f, 0.24, 0.58)), dt);
    setA(titleGroup, "opacity", (1 - out).toFixed(3));
    // the torn paper — rises in from below, over the hero (the introduction
    // included: the paper is opaque and simply covers it), into the next section
    credo(into, p);
    paper(p, alpha);

    if (cue) {
      const c = (1 - seg(f, 0.02, 0.08)) * intro;
      setP(cue, "opacity", c.toFixed(3));
      setP(cue, "visibility", c > 0.15 ? "" : "hidden");
    }
    if (t0 >= 0 && time < 3.4) animating = true;
  }

  /* ----------------------------------------------------------- loop */
  let raf = 0;
  let visible = true;
  let ready = false;
  let dirty = true;
  let animating = false;
  let needMeasure = true;
  let pTarget = 0;
  let pSmooth = -1;
  let lastNow = 0;
  let t0 = -1;

  /** scroll into the hero, in stage heights (0 … track − 1) */
  function progress(): number {
    const r = root.getBoundingClientRect();
    const h = H > 1 ? H : window.innerHeight;
    return clamp(-r.top, 0, Math.max(0, r.height - h)) / h;
  }

  function frame(now: number) {
    raf = 0;
    if (destroyed) return;
    const dt = Math.min(0.05, (now - lastNow) / 1000 || 0.016);
    lastNow = now;
    if (needMeasure) {
      needMeasure = false;
      measure();
    }
    pTarget = progress();
    const prev = pSmooth;
    if (pSmooth < 0 || REDUCED) pSmooth = pTarget;
    else {
      pSmooth += (pTarget - pSmooth) * (1 - Math.exp(-dt * 14));
      if (Math.abs(pTarget - pSmooth) < 5e-5) pSmooth = pTarget;
    }
    const time = t0 < 0 ? 0 : REDUCED ? 60 : (now - t0) / 1000;
    const wasAnimating = animating;
    animating = false;
    if (dirty || pSmooth !== prev || wasAnimating) {
      dirty = false;
      scene(pSmooth, time, dt);
    }
    if ((pSmooth !== pTarget || animating || dirty) && visible) raf = requestAnimationFrame(frame);
  }

  function kick() {
    if (raf || destroyed || !visible || !ready) return;
    lastNow = performance.now();
    raf = requestAnimationFrame(frame);
  }

  /* ----------------------------------------------------------- glide */
  let glideArmed = false;
  let glideDone = REDUCED;
  let glideTimer = 0;
  let gliding = false;

  const heroTop = () => root.getBoundingClientRect().top + window.scrollY;
  const atTop = () => window.scrollY <= Math.max(0, heroTop()) + window.innerHeight / 4;
  const landingY = () => {
    const r = root.getBoundingClientRect();
    return Math.round(r.top + window.scrollY + LAND_T * RUN_NAME * (H > 1 ? H : window.innerHeight));
  };

  function glide() {
    disarm();
    const to = landingY();
    if (to <= window.scrollY + 1) return;
    const lenis = getLenis();
    gliding = true;
    if (lenis) {
      lenis.scrollTo(to, { duration: 3.2, easing: cssEase, onComplete: () => (gliding = false) });
    } else {
      const from = window.scrollY;
      const start = performance.now();
      const step = (now: number) => {
        if (destroyed || !gliding) return;
        const k = Math.min(1, (now - start) / 3200);
        window.scrollTo(0, Math.round(from + (to - from) * cssEase(k)));
        if (k < 1) requestAnimationFrame(step);
        else gliding = false;
      };
      requestAnimationFrame(step);
    }
  }

  function disarm() {
    glideDone = true;
    glideArmed = false;
    if (glideTimer) {
      clearTimeout(glideTimer);
      timers.delete(glideTimer);
      glideTimer = 0;
    }
  }

  /** after 2.4s of stillness at the top of the page, glide down to the name */
  function arm() {
    if (glideDone || glideArmed || !atTop()) return;
    glideArmed = true;
    glideTimer = later(() => {
      glideTimer = 0;
      if (!glideArmed || glideDone || document.hidden) return;
      glideArmed = false;
      if (atTop()) glide();
    }, 2400);
  }

  const onInput = (e: Event) => {
    if (cue && e.target instanceof Node && cue.contains(e.target)) return;
    gliding = false;
    disarm();
  };
  if (!REDUCED) {
    for (const t of ["wheel", "touchstart", "pointerdown", "keydown"]) {
      window.addEventListener(t, onInput, { capture: true, passive: true });
      cleanups.push(() => window.removeEventListener(t, onInput, { capture: true }));
    }
  }
  if (cue) {
    const onCue = (e: Event) => {
      e.preventDefault();
      if (REDUCED) {
        window.scrollTo(0, landingY());
        return;
      }
      glide();
    };
    cue.addEventListener("click", onCue);
    cleanups.push(() => cue.removeEventListener("click", onCue));
  }

  /* ----------------------------------------------------------- wiring */
  const onScroll = () => {
    if (!gliding && !glideDone && !atTop()) disarm();
    kick();
  };
  cleanups.push(subscribeScroll(onScroll));
  const onResize = () => {
    needMeasure = true;
    dirty = true;
    kick();
  };
  window.addEventListener("resize", onResize);
  cleanups.push(() => window.removeEventListener("resize", onResize));

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting;
      if (visible) {
        dirty = true;
        kick();
      }
    });
    io.observe(root);
    cleanups.push(() => io.disconnect());
  }

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      if (destroyed) return;
      widthCache.delete(t1);
      widthCache.delete(t2);
      widthCache.delete(introText);
      dirty = true;
      kick();
    });
  }

  /* ----------------------------------------------------------- boot */
  const glOK = initGL();
  root.classList.add(glOK ? "is-gl" : "is-nogl");
  if (!glOK && canvas) {
    canvas.remove();
    canvas = null;
    gl = null;
  }
  stage.classList.add("is-loading");

  const decode = (img: HTMLImageElement) =>
    img.complete && img.naturalWidth
      ? (img.decode ? img.decode().catch(() => undefined) : Promise.resolve())
      : new Promise<void>((res) => {
          img.addEventListener("load", () => res(), { once: true });
          img.addEventListener("error", () => res(), { once: true });
        }).then(() => (img.naturalWidth && img.decode ? img.decode().catch(() => undefined) : undefined));

  const assets = Promise.all([decode(printImgs.left), decode(printImgs.right), document.fonts ? document.fonts.ready : Promise.resolve()]);
  const cap = new Promise((res) => later(() => res(null), 8000));

  Promise.race([assets, cap]).then(() => {
    if (destroyed) return;
    if (gl) {
      for (const id of ["left", "right"] as const) {
        const img = printImgs[id];
        if (img.naturalWidth) texes[id] = upload(img);
      }
    }
    measure();
    stage.classList.remove("is-loading");
    stage.classList.add("is-ready");
    ready = true;
    dirty = true;
    // the intro clock waits for the boot veil (first visit) to lift
    const cancel = whenUnlocked(() => {
      if (destroyed) return;
      t0 = performance.now();
      dirty = true;
      kick();
      arm();
    });
    cleanups.push(cancel);
    kick();
  });

  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    timers.forEach((id) => clearTimeout(id));
    timers.clear();
    cleanups.splice(0).forEach((fn) => {
      try {
        fn();
      } catch {
        /* ignore */
      }
    });
    if (gl) {
      const g = gl;
      Object.values(texes).forEach((t) => t && g.deleteTexture(t.tex));
      if (buf) g.deleteBuffer(buf);
      if (hzTex) g.deleteTexture(hzTex);
      if (hzFbo) g.deleteFramebuffer(hzFbo);
      if (prog) g.deleteProgram(prog);
      g.getExtension("WEBGL_lose_context")?.loseContext();
    }
    gl = null;
    if (canvas) {
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.remove();
      canvas = null;
    }
    t1Rest.textContent = restText;
    root.classList.remove("is-gl", "is-nogl");
    stage.classList.remove("is-loading", "is-ready");
  };
}
