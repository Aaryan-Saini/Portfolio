/* ============================================================================
   lib/lenis.ts — the single Lenis instance behind every section's scrolling.

   · createLenis()      builds it once (siteEffects.js does this on boot and
                        drives it from the GSAP ticker, so ScrollTrigger and
                        Lenis advance on one frame)
   · getLenis()         the live instance, or null before boot / under
                        prefers-reduced-motion (Lenis is skipped there and the
                        page scrolls natively)
   · subscribeScroll()  ONE way for any section to react to scroll: it rides
                        the Lenis "scroll" event when Lenis exists (now, or
                        once it boots) and falls back to the native scroll
                        event otherwise — a section never has to know which
   · useLenisScroll()   the same as a hook, for React sections

   Sections never construct their own Lenis or listen to window "scroll"
   directly — that is what keeps the hero band, the torn-paper strips, the
   footer reveal and the ScrollTrigger-driven sections moving on one frame.
   ========================================================================== */

import Lenis, { type LenisOptions } from "lenis";
import { useEffect, type DependencyList } from "react";

declare global {
  interface Window {
    /** the live instance — read by the imperative engine in siteEffects.js */
    __lenis?: Lenis;
  }
}

/* Tuning notes:
   · lerp is the glide model: every frame the page closes a fixed fraction of
     the distance to the wheel target (Lenis' damp(), frame-rate independent).
     0.077 = 10·ln2 / 1.5 / 60 is the exact exponential that the previous
     duration-1.5 + expo-out tween traced, so the feel while moving is
     identical — but the lerp branch stops on arrival, whereas the tween kept
     emitting sub-pixel frames (and waking every scroll subscriber) until its
     1.5 s clock ran out after each notch. lerp is THE dial: 0.1 is Lenis'
     default and reads crisper, below ~0.05 the page feels detached.
   · explicit durations passed to scrollTo() (to-top, anchors, keyboard in
     siteEffects.js) are always honoured: Lenis fills in its default easing
     for a numeric duration, so those glides are unaffected by lerp.
   · wheelMultiplier stays at 1.0: a lower value (0.45 was tried) made each
     notch travel under half the normal distance and read as sluggish; the
     smoothness is spent on the catch-up, not on shortening the input.
   · syncTouch: touch drags glide too (through syncTouchLerp), instead of
     falling through to native flick scrolling — otherwise phones /
     touchscreens get none of the above.
   · allowNestedScroll: an inner scroller (the Experience card on short
     desktop viewports, the marquee row) gets the wheel while it still has
     room to scroll, then the page takes over. Without it Lenis swallows the
     wheel over nested scrollers and they cannot be scrolled at all. */
export const LENIS_OPTIONS: LenisOptions = {
  lerp: 0.077,
  wheelMultiplier: 1.0,
  smoothWheel: true,
  syncTouch: true,
  syncTouchLerp: 0.075,
  touchMultiplier: 1.3,
  allowNestedScroll: true,
};

let instance: Lenis | null = null;
const pending = new Set<(lenis: Lenis) => void>();

/** Create the site's Lenis (idempotent — later calls return the same one). */
export function createLenis(options: LenisOptions = LENIS_OPTIONS): Lenis {
  if (instance) return instance;
  instance = new Lenis(options);
  window.__lenis = instance;
  for (const fn of Array.from(pending)) fn(instance);
  pending.clear();
  return instance;
}

/** The live instance, or null before boot / when Lenis is skipped. */
export function getLenis(): Lenis | null {
  return instance;
}

/** Tear the instance down. Routes that own their own Lenis (the 404's
    SmoothScroll island) call this on unmount so a later page can boot a
    fresh one instead of inheriting a dead rAF loop. */
export function destroyLenis(): void {
  if (!instance) return;
  instance.destroy();
  instance = null;
  delete window.__lenis;
}

/** Run `fn` with the instance — now if it exists, else the moment it is
    created. Returns an unsubscribe for the not-yet case. */
export function whenLenis(fn: (lenis: Lenis) => void): () => void {
  if (instance) {
    fn(instance);
    return () => {};
  }
  pending.add(fn);
  return () => {
    pending.delete(fn);
  };
}

export type ScrollState = {
  /** current scroll position (px) — equals window.scrollY */
  scroll: number;
  /** maximum scroll position (px) */
  limit: number;
  /** 0 … 1 through the page */
  progress: number;
  /** px per frame; 0 on the native fallback */
  velocity: number;
  /** 1 down, -1 up, 0 idle/unknown */
  direction: number;
};

/** Subscribe to page scroll through Lenis. Falls back to the native scroll
    event while no Lenis exists (before boot, or under reduced motion) and
    switches over automatically when one is created. Returns an unsubscribe. */
export function subscribeScroll(fn: (state: ScrollState) => void): () => void {
  let offLenis: (() => void) | null = null;
  let nativeOn = false;

  const onNative = () => {
    const scroll = window.scrollY || window.pageYOffset || 0;
    const limit = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    fn({ scroll, limit, progress: limit ? scroll / limit : 0, velocity: 0, direction: 0 });
  };
  const attachNative = () => {
    if (nativeOn) return;
    nativeOn = true;
    window.addEventListener("scroll", onNative, { passive: true });
  };
  const detachNative = () => {
    if (!nativeOn) return;
    nativeOn = false;
    window.removeEventListener("scroll", onNative);
  };
  const attachLenis = (lenis: Lenis) => {
    detachNative();
    const onLenis = (l: Lenis) =>
      fn({
        scroll: l.scroll,
        limit: l.limit,
        progress: l.progress,
        velocity: l.velocity,
        direction: l.direction,
      });
    lenis.on("scroll", onLenis);
    offLenis = () => lenis.off("scroll", onLenis);
  };

  if (!instance) attachNative();
  const cancel = whenLenis(attachLenis);

  return () => {
    cancel();
    offLenis?.();
    offLenis = null;
    detachNative();
  };
}

/** React form of subscribeScroll — for sections that want scroll state. */
export function useLenisScroll(fn: (state: ScrollState) => void, deps: DependencyList = []) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => subscribeScroll(fn), deps);
}
