"use client";

/* ============================================================================
   Editorial primitives — the shared vocabulary of the "Field Notes" reframe.
   Every section builds from these: marquee tickers, torn-paper edges,
   rotating circular badges, laurel crests, postage stamps, crosshairs.
   ========================================================================== */

import {
  useEffect,
  useId,
  useRef,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/* ============================================================================
   Char-level blur reveal — the reference's signature heading animation.
   Every display heading enters as per-character spans:
     from { opacity:.001; filter:blur(10px); translateY(10px) }
     to   { opacity:1;    filter:blur(0);    translateY(0) }
   stagger ~0.016s, ~0.7s tween, ease cubic-bezier(0.44,0,0.56,1).
   ========================================================================== */

/** Walk text nodes under `root`, wrap every char in span.chr and every word in
    a nowrap span.wrd — preserves nested markup (<em>, accents) untouched. */
export function splitChars(root: HTMLElement): HTMLElement[] {
  if (root.dataset.split === "1") {
    return Array.from(root.querySelectorAll<HTMLElement>(".chr"));
  }
  root.dataset.split = "1";
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) {
    if (n.textContent && n.textContent.trim()) textNodes.push(n as Text);
  }
  const chars: HTMLElement[] = [];
  for (const node of textNodes) {
    const frag = document.createDocumentFragment();
    const words = (node.textContent || "").split(/(\s+)/);
    for (const w of words) {
      if (!w) continue;
      if (/^\s+$/.test(w)) {
        frag.appendChild(document.createTextNode(" "));
        continue;
      }
      const wrd = document.createElement("span");
      wrd.className = "wrd";
      wrd.style.whiteSpace = "nowrap";
      wrd.style.display = "inline-block";
      for (const ch of Array.from(w)) {
        const s = document.createElement("span");
        s.className = "chr";
        s.style.display = "inline-block";
        s.textContent = ch;
        wrd.appendChild(s);
        chars.push(s);
      }
      frag.appendChild(wrd);
    }
    node.parentNode?.replaceChild(frag, node);
  }
  return chars;
}

/* Trigger creation is batched across every heading on the page. React runs all
   mount effects in one synchronous flush, so each hook only splits its heading
   (DOM writes) and queues; one microtask after the flush then creates every
   ScrollTrigger back to back. A ScrollTrigger measures its element on
   creation, so creating them one per hook — write, read, write, read — forced a
   full reflow of the document for each heading. */
const pendingTriggers: Array<() => void> = [];
let flushQueued = false;
function queueTrigger(fn: () => void) {
  pendingTriggers.push(fn);
  if (flushQueued) return;
  flushQueued = true;
  queueMicrotask(() => {
    flushQueued = false;
    const batch = pendingTriggers.splice(0);
    for (const f of batch) f();
  });
}

/** Scroll-triggered per-character blur reveal on every child matching
    `selector` inside the ref'd root (defaults to the root itself).

    The split into spans happens at mount (it is layout — the script initials
    and every measured trigger position depend on it), but the tween itself is
    built only when the heading nears the viewport: until then the heading is
    parked invisible as ONE element, so the boot ScrollTrigger.refresh passes
    do not re-render ~125 blurred spans and no blur layers are kept alive. While
    a reveal runs, the heading carries .is-revealing so its spans are promoted
    (globals.css) and the blur/translate/opacity tween composites on the GPU.
    `eager` skips the deferral for headings visible from the first frame (the
    preloader tagline). */
export function useCharReveal(
  ref: RefObject<HTMLElement | null>,
  selector?: string,
  opts?: { stagger?: number; duration?: number; delay?: number; start?: string; eager?: boolean }
) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const targets = selector
      ? Array.from(root.querySelectorAll<HTMLElement>(selector))
      : [root];
    let cancelled = false;
    const ctx = gsap.context(() => {
      for (const t of targets) {
        const chars = splitChars(t);
        if (!chars.length) continue;
        const reveal = () => {
          t.classList.add("is-revealing");
          gsap.fromTo(
            chars,
            { opacity: 0.001, filter: "blur(10px)", y: 10 },
            {
              opacity: 1,
              filter: "blur(0px)",
              y: 0,
              duration: opts?.duration ?? 0.7,
              ease: "power1.inOut",
              stagger: opts?.stagger ?? 0.016,
              delay: opts?.delay ?? 0,
              onComplete: () => t.classList.remove("is-revealing"),
              scrollTrigger: {
                trigger: t,
                start: opts?.start ?? "top 86%",
                once: true,
              },
            }
          );
        };
        if (opts?.eager) {
          reveal();
          continue;
        }
        /* same invisibility (and the same accessibility semantics) as the
           per-character .001, on one element instead of every span — a plain
           style write, so nothing here reads computed style */
        t.style.opacity = "0.001";
        queueTrigger(() => {
          if (cancelled) return;
          ctx.add(() =>
            ScrollTrigger.create({
              trigger: t,
              start: "top 100%",
              once: true,
              onEnter: () =>
                /* ctx.add so ctx.revert() on unmount still kills these tweens */
                ctx.add(() => {
                  /* fromTo's immediateRender parks the chars before the
                     heading's own opacity is cleared — nothing is ever painted
                     differently */
                  reveal();
                  t.style.opacity = "";
                }),
            })
          );
        });
      }
    }, root);
    return () => {
      cancelled = true;
      ctx.revert();
      for (const t of targets) t.style.opacity = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/* ------------------------------------------------------------------ Ticker */
export function Ticker({
  items,
  separator = "✦",
  reverse = false,
  serif = false,
  speed = 28,
  className = "",
  ariaHidden = true,
}: {
  items: string[];
  separator?: string;
  reverse?: boolean;
  serif?: boolean;
  speed?: number;
  className?: string;
  ariaHidden?: boolean;
}) {
  /* track duplicated once → translateX(-50%) loops seamlessly */
  const run = (key: string) => (
    <span className="ticker__item" key={key}>
      {items.map((it, i) => (
        <span className="ticker__item" key={i}>
          <span>{it}</span>
          <span className="ticker__sep" aria-hidden="true">
            {separator}
          </span>
        </span>
      ))}
    </span>
  );
  return (
    <div
      className={`ticker ${reverse ? "ticker--reverse" : ""} ${
        serif ? "ticker--serif" : ""
      } ${className}`}
      style={{ "--ticker-speed": `${speed}s` } as CSSProperties}
      aria-hidden={ariaHidden || undefined}
    >
      <div className="ticker__track">
        {run("a")}
        {run("b")}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- Spin badge */
export function SpinBadge({
  text,
  size = 118,
  solid = false,
  draggable = false,
  className = "",
  children,
}: {
  text: string; // e.g. "SCROLL DOWN · SCROLL DOWN · "
  size?: number;
  solid?: boolean;
  /** reference behavior: badge spins continuously AND can be flicked */
  draggable?: boolean;
  className?: string;
  children?: ReactNode; // center glyph (defaults to a down arrow)
}) {
  const id = useId().replace(/[:]/g, "");
  const ringRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!draggable) return;
    const ring = ringRef.current;
    if (!ring) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /* JS-driven spin replaces the CSS animation so flicks can add momentum */
    ring.style.animation = "none";
    const state = { rot: 0, vel: 24 }; // deg/s base spin
    let dragging = false;
    let lastA = 0;
    let lastT = 0;
    const center = () => {
      const r = ring.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };
    const angle = (e: PointerEvent) => {
      const c = center();
      return (Math.atan2(e.clientY - c.y, e.clientX - c.x) * 180) / Math.PI;
    };
    const tick = () => {
      if (!dragging) {
        state.rot += (state.vel * gsap.ticker.deltaRatio(60)) / 60;
        /* momentum decays back toward the base spin rate */
        state.vel += (24 - state.vel) * 0.012;
        ring.style.transform = `rotate(${state.rot}deg)`;
      }
    };
    /* spin only while the badge is on screen, and promote it while spinning so
       the rotation composites on the GPU (as the CSS spin-slow animation did)
       instead of re-rasterising the text path every frame */
    let ticking = false;
    const startTick = () => {
      if (ticking) return;
      ticking = true;
      ring.style.willChange = "transform";
      gsap.ticker.add(tick);
    };
    const stopTick = () => {
      if (!ticking) return;
      ticking = false;
      gsap.ticker.remove(tick);
      ring.style.willChange = "";
    };
    const io = new IntersectionObserver(
      ([e]) => (e.isIntersecting ? startTick() : stopTick()),
      { threshold: 0 }
    );
    io.observe(ring);
    const down = (e: PointerEvent) => {
      dragging = true;
      lastA = angle(e);
      lastT = performance.now();
      ring.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const a = angle(e);
      let d = a - lastA;
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      const now = performance.now();
      state.rot += d;
      state.vel = gsap.utils.clamp(-720, 720, (d / Math.max(8, now - lastT)) * 1000);
      lastA = a;
      lastT = now;
      ring.style.transform = `rotate(${state.rot}deg)`;
    };
    const up = () => {
      dragging = false;
    };
    ring.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      io.disconnect();
      stopTick();
      ring.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [draggable]);

  return (
    <span
      className={`spinbadge ${solid ? "spinbadge--solid" : ""} ${
        draggable ? "spinbadge--grab" : ""
      } ${className}`}
      style={{ "--spin-size": `${size}px` } as CSSProperties}
      aria-hidden="true"
    >
      <svg className="spinbadge__ring" viewBox="0 0 100 100" ref={ringRef}>
        <defs>
          <path
            id={`sb-${id}`}
            d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0"
          />
        </defs>
        <text>
          <textPath href={`#sb-${id}`}>{text}</textPath>
        </text>
      </svg>
      <span className="spinbadge__core">
        {children ?? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 4v16m0 0l-6-6m6 6l6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </span>
  );
}

/* ---------------------------------------------------------- Torn paper edge */
/* Deterministic jagged path (seeded LCG → identical on server & client). */
function tornPath(seed: number, w = 1440, h = 48, steps = 64): string {
  let s = seed;
  const rnd = () => {
    s = (s * 48271) % 2147483647;
    return s / 2147483647;
  };
  const pts: string[] = [`M0 ${h}`, `L0 ${12 + rnd() * 18}`];
  for (let i = 1; i <= steps; i++) {
    const x = (w / steps) * i;
    const y = 4 + rnd() * (h - 14) * (0.35 + 0.65 * Math.abs(Math.sin(i * 1.7 + seed)));
    pts.push(`L${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  pts.push(`L${w} ${h} Z`);
  return pts.join(" ");
}

export function TornEdge({
  side = "top",
  color = "var(--parch)",
  seed = 7,
  height = 46,
  className = "",
}: {
  /** "top": tears upward out of the top of this section.
      "bottom": tears downward out of the bottom of this section. */
  side?: "top" | "bottom";
  color?: string;
  seed?: number;
  height?: number;
  className?: string;
}) {
  return (
    <svg
      className={`torn torn--${side} ${className}`}
      viewBox="0 0 1440 48"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        width: "100%",
        height,
        zIndex: 5,
        pointerEvents: "none",
        ...(side === "top"
          ? { top: 1 - height }
          : { bottom: 1 - height, transform: "scaleY(-1)" }),
      }}
    >
      <path d={tornPath(seed)} fill={color} />
    </svg>
  );
}

/* ------------------------------------------------------------ Laurel crest */
export function LaurelBranch({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 60 120"
      className="crest__laurel"
      aria-hidden="true"
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <path
        d="M52 112 C 30 96, 16 72, 18 40 C 19 26, 24 14, 34 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      {[
        [46, 100, -38],
        [36, 86, -30],
        [28, 70, -22],
        [23, 54, -12],
        [21, 38, -2],
        [23, 24, 10],
        [28, 12, 22],
      ].map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
          <path
            d="M0 0 C 6 -4, 14 -4, 18 0 C 14 4, 6 4, 0 0 Z"
            fill="currentColor"
            opacity={0.9 - i * 0.06}
          />
        </g>
      ))}
    </svg>
  );
}

export function Crest({
  eyebrow,
  children,
  className = "",
}: {
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`crest ${className}`}>
      {eyebrow ? (
        <p className="crest__eyebrow t-eyebrow">
          <span aria-hidden="true">◆ </span>
          {eyebrow}
          <span aria-hidden="true"> ◆</span>
        </p>
      ) : null}
      <div className="crest__row">
        <LaurelBranch />
        <h2 className="crest__title">{children}</h2>
        <LaurelBranch flip />
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- Crosshair */
export function Crosshair({
  style,
  className = "",
}: {
  style?: CSSProperties;
  className?: string;
}) {
  return <span className={`xhair ${className}`} style={style} aria-hidden="true" />;
}

/* ---------------------------------------------------------------- Doodles */
export function GlassesDoodle({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 34"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="22" cy="19" r="12" />
      <circle cx="74" cy="19" r="12" />
      <path d="M34 17 C 42 10, 54 10, 62 17" />
      <path d="M10 15 L2 9 M86 15 L94 9" strokeLinecap="round" />
      <circle cx="22" cy="19" r="5" fill="currentColor" stroke="none" />
      <circle cx="74" cy="19" r="5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function BugDoodle({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <ellipse cx="20" cy="23" rx="9" ry="11" />
      <path d="M20 12 v22 M11 20 H4 M36 20 h-7 M12 27 l-6 4 M28 27 l6 4 M12 14 l-5 -5 M28 14 l5 -5" strokeLinecap="round" />
      <circle cx="16" cy="8" r="3" />
      <circle cx="24" cy="8" r="3" />
    </svg>
  );
}

export function EyeDoodle({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 20"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M2 10 C 8 2, 28 2, 34 10 C 28 18, 8 18, 2 10 Z" />
      <circle cx="18" cy="10" r="4" fill="currentColor" stroke="none">
        <animate attributeName="r" values="4;4;0.6;4;4" keyTimes="0;0.46;0.5;0.54;1" dur="4.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/* Separator motif from the reference: full-width hairline with a small ✚ of
   two rounded 2×15px bars at its center (reference #8d3133 → our gold-deep). */
export function SeparatorRule({ className = "" }: { className?: string }) {
  return (
    <div className={`seprule ${className}`} aria-hidden="true">
      <span className="seprule__line" />
      <span className="seprule__plus">
        <i />
        <i />
      </span>
      <span className="seprule__line" />
    </div>
  );
}

/* Small centered ornament: ❦-style divider with rule ends */
export function Ornament({ className = "" }: { className?: string }) {
  return (
    <div className={`ornament ${className}`} aria-hidden="true">
      <svg viewBox="0 0 28 22" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2 v12 M14 14 l-8 6 M14 14 l8 6" strokeLinecap="round" />
      </svg>
    </div>
  );
}
