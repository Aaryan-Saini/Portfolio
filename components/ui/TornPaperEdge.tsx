'use client';

/* ============================================================================
   TornPaperEdge — the scroll-driven torn-paper boundary from the reference
   template (Framer University's "Torn Paper" code component, as configured on
   gokuuxdesign.framer.website): a WebGL strip whose white paper ends in a
   ragged, fibrous edge. The edge is an implicit curve through 2-D fbm noise, so
   it morphs as it travels; its position is a parallax function of where the
   strip sits in the viewport (it sweeps the whole strip while the strip crosses
   the screen, i.e. it moves ~1.3× the page); scroll deltas and time feed the
   noise so the fibres evolve; a small bloom pass halos the transition fibres.

   Orientation: the original puts paper BELOW a dark section. Here the paper
   sits ABOVE the dark ledger, so the strip mounts at the TOP of the dark
   section, the vertex shader flips v_uv.y (paper at the top) and the parallax
   offset is negated — the paper is whole when the strip enters from below and
   has torn away completely by the time the strip leaves the top.

   Settings below are the reference instance's props passed through its own
   range mappers (noiseScale .1 → 2.9, noiseIntensity 1 → .5, edgeSoftness .5 →
   .105, scrollSensitivity .2 → .002/px, baseAnimationSpeed .1 → .01/s, grain
   50, movement vertical .3 / horizontal centre, bloom .2 at radius 1 → .3).

   Cost: the GL context, shader compile/link, render targets and first draw
   are deferred by lib/gl.ts (they run when the strip is within 1.5 viewports
   or in an idle slot after load — never inside React's mount flush), and the
   programs link on a background thread where KHR_parallel_shader_compile is
   available. The host's SVG fallback stays until the first real frame has
   been drawn (onReady). Frames are drawn on demand — every scroll/resize
   frame while moving, at 12 fps otherwise for the 0.01/s fibre drift. When
   the paper and transition colours are equal (both hosts today) the bloom
   mask is identically zero and the composite equals the scene, so only the
   tear pass is compiled and drawn: bit-identical output, one program instead
   of four. Uniform and attribute locations are resolved once.
   ========================================================================== */

import { useEffect, useRef, type MutableRefObject } from 'react';
import { subscribeScroll } from '@/lib/lenis';
import { linkPrograms, scheduleGlInit } from '@/lib/gl';

type RGB = [number, number, number];

export type TornPaperEdgeProps = {
  className?: string;
  /** the paper colour (below/above the tear) — sRGB 0..1 */
  paper?: RGB;
  /** colour of the fibres in the transition band */
  transition?: RGB;
  /** called once the WebGL strip is drawing (lets the host hide a fallback) */
  onReady?: () => void;
  /** which side the paper is on: 'top' = paper above the tear (dark section
      below, this site's Method boundary); 'bottom' = the reference's own
      orientation, paper below a dark section */
  paperSide?: 'top' | 'bottom';
  /** filled with a "redraw next frame" callback once the strip is drawing —
      for a host that moves the strip itself (the hero's pinned paper), so the
      tear follows every frame of that motion instead of the 12 fps idle floor */
  redrawRef?: MutableRefObject<(() => void) | null>;
};

const NOISE_SCALE = 2.9;
const NOISE_INTENSITY = 0.5;
const EDGE_SOFTNESS = 0.105;
const SCROLL_SENSITIVITY = 0.002;
const BASE_SPEED = 0.01;
const GRAIN_SCALE = 50;
const MOVE_H = 0;
const MOVE_V = 0.3;
const BLOOM_INTENSITY = 0.2;
const BLOOM_RADIUS = 0.3;
const BLOOM_DOWNSAMPLE = 2;
/* redraw floor while nothing moves: the fibre drift is 0.01/s, i.e. ~0.02 px
   per step at 12 fps — far below anything visible */
const IDLE_FPS = 12;

/* paper drawn at the TOP: v_uv.y is flipped for the tear pass only */
const VERT_TEAR = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = 0.5 * (a_position + 1.0);
  v_uv.y = 1.0 - v_uv.y;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const VERT_QUAD = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = 0.5 * (a_position + 1.0);
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAG_TEAR = `
precision mediump float;
varying vec2 v_uv;
uniform vec3 u_color;
uniform vec3 u_transition_color;
uniform float u_noise_scale;
uniform float u_noise_intensity;
uniform float u_scroll_offset;
uniform float u_edge_softness;
uniform float u_grain_scale;
uniform float u_movement_horizontal;
uniform float u_movement_vertical;
uniform float u_parallax_offset;
uniform float u_aspect_ratio;

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}
float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}
float fbm(vec2 st) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(st);
    st *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}
float detailedNoise(vec2 st) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 6; i++) {
    value += amplitude * noise(st);
    st *= 2.2;
    amplitude *= 0.45;
  }
  return value;
}

void main() {
  /* 1. the wavy tear line */
  float baseLine = 0.5 + u_parallax_offset;
  float horizontalOffset = u_scroll_offset * u_movement_horizontal;
  float verticalOffset = u_scroll_offset * u_movement_vertical;
  vec2 noiseCoord = vec2(
    v_uv.x * u_aspect_ratio * u_noise_scale + horizontalOffset,
    v_uv.y * 3.0 + verticalOffset * 0.6);
  float edgeNoise = fbm(noiseCoord);
  float mainEdge = baseLine + (edgeNoise - 0.5) * u_noise_intensity;

  /* 2. uneven transition thickness */
  vec2 thicknessNoiseCoord = vec2(
    v_uv.x * u_aspect_ratio * u_noise_scale * 2.3 + horizontalOffset * 0.7,
    v_uv.y * 2.0 + verticalOffset * 0.4 + 100.0);
  float thicknessNoise = fbm(thicknessNoiseCoord);
  float minThickness = u_edge_softness * 0.1;
  float maxThickness = u_edge_softness;
  float localThickness = mix(minThickness, maxThickness, thicknessNoise);

  /* 3. the two boundaries */
  float lowerBound = mainEdge - localThickness * 0.4;
  float upperBound = mainEdge + localThickness * 0.6;

  /* 4. fibre grain */
  vec2 grainCoord = vec2(
    v_uv.x * u_aspect_ratio * u_grain_scale * 3.0 + horizontalOffset * 0.5,
    v_uv.y * u_grain_scale * 3.0 + verticalOffset * 0.3);
  float grain = detailedNoise(grainCoord);
  vec2 fiberCoord = vec2(
    v_uv.x * u_aspect_ratio * u_grain_scale * 8.0 + horizontalOffset * 0.3,
    v_uv.y * u_grain_scale * 2.0 + verticalOffset * 0.2);
  float fiberNoise = noise(fiberCoord);
  float combinedGrain = grain * 0.6 + fiberNoise * 0.4;

  /* 5. paint by position */
  if (v_uv.y < lowerBound) {
    gl_FragColor = vec4(u_color, 1.0);
  } else if (v_uv.y < mainEdge) {
    float t = (v_uv.y - lowerBound) / max(mainEdge - lowerBound, 0.001);
    float grainThreshold = 1.0 - pow(t, 1.5);
    grainThreshold -= thicknessNoise * 0.2;
    if (combinedGrain > grainThreshold) {
      gl_FragColor = vec4(u_transition_color, 1.0);
    } else {
      gl_FragColor = vec4(u_color, 1.0);
    }
  } else if (v_uv.y < upperBound) {
    float t = (v_uv.y - mainEdge) / max(upperBound - mainEdge, 0.001);
    float grainThreshold = pow(t, 1.2);
    grainThreshold += thicknessNoise * 0.15;
    if (combinedGrain > grainThreshold) {
      gl_FragColor = vec4(u_transition_color, 1.0);
    } else {
      discard;
    }
  } else {
    discard;
  }
}`;

const FRAG_EXTRACT = `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_texture;
uniform vec3 u_transition_color;
uniform vec3 u_base_color;
void main() {
  vec4 pixel = texture2D(u_texture, v_uv);
  float distToTransition = length(pixel.rgb - u_transition_color);
  float distToBase = length(pixel.rgb - u_base_color);
  float isTransition = 1.0 - smoothstep(0.0, 0.5, distToTransition);
  float notBase = smoothstep(0.0, 0.3, distToBase);
  float mask = isTransition * notBase * pixel.a;
  mask = pow(mask, 0.8);
  gl_FragColor = vec4(1.0, 1.0, 1.0, mask);
}`;

const FRAG_BLUR = `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_texture;
uniform vec2 u_direction;
uniform vec2 u_resolution;
uniform float u_radius;
void main() {
  float blur_size = u_radius * 12.0;
  float alpha = 0.0;
  float totalWeight = 0.0;
  for (int i = -6; i <= 6; i++) {
    float offset = float(i);
    float weight = exp(-0.5 * (offset * offset) / 4.0);
    vec2 sampleOffset = u_direction * (offset * blur_size) / u_resolution;
    float sampleAlpha = texture2D(u_texture, v_uv + sampleOffset).a;
    alpha += sampleAlpha * weight;
    totalWeight += weight;
  }
  gl_FragColor = vec4(1.0, 1.0, 1.0, alpha / totalWeight);
}`;

const FRAG_COMPOSITE = `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_scene;
uniform sampler2D u_bloom;
uniform float u_bloom_intensity;
uniform vec3 u_transition_color;
void main() {
  vec4 scene = texture2D(u_scene, v_uv);
  vec4 bloom = texture2D(u_bloom, v_uv);
  float bloomStrength = bloom.a * u_bloom_intensity;
  vec3 bloomColor = u_transition_color * bloomStrength * 2.0;
  if (scene.a < 0.001) {
    float glowAlpha = bloomStrength * 1.5;
    gl_FragColor = vec4(u_transition_color, glowAlpha);
  } else {
    vec3 result = min(scene.rgb + bloomColor, vec3(1.0));
    gl_FragColor = vec4(result, scene.a);
  }
}`;

type Target = { tex: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number };

export default function TornPaperEdge({
  className = '',
  /* --parch, the site's peach-cream paper (#f6ebdc) */
  paper = [0.965, 0.922, 0.863],
  transition = [0.965, 0.922, 0.863],
  onReady,
  paperSide = 'top',
  redrawRef,
}: TornPaperEdgeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const readyRef = useRef(onReady);
  readyRef.current = onReady;
  const hostRedrawRef = useRef(redrawRef);
  hostRedrawRef.current = redrawRef;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    /* with equal colours the bloom mask is exactly zero and the composite is
       the scene itself — the four extra passes would only copy pixels */
    const tinted = paper.some((c, i) => Math.abs(c - transition[i]) > 1e-6);

    /* everything after the programs have linked — buffers, targets, uniforms,
       the on-demand render loop and its observers; returns the disposer */
    const start = (
      gl: WebGLRenderingContext,
      tearP: WebGLProgram,
      extractP: WebGLProgram | null,
      blurP: WebGLProgram | null,
      compP: WebGLProgram | null
    ): (() => void) => {
      const bloomOk = tinted && !!(extractP && blurP && compP);

      const quad = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

      /* attribute + uniform locations, resolved once per program */
      const attribs = new Map<WebGLProgram, number>();
      const uniforms = new Map<WebGLProgram, Map<string, WebGLUniformLocation | null>>();
      const u = (p: WebGLProgram, n: string) => {
        let m = uniforms.get(p);
        if (!m) {
          m = new Map();
          uniforms.set(p, m);
        }
        let loc = m.get(n);
        if (loc === undefined) {
          loc = gl.getUniformLocation(p, n);
          m.set(n, loc);
        }
        return loc;
      };
      const bindQuad = (p: WebGLProgram) => {
        let loc = attribs.get(p);
        if (loc === undefined) {
          loc = gl.getAttribLocation(p, 'a_position');
          attribs.set(p, loc);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      };

      /* constant uniforms, written once */
      gl.useProgram(tearP);
      gl.uniform3f(u(tearP, 'u_color'), paper[0], paper[1], paper[2]);
      gl.uniform3f(u(tearP, 'u_transition_color'), transition[0], transition[1], transition[2]);
      gl.uniform1f(u(tearP, 'u_noise_scale'), NOISE_SCALE);
      gl.uniform1f(u(tearP, 'u_noise_intensity'), NOISE_INTENSITY);
      gl.uniform1f(u(tearP, 'u_edge_softness'), EDGE_SOFTNESS);
      gl.uniform1f(u(tearP, 'u_grain_scale'), GRAIN_SCALE);
      gl.uniform1f(u(tearP, 'u_movement_horizontal'), MOVE_H);
      gl.uniform1f(u(tearP, 'u_movement_vertical'), MOVE_V);
      if (bloomOk) {
        gl.useProgram(extractP!);
        gl.uniform1i(u(extractP!, 'u_texture'), 0);
        gl.uniform3f(u(extractP!, 'u_transition_color'), transition[0], transition[1], transition[2]);
        gl.uniform3f(u(extractP!, 'u_base_color'), paper[0], paper[1], paper[2]);
        gl.useProgram(blurP!);
        gl.uniform1i(u(blurP!, 'u_texture'), 0);
        gl.uniform1f(u(blurP!, 'u_radius'), BLOOM_RADIUS);
        gl.useProgram(compP!);
        gl.uniform1i(u(compP!, 'u_scene'), 0);
        gl.uniform1i(u(compP!, 'u_bloom'), 1);
        gl.uniform1f(u(compP!, 'u_bloom_intensity'), BLOOM_INTENSITY);
        gl.uniform3f(u(compP!, 'u_transition_color'), transition[0], transition[1], transition[2]);
      }

      /* render targets: full-res scene + three half-res bloom buffers */
      const makeTarget = (): Target => {
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        const fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return { tex: tex as WebGLTexture, fbo: fbo as WebGLFramebuffer, w: 2, h: 2 };
      };
      const targets = bloomOk
        ? { scene: makeTarget(), bright: makeTarget(), blurA: makeTarget(), blurB: makeTarget() }
        : null;
      const sizeTarget = (t: Target, w: number, h: number) => {
        if (t.w === w && t.h === h) return;
        gl.bindTexture(gl.TEXTURE_2D, t.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        t.w = w;
        t.h = h;
      };

      /* fibre features are set in CSS pixels by the shader, so a lower cap on
         touch devices only coarsens the sub-pixel speckle */
      const coarse = window.matchMedia('(pointer: coarse)').matches;
      const dprCap = coarse ? 1.5 : 2;
      let W = 0;
      let H = 0;
      const resize = () => {
        const r = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
        const w = Math.max(2, Math.floor(r.width * dpr));
        const h = Math.max(2, Math.floor(r.height * dpr));
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        W = w;
        H = h;
        gl.useProgram(tearP);
        gl.uniform1f(u(tearP, 'u_aspect_ratio'), H > 0 ? W / H : 1);
        if (targets) {
          sizeTarget(targets.scene, w, h);
          const bw = Math.max(2, Math.floor(w / BLOOM_DOWNSAMPLE));
          const bh = Math.max(2, Math.floor(h / BLOOM_DOWNSAMPLE));
          sizeTarget(targets.bright, bw, bh);
          sizeTarget(targets.blurA, bw, bh);
          sizeTarget(targets.blurB, bw, bh);
          gl.useProgram(blurP!);
          gl.uniform2f(u(blurP!, 'u_resolution'), bw, bh);
        }
      };

      /* scroll-fed noise offset (reference: ne += delta * sensitivity) and time */
      let scrollOffset = 0;
      let lastScrollY = window.scrollY || window.pageYOffset || 0;
      const t0 = performance.now();
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      let dirty = true;
      const onScroll = ({ scroll: y }: { scroll: number }) => {
        scrollOffset += (y - lastScrollY) * SCROLL_SENSITIVITY;
        lastScrollY = y;
        dirty = true;
      };

      /* parallax: reference De() — progress of the strip across the viewport;
         negated here because the paper is at the top */
      const parallax = () => {
        const r = canvas.getBoundingClientRect();
        const n = window.innerHeight;
        let o: number;
        if (r.top >= n) o = 1;
        else if (r.bottom <= 0) o = 0;
        else o = Math.max(0, Math.min(1, 1 - (n - r.top) / (n + r.height)));
        /* reference: c = 1 - o, offset = c - 0.5 (paper grows from the bottom);
           paper-on-top uses the mirror so the paper shrinks from the top */
        return paperSide === 'top' ? o - 0.5 : 0.5 - o;
      };

      const draw = () => {
        const time = reduceMotion ? 0 : ((performance.now() - t0) / 1000) * BASE_SPEED;
        const off = time + scrollOffset;

        /* pass 1 — the tear, into the scene target (or straight to screen) */
        gl.bindFramebuffer(gl.FRAMEBUFFER, targets ? targets.scene.fbo : null);
        gl.viewport(0, 0, W, H);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(tearP);
        bindQuad(tearP);
        gl.uniform1f(u(tearP, 'u_scroll_offset'), off);
        gl.uniform1f(u(tearP, 'u_parallax_offset'), parallax());
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        if (!targets) return;

        gl.disable(gl.BLEND);
        /* pass 2 — bloom mask from the transition fibres (half res) */
        gl.bindFramebuffer(gl.FRAMEBUFFER, targets.bright.fbo);
        gl.viewport(0, 0, targets.bright.w, targets.bright.h);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(extractP!);
        bindQuad(extractP!);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, targets.scene.tex);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        /* passes 3+4 — separable gaussian */
        gl.useProgram(blurP!);
        bindQuad(blurP!);
        gl.bindFramebuffer(gl.FRAMEBUFFER, targets.blurA.fbo);
        gl.bindTexture(gl.TEXTURE_2D, targets.bright.tex);
        gl.uniform2f(u(blurP!, 'u_direction'), 1, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindFramebuffer(gl.FRAMEBUFFER, targets.blurB.fbo);
        gl.bindTexture(gl.TEXTURE_2D, targets.blurA.tex);
        gl.uniform2f(u(blurP!, 'u_direction'), 0, 1);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        /* pass 5 — composite to the screen */
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, W, H);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(compP!);
        bindQuad(compP!);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, targets.scene.tex);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, targets.blurB.tex);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      };

      /* loop only while the strip is near the viewport, and draw only when
         something changed (scroll, resize) or the idle floor is due */
      let raf = 0;
      let running = false;
      let inView = false;
      let lastDraw = 0;
      const loop = (now: number) => {
        if (!running) return;
        raf = requestAnimationFrame(loop);
        const due = reduceMotion ? dirty : dirty || now - lastDraw >= 1000 / IDLE_FPS;
        if (!due) return;
        dirty = false;
        lastDraw = now;
        draw();
      };
      const sync = () => {
        const should = inView && !document.hidden;
        if (should && !running) {
          running = true;
          raf = requestAnimationFrame(loop);
        } else if (!should && running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      };
      const io = new IntersectionObserver(
        ([e]) => {
          inView = e.isIntersecting;
          sync();
        },
        { threshold: 0, rootMargin: '20% 0px' }
      );
      /* setting canvas.width clears the buffer — always redraw after a resize */
      const ro = new ResizeObserver(() => {
        resize();
        draw();
        dirty = false;
      });

      resize();
      draw();
      io.observe(canvas);
      ro.observe(canvas);
      /* scroll deltas come off the Lenis frame (native scroll under reduced motion) */
      const offScroll = subscribeScroll(onScroll);
      document.addEventListener('visibilitychange', sync);
      /* only now — a real frame exists — may the host drop its SVG fallback */
      readyRef.current?.();
      const hostRedraw = hostRedrawRef.current;
      if (hostRedraw) hostRedraw.current = () => { dirty = true; };

      return () => {
        if (hostRedraw) hostRedraw.current = null;
        running = false;
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        offScroll();
        document.removeEventListener('visibilitychange', sync);
        if (targets) {
          for (const t of [targets.scene, targets.bright, targets.blurA, targets.blurB]) {
            gl.deleteFramebuffer(t.fbo);
            gl.deleteTexture(t.tex);
          }
        }
        gl.deleteBuffer(quad);
        for (const p of [tearP, extractP, blurP, compP]) if (p) gl.deleteProgram(p);
      };
    };

    /* the GL work starts when the strip is within 1.5 viewports, or in an idle
       slot after load — never in the boot task (see lib/gl.ts) */
    return scheduleGlInit(canvas, () => {
      const gl = canvas.getContext('webgl', {
        alpha: true,
        premultipliedAlpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: 'low-power',
      });
      if (!gl) return;

      const specs = [{ vs: paperSide === 'top' ? VERT_TEAR : VERT_QUAD, fs: FRAG_TEAR, label: 'TornPaperEdge tear' }];
      if (tinted) {
        specs.push(
          { vs: VERT_QUAD, fs: FRAG_EXTRACT, label: 'TornPaperEdge extract' },
          { vs: VERT_QUAD, fs: FRAG_BLUR, label: 'TornPaperEdge blur' },
          { vs: VERT_QUAD, fs: FRAG_COMPOSITE, label: 'TornPaperEdge composite' }
        );
      }
      let dispose: (() => void) | null = null;
      const cancelLink = linkPrograms(gl, specs, ([tearP, extractP, blurP, compP]) => {
        if (!tearP) return;
        dispose = start(gl, tearP, extractP ?? null, blurP ?? null, compP ?? null);
      });
      return () => {
        cancelLink();
        dispose?.();
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
