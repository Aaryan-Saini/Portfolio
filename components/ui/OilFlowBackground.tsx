'use client';

/* ============================================================================
   OilFlowBackground — the slow "flowing oil" ground of the Method ledger.
   Replicates the reference template's marbled band: a dark pool with lighter
   smoky sheets and darker sinks drifting through it at a walking pace, plus a
   film-grain pass. Domain-warped value noise (q → r → f) on a fullscreen
   triangle; the palette is the site's midnight indigo, tuned so the light
   sheets sit ~30% above the ground like the reference's oxblood original.

   Cost control: renders at ≤ 1200×800 internal pixels and ~30fps, only while
   on screen and the tab is visible; prefers-reduced-motion paints one still.

   Boot cost: the GL context and shader compile/link are deferred by lib/gl.ts
   (they run when the band nears the viewport or in an idle slot after load,
   never inside React's mount flush) and the program links on a background
   thread where KHR_parallel_shader_compile exists. Until the first frame the
   canvas is cleared to the section ground colour, so the deferral is invisible.
   ========================================================================== */

import { useEffect, useRef, useState } from 'react';
import { linkPrograms, scheduleGlInit } from '@/lib/gl';

/* deep sink · ground · mid sheet · light sheet — sRGB 0..1 */
const PALETTE: [number, number, number][] = [
  [0.027, 0.031, 0.102], // #07081a
  [0.063, 0.067, 0.173], // #10112c  (--wine-900, the section ground)
  [0.114, 0.129, 0.349], // #1d2159
  [0.184, 0.227, 0.486], // #2f3a7c
];
const SPEED = 0.25; // calibrated with ffmpeg: the reference's pure texture drifts only ~0.1–0.5 luma per 3 s (near-still, slow breathe)
const FPS_CAP = 24; // the field moves < 0.1 luma per frame — more is invisible
/* pixel budgets per device class — the field is soft, so the compositor's
   upscale is invisible, but every internal pixel costs ~100 hash evaluations */
const BUDGET_FINE = 520_000; // mouse/trackpad devices: 1440×900 → 913×571
const BUDGET_COARSE = 120_000; // phones/tablets: 390×975 → 219×548
const SLOW_FRAME_MS = 2 * (1000 / 24); // below ~12fps counts as slow

const VERT = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 u_res;
uniform float u_time;
uniform float u_seed;
uniform vec3 u_c0;
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform vec3 u_c3;

float hash21(vec2 p) {
#ifndef GL_FRAGMENT_PRECISION_HIGH
  p = mod(p, 31.0);
#endif
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
    u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = m * p + vec2(3.1, 7.7);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);
  p = p * 2.4 + u_seed;
  float t = u_time;

  /* two rounds of domain warping — the classic marbled-ink field */
  vec2 q = vec2(fbm(p + t * 0.05),
                fbm(p + vec2(5.2, 1.3) - t * 0.04));
  vec2 r = vec2(fbm(p + 2.6 * q + vec2(1.7, 9.2) + t * 0.035),
                fbm(p + 2.6 * q + vec2(8.3, 2.8) - t * 0.03));
  float f = fbm(p + 2.2 * r);

  /* ground → mid sheet by the warped field; light sheets where q is strong;
     dark sinks where r is strong — the pooled-oil look */
  vec3 col = mix(u_c1, u_c2, smoothstep(0.25, 0.78, f));
  col = mix(col, u_c3, smoothstep(0.55, 0.95, length(q) * 0.9) * 0.46);
  col = mix(col, u_c0, smoothstep(0.38, 0.88, length(r)) * 0.44);
  /* macro contrast: scale sheets and sinks about the ground colour. Measured
     in perceptual L* the reference band spans ~7.9 (p5→p95); the raw field
     spans ~12 on this darker ground, so pull it in by 0.55 — the ground pixel
     itself is untouched. */
  col = u_c1 + (col - u_c1) * 0.62;
  /* fine mottle riding the warp — the reference's surface is dappled at a
     much smaller scale than its sheets; without this the field reads as a
     smooth gradient rather than pooled oil */
  float mottle = fbm(p * 5.5 + r * 1.5 - t * 0.02) - 0.5;
  col += mottle * 0.07 * (0.6 + 0.8 * f);
  /* and a finer speckle band (3–12 px) — the paper-like dapple of the original */
  float speck = fbm(p * 16.0 + r * 0.8) - 0.5;
  col += speck * 0.024;
  /* a whisper of cyan sheen on the brightest ridges — oil-slick iridescence */
  col += vec3(0.04, 0.09, 0.13) * pow(f, 3.0) * 0.45;

  /* vignette + film grain (this layer covers the section's crumple pass) */
  float vd = length(uv - 0.5) * 1.41421356;
  col *= 1.0 - 0.14 * smoothstep(0.5, 1.0, vd);
  /* light in-shader grain only: the section's CSS crumple overlay (see
     MethodStack .msx-root::before) rides above this canvas at screen
     resolution and carries the paper grain without an upscale beat */
  col += (hash21(gl_FragCoord.xy + u_seed) - 0.5) * 0.02;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

export default function OilFlowBackground({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  /* bumped on webglcontextrestored so the effect rebuilds every GL object */
  const [gen, setGen] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    /* everything after the program has linked — buffers, uniforms, sizing,
       the render loop and its observers; returns the disposer */
    const start = (gl: WebGLRenderingContext, program: WebGLProgram): (() => void) => {
      gl.useProgram(program);

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const aPos = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      const uRes = gl.getUniformLocation(program, 'u_res');
      const uTime = gl.getUniformLocation(program, 'u_time');
      gl.uniform1f(gl.getUniformLocation(program, 'u_seed'), 11.37);
      (['u_c0', 'u_c1', 'u_c2', 'u_c3'] as const).forEach((n, i) =>
        gl.uniform3f(gl.getUniformLocation(program, n), ...PALETTE[i])
      );

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const t0 = performance.now();
      let raf = 0;
      let running = false;
      let inView = false;
      let lastFrame = 0;
      const coarse =
        window.matchMedia('(pointer: coarse)').matches ||
        document.documentElement.classList.contains('is-touch');
      const budget = coarse ? BUDGET_COARSE : BUDGET_FINE;
      /* adaptive step-down: three consecutive slow frames shrink the buffer by
         a quarter (floor 0.5) — a weak GPU settles at a size it can sustain */
      let kAdapt = 1;
      let slowRun = 0;

      const resize = () => {
        const cw = Math.max(1, canvas.clientWidth);
        const ch = Math.max(1, canvas.clientHeight);
        /* soft field: render below device resolution and let the compositor
           upscale — aspect is kept so the marbling never stretches */
        const k = Math.min(1, Math.sqrt(budget / (cw * ch))) * kAdapt;
        const w = Math.max(1, Math.round(cw * k));
        const h = Math.max(1, Math.round(ch * k));
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
          gl.viewport(0, 0, w, h);
        }
      };
      const render = () => {
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform1f(uTime, reduceMotion ? 0 : (performance.now() - t0) * 0.001 * SPEED);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      };
      const loop = (now: number) => {
        if (!running) return;
        raf = requestAnimationFrame(loop);
        if (now - lastFrame < 1000 / FPS_CAP) return;
        const delta = lastFrame ? now - lastFrame : 0;
        lastFrame = now;
        render();
        if (delta > SLOW_FRAME_MS && kAdapt > 0.5) {
          if (++slowRun >= 3) {
            kAdapt = Math.max(0.5, kAdapt * 0.75);
            slowRun = 0;
            resize();
          }
        } else {
          slowRun = 0;
        }
      };
      const sync = () => {
        const should = !reduceMotion && inView && !document.hidden;
        if (should && !running) {
          running = true;
          raf = requestAnimationFrame(loop);
        } else if (!should && running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      };
      const onResize = () => {
        resize();
        lastFrame = 0; // do not let the fps cap skip the repaint of a cleared buffer
        render();
      };
      /* context loss: allow the restore, stop drawing; on restore, rebuild */
      const onLost = (e: Event) => {
        e.preventDefault();
        running = false;
        cancelAnimationFrame(raf);
      };
      const onRestored = () => setGen((g) => g + 1);
      const io = new IntersectionObserver(
        ([e]) => {
          inView = e.isIntersecting;
          sync();
        },
        { threshold: 0, rootMargin: '10% 0px' }
      );

      resize();
      render(); // never blank, even before the observer fires
      io.observe(canvas);
      window.addEventListener('resize', onResize, { passive: true });
      document.addEventListener('visibilitychange', sync);
      canvas.addEventListener('webglcontextlost', onLost);
      canvas.addEventListener('webglcontextrestored', onRestored);

      return () => {
        running = false;
        cancelAnimationFrame(raf);
        io.disconnect();
        window.removeEventListener('resize', onResize);
        document.removeEventListener('visibilitychange', sync);
        canvas.removeEventListener('webglcontextlost', onLost);
        canvas.removeEventListener('webglcontextrestored', onRestored);
        gl.deleteProgram(program);
        gl.deleteBuffer(buf);
      };
    };

    /* the GL work starts when the band is within 1.5 viewports, or in an idle
       slot after load — never in the boot task (see lib/gl.ts) */
    return scheduleGlInit(canvas, () => {
      const gl = canvas.getContext('webgl', {
        antialias: false,
        alpha: false,
        depth: false,
        stencil: false,
        powerPreference: 'low-power',
      });
      if (!gl) return;
      /* an alpha:false canvas composites as opaque black until its first draw;
         paint the section ground now so the (possibly async) link is invisible */
      gl.clearColor(PALETTE[1][0], PALETTE[1][1], PALETTE[1][2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      let dispose: (() => void) | null = null;
      const cancelLink = linkPrograms(gl, [{ vs: VERT, fs: FRAG, label: 'OilFlow' }], ([program]) => {
        if (!program) return;
        dispose = start(gl, program);
      });
      return () => {
        cancelLink();
        dispose?.();
      };
    });
  }, [gen]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
