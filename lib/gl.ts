/* ============================================================================
   lib/gl.ts — boot-friendly WebGL setup shared by the decorative shader layers
   (TornPaperEdge, OilFlowBackground, WavesShaderBackground).

   Profiling the production build showed ~85% of the page's boot task was
   shader compilation for layers that are nowhere near the viewport at load:
   every layer created its GL context and compiled its programs synchronously
   inside its mount effect, i.e. inside React's hydration/effects flush.

   Two tools fix that without changing what is rendered:

   · scheduleGlInit(el, init)  — runs `init` once, either when `el` comes
     within `margin` of the viewport (IntersectionObserver) or, failing that,
     in an idle slot a little after the page has loaded. Either way it is
     never part of the boot task, and layers the visitor never scrolls to
     cost nothing. `init` may return a cleanup; the returned disposer runs it
     (or cancels the pending schedule).

   · linkPrograms(gl, specs, onReady) — compiles + links a batch of programs.
     With KHR_parallel_shader_compile (Chrome/Edge/Firefox) the driver
     compiles on a background thread and we poll COMPLETION_STATUS_KHR, so the
     main thread never blocks; elsewhere it falls back to the classic
     synchronous path (still off the boot task thanks to scheduleGlInit).
   ========================================================================== */

type Cleanup = (() => void) | void;

const hasWindow = typeof window !== "undefined";

/** requestIdleCallback with a setTimeout fallback (Safari). */
function onIdle(fn: () => void, timeout: number): () => void {
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (typeof w.requestIdleCallback === "function") {
    const id = w.requestIdleCallback(fn, { timeout });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(fn, Math.min(timeout, 1500));
  return () => window.clearTimeout(id);
}

/** Resolve once the document has fired `load` (immediately if it already has). */
function afterLoad(fn: () => void): () => void {
  if (document.readyState === "complete") {
    fn();
    return () => {};
  }
  window.addEventListener("load", fn, { once: true });
  return () => window.removeEventListener("load", fn);
}

/**
 * Run `fn` now, or — while the boot overlay (html.plx-lock) still holds the
 * page — once it dispatches "plx:done". Nothing can approach the viewport
 * while the veil is up and scroll is locked, so arming observers before then
 * only adds work to the boot window.
 */
export function whenUnlocked(fn: () => void): () => void {
  if (!hasWindow) return () => {};
  if (!document.documentElement.classList.contains("plx-lock")) {
    fn();
    return () => {};
  }
  window.addEventListener("plx:done", fn, { once: true });
  return () => window.removeEventListener("plx:done", fn);
}

export type GlScheduleOptions = {
  /** IntersectionObserver rootMargin — how far ahead of the viewport the
      layer should start building itself. Default: one viewport height (the
      first strips sit ~2 viewports down on phones, so nothing compiles in
      the load window unless the visitor is already scrolling towards it). */
  margin?: string;
  /** ms after window `load` before the idle-time fallback is armed. Keeps
      the compile clear of the preloader and the first paint. Default 2500. */
  idleAfterLoad?: number;
  /** requestIdleCallback timeout: worst case the init runs this long after
      the idle fallback is armed. Default 4000. */
  idleTimeout?: number;
};

/**
 * Run `init` exactly once, off the boot path: when `el` approaches the
 * viewport, or in an idle slot shortly after load — whichever comes first.
 */
export function scheduleGlInit(
  el: Element,
  init: () => Cleanup,
  opts: GlScheduleOptions = {}
): () => void {
  if (!hasWindow) return () => {};
  const margin = opts.margin ?? "100% 0px";
  const idleAfterLoad = opts.idleAfterLoad ?? 2500;
  const idleTimeout = opts.idleTimeout ?? 4000;

  let done = false;
  let cleanup: Cleanup;
  let io: IntersectionObserver | null = null;
  let cancelUnlock: (() => void) | null = null;
  let cancelLoad: (() => void) | null = null;
  let cancelIdle: (() => void) | null = null;
  let timer = 0;

  const disarm = () => {
    io?.disconnect();
    io = null;
    cancelUnlock?.();
    cancelUnlock = null;
    cancelLoad?.();
    cancelLoad = null;
    cancelIdle?.();
    cancelIdle = null;
    if (timer) window.clearTimeout(timer);
    timer = 0;
  };

  const run = () => {
    if (done) return;
    done = true;
    disarm();
    cleanup = init();
  };

  const arm = () => {
    if (done) return;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) run();
        },
        { rootMargin: margin, threshold: 0 }
      );
      io.observe(el);
    }
    cancelLoad = afterLoad(() => {
      timer = window.setTimeout(() => {
        timer = 0;
        cancelIdle = onIdle(run, idleTimeout);
      }, idleAfterLoad);
    });
  };

  cancelUnlock = whenUnlocked(arm);

  return () => {
    disarm();
    if (typeof cleanup === "function") cleanup();
    cleanup = undefined;
    done = true;
  };
}

export type ProgramSpec = { vs: string; fs: string; label?: string };

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

/**
 * Compile and link every program in `specs`, then call `onReady` with the
 * programs in the same order (null for any that failed). Non-blocking where
 * KHR_parallel_shader_compile exists; synchronous otherwise. Returns a cancel
 * function — after cancelling, `onReady` never fires and the programs are
 * deleted.
 */
export function linkPrograms(
  gl: WebGLRenderingContext,
  specs: ProgramSpec[],
  onReady: (programs: (WebGLProgram | null)[]) => void
): () => void {
  const ext = gl.getExtension("KHR_parallel_shader_compile") as
    | { COMPLETION_STATUS_KHR: number }
    | null;

  type Pending = { p: WebGLProgram | null; v: WebGLShader | null; f: WebGLShader | null; label: string };
  const pending: Pending[] = specs.map((spec) => {
    const label = spec.label ?? "program";
    const v = compileShader(gl, gl.VERTEX_SHADER, spec.vs);
    const f = compileShader(gl, gl.FRAGMENT_SHADER, spec.fs);
    const p = v && f ? gl.createProgram() : null;
    if (p && v && f) {
      gl.attachShader(p, v);
      gl.attachShader(p, f);
      gl.linkProgram(p);
    }
    return { p, v, f, label };
  });

  let cancelled = false;
  let finished = false;
  let timer = 0;

  const finish = () => {
    finished = true;
    const out: (WebGLProgram | null)[] = pending.map(({ p, v, f, label }) => {
      if (!p || !v || !f) {
        if (v) gl.deleteShader(v);
        if (f) gl.deleteShader(f);
        return null;
      }
      const ok = gl.getProgramParameter(p, gl.LINK_STATUS);
      if (!ok) {
        // report the real cause: a shader error surfaces here as a link failure
        const vLog = gl.getShaderInfoLog(v);
        const fLog = gl.getShaderInfoLog(f);
        console.error(`${label}: link failed`, gl.getProgramInfoLog(p), vLog, fLog);
        gl.deleteShader(v);
        gl.deleteShader(f);
        gl.deleteProgram(p);
        return null;
      }
      gl.deleteShader(v);
      gl.deleteShader(f);
      return p;
    });
    if (!cancelled) onReady(out);
  };

  const dispose = () => {
    for (const { p, v, f } of pending) {
      if (v) gl.deleteShader(v);
      if (f) gl.deleteShader(f);
      if (p) gl.deleteProgram(p);
    }
  };

  if (!ext) {
    finish();
    return () => {};
  }

  /* each status query is a round trip to a GPU process that is busy compiling
     (~10 ms measured), so poll sparingly: a heavy program takes 200–800 ms */
  const poll = () => {
    if (cancelled) return;
    const allDone = pending.every(
      ({ p }) => !p || gl.getProgramParameter(p, ext.COMPLETION_STATUS_KHR) === true
    );
    if (allDone) {
      timer = 0;
      finish();
    } else {
      timer = window.setTimeout(poll, 100);
    }
  };
  timer = window.setTimeout(poll, 120);

  // once delivered, the programs belong to the caller — cancelling is a no-op
  return () => {
    if (finished) return;
    cancelled = true;
    if (timer) window.clearTimeout(timer);
    timer = 0;
    dispose();
  };
}
