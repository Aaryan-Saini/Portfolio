/* ============================================================
   siteEffects.js — the imperative engine behind the editorial sections.
   GSAP + ScrollTrigger + Lenis, imported from npm.
   The Lenis instance is owned by lib/lenis.ts (one per page); every
   scroll-reactive block here subscribes through subscribeScroll().
   Live wiring: overlay menu (+ lazy nav plates), keyboard scrolling,
   in-page anchor glides, footer word cycle, scroll-scrubbed footer
   reveal, pointer-cursor class, and the Lenis ↔ ScrollTrigger boot with
   its coalesced refresh. The former hero/contact/footer WebGL routines,
   the old console preloader and the v1/v2 section behaviours were removed
   once their markup left the site.
   ============================================================ */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createLenis, subscribeScroll } from "@/lib/lenis";

// Run-once guard: prevents double-initialisation under React StrictMode
// (which mounts effects twice in development).
let booted = false;

export default function initSiteEffects() {
  if (booted) return;
  booted = true;

  const root = document.documentElement;
  const body = document.body;
  root.classList.remove("no-js");

  // `(pointer: coarse)` / `(hover: none)` only describe the PRIMARY input, so a
  // Windows touchscreen laptop with a mouse reports a fine pointer and never
  // matches — the marquee's swipe mode would stay off on a device you can
  // actually swipe. Flag genuine touch capability instead.
  if (navigator.maxTouchPoints > 0 || "ontouchstart" in window) {
    root.classList.add("is-touch");
  }

  // Reveal the off-screen fixed footer only once web fonts have settled, so its
  // late font-swap reflow (behind the preloader, below the fold) isn't recorded
  // as a layout shift (CLS). Paired with the `.fonts-ready` CSS guard in
  // globals.css. No visual effect — the footer isn't on screen during load.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => root.classList.add("fonts-ready"));
  } else {
    root.classList.add("fonts-ready");
  }

  const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ----------------------------------------------------------
     Always-on wiring (independent of GSAP)
  ---------------------------------------------------------- */
  function wireMenu() {
    const toggle = $("#menuToggle");
    const nav = $("#overlayNav");
    if (!toggle || !nav) return;

    // Rail preview plates are rendered without src (OverlayNav) so they cost
    // nothing at load; they are fetched in an idle slot once the boot overlay
    // is gone, or at once on the first intent to open the menu.
    let platesLoaded = false;
    const loadPlates = () => {
      if (platesLoaded) return;
      platesLoaded = true;
      $$("img[data-src]", nav).forEach((img) => {
        img.src = img.dataset.src;
        img.removeAttribute("data-src");
      });
    };
    toggle.addEventListener("pointerenter", loadPlates, { once: true });
    toggle.addEventListener("focus", loadPlates, { once: true });
    toggle.addEventListener("click", loadPlates, { once: true });
    const idleLoadPlates = () => {
      if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(loadPlates, { timeout: 4000 });
      else setTimeout(loadPlates, 1500);
    };
    if (root.classList.contains("plx-lock")) window.addEventListener("plx:done", idleLoadPlates, { once: true });
    else idleLoadPlates();

    const setState = (open) => {
      body.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      nav.setAttribute("aria-hidden", String(!open));
      // fresh open starts with an empty image well
      if (!open) delete nav.dataset.preview;
      // lock the background: pause smooth-scroll + block native/touch scroll
      // (never restart it from a stray Escape while the boot overlay still holds it)
      if (window.__lenis) {
        if (open) window.__lenis.stop();
        else if (!root.classList.contains("plx-lock")) window.__lenis.start();
      }
    };
    toggle.addEventListener("click", () => setState(!body.classList.contains("nav-open")));
    $$("a", nav).forEach((a) => a.addEventListener("click", () => setState(false)));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setState(false); });

    // Rail image well — data-preview follows the hovered/focused row and
    // PERSISTS between rows (a pure :hover approach blanks out in the gap
    // between links, which reads as flicker). CSS crossfades the plates.
    $$(".overlay-nav__list a[data-no]", nav).forEach((a) => {
      const show = () => { nav.dataset.preview = a.dataset.no; };
      a.addEventListener("mouseenter", show);
      a.addEventListener("focusin", show);
    });
  }

  /* Keyboard scrolling — Lenis does not intercept keys, so arrows / Space /
     PageUp-Down / Home-End would jump natively while wheel and touch glide.
     Routed through lenis.scrollTo so every input behaves the same way. */
  function wireKeyboardScroll() {
    const FIELD = /^(input|textarea|select|option)$/i;
    const ACTIVATES_ON_SPACE = /^(button|a|summary|label)$/i;
    const page = () => window.innerHeight * 0.9;

    window.addEventListener("keydown", (e) => {
      const lenis = window.__lenis;
      if (!lenis || e.defaultPrevented) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // never steal keys from a form field, an editor, or the open menu
      const t = e.target;
      if (t && (FIELD.test(t.tagName) || t.isContentEditable)) return;
      if (body.classList.contains("nav-open")) return;
      // Space must still activate whatever control has focus
      if (e.key === " " && t && ACTIVATES_ON_SPACE.test(t.tagName)) return;

      const from = lenis.targetScroll;
      let to;
      switch (e.key) {
        case "ArrowDown": to = from + 130; break;
        case "ArrowUp": to = from - 130; break;
        case "PageDown": to = from + page(); break;
        case "PageUp": to = from - page(); break;
        case " ": to = from + (e.shiftKey ? -page() : page()); break;
        case "Home": to = 0; break;
        case "End": to = lenis.limit; break;
        default: return;
      }
      e.preventDefault();
      lenis.scrollTo(Math.max(0, Math.min(to, lenis.limit)), { duration: 0.9 });
    });
  }

  /* In-page anchors — glide under Lenis instead of teleporting.
     A native hash jump lands instantly here: while Lenis is active the
     `.lenis-smooth` rule in globals.css forces `scroll-behavior: auto`, and
     Lenis never animates a jump it didn't perform itself. So every same-page
     #hash link is intercepted and handed to lenis.scrollTo — the overlay-nav
     items (Selected Work / Résumé / Contact), the skip-link, in-copy jumps. */
  function wireAnchors() {
    const chrome = $("#chrome");

    // clearance under the fixed top bar, so a target never lands beneath it
    const headroom = () => {
      if (!chrome) return 12;
      const pos = getComputedStyle(chrome).position;
      return (pos === "fixed" || pos === "sticky" ? chrome.offsetHeight : 0) + 12;
    };

    const targetOf = (hash) => {
      if (!hash || hash.length < 2) return null;
      let id = hash.slice(1);
      try { id = decodeURIComponent(id); } catch (e) {}
      return document.getElementById(id);
    };

    const glideTo = (el) => {
      const lenis = window.__lenis;
      // The footer is position:fixed and uncovered by scrolling the page off
      // its bottom edge — its own box offset is meaningless, so aim at the
      // bottom of the document and let the reveal play out.
      if (getComputedStyle(el).position === "fixed") {
        const bottom = document.documentElement.scrollHeight - window.innerHeight;
        if (lenis) lenis.scrollTo(bottom, { duration: 1.5 });
        else window.scrollTo({ top: bottom, behavior: REDUCE ? "auto" : "smooth" });
        return;
      }
      if (lenis) {
        lenis.scrollTo(el, { offset: -headroom(), duration: 1.35 });
      } else {
        const y = el.getBoundingClientRect().top + (window.scrollY || 0) - headroom();
        window.scrollTo({ top: y, behavior: REDUCE ? "auto" : "smooth" });
      }
    };

    // Delegated, so links rendered later (or by React) are covered too. Runs on
    // bubble — after the overlay-nav's own handler has closed the menu and
    // restarted Lenis, which is why the scroll isn't swallowed by the lock.
    document.addEventListener("click", (e) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target instanceof Element ? e.target.closest('a[href*="#"]') : null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;

      // same-document links only (href="#work", or "/path#work" on this page)
      let url;
      try { url = new URL(a.href, location.href); } catch (err) { return; }
      if (url.origin !== location.origin || url.pathname !== location.pathname) return;

      const el = targetOf(url.hash);
      if (!el) return;

      e.preventDefault();
      glideTo(el);
      if (history.replaceState) history.replaceState(null, "", url.hash);
      // keyboard users carry on from the target — preventScroll so the focus
      // call doesn't yank the viewport out from under the Lenis tween.
      if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
      el.focus({ preventScroll: true });
    });
  }

  /* Footer headline accent word — cycles through QA verbs (test → break →
     automate …) with a fade-up swap, like the changing word in the reference.
     The visible word stays put if JS/reduced-motion is off. */
  function wireFooterWordCycle() {
    const el = $("[data-cycle]");
    if (!el || REDUCE) return;
    const words = el.getAttribute("data-cycle").split(",").map((s) => s.trim()).filter(Boolean);
    if (words.length < 2) return;
    let i = 0;
    setInterval(() => {
      el.classList.add("is-out");
      setTimeout(() => {
        i = (i + 1) % words.length;
        el.textContent = words[i];
        el.classList.remove("is-out");
      }, 340);
    }, 2200);
  }

  /* Footer reveal — SCROLL-SCRUBBED.
     As the page slides up to uncover the fixed footer, the section above
     (.contact) recedes (lift + scale + dim) while the footer content rises and
     fades into place in uncover order (base → cols → big wordmark). Continuous
     and reversible — tied to scroll position, like the reference reveal. */
  function wireFooterReveal() {
    const footer = document.getElementById("footer");
    const contact = document.getElementById("contact");
    const page = document.getElementById("page");
    if (!footer || REDUCE) return;

    // Page geometry cached once (and refreshed whenever it can change) so the
    // per-frame update below never reads scrollHeight — a layout read inside a
    // scroll handler forces synchronous reflow when anything dirtied layout.
    let maxScroll = 0, zone = 1, lastT = -1;
    const measure = () => {
      maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      zone = window.innerHeight || 1;
      lastT = -1; // repaint with fresh geometry
    };

    const inner = footer.querySelector(".footer__inner");
    const giant = footer.querySelector(".footer__giant");
    const clouds = Array.from(footer.querySelectorAll(".footer__cloudimg"));
    // per-cloud parallax: left bank slides in from the left, right bank from the
    // right; both fade to their resting opacity as the footer is uncovered.
    const CLOUD_DX = [-9, 9];
    const CLOUD_OP = [.55, .55];

    const clamp = (v) => Math.min(Math.max(v, 0), 1);
    const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);

    // initial hidden state (progressive enhancement: visible if JS fails)
    if (inner) { inner.style.opacity = "0"; inner.style.transform = "translateY(44px)"; }
    if (giant) { giant.style.opacity = "0"; giant.style.transform = "translateX(-50%) translateY(56px)"; }
    clouds.forEach((c, i) => {
      c.style.opacity = "0";
      c.style.transform = "translate(" + (CLOUD_DX[i] || 0) + "vw, 24px)";
    });

    // Runs on the Lenis frame with the scroll value Lenis just wrote — no second
    // requestAnimationFrame, so the footer never trails the page by a frame.
    const currentScroll = () => (window.__lenis ? window.__lenis.scroll : (window.scrollY || 0));
    function update(scroll) {
      const dist = maxScroll - scroll;                   // px from page bottom
      const t = clamp(1 - dist / zone);                  // 0 -> 1 into the reveal
      // Every style below derives from t alone; while the footer is covered t
      // is pinned at 0, so mid-page scrolling skips all of these writes.
      if (t === lastT) return;
      lastT = t;

      // content rises and fades in; the giant wordmark follows a touch later.
      // Tighter windows than before (0.45/0.5 of the reveal zone) so the footer
      // reads at full strength well before the page bottoms out.
      if (inner) {
        const e = easeOut(t / 0.45);
        inner.style.opacity = String(e);
        inner.style.transform = "translateY(" + ((1 - e) * 44) + "px)";
      }
      if (giant) {
        const e = easeOut((t - 0.08) / 0.5);
        giant.style.opacity = String(e);
        giant.style.transform = "translateX(-50%) translateY(" + ((1 - e) * 56) + "px)";
      }

      // clouds drift in (parallax, each at its own speed) and fade as the footer
      // is uncovered — scroll-driven, so they only appear within the reveal and
      // hold still when you stop scrolling.
      if (clouds.length) {
        const e = easeOut((t - 0.1) / 0.75);
        for (let i = 0; i < clouds.length; i++) {
          clouds[i].style.opacity = String((CLOUD_OP[i] || .5) * e);
          clouds[i].style.transform =
            "translate(" + ((1 - e) * (CLOUD_DX[i] || 0)) + "vw, " + ((1 - e) * 24) + "px)";
        }
      }

      // section above recedes "behind" as the footer rises (gentle fade)
      if (contact) {
        const e = easeOut(t);
        contact.style.opacity = String(1 - e * 0.3);
        contact.style.transform = "translateY(" + (-e * 20) + "px) scale(" + (1 - e * 0.025) + ")";
      }
    };
    // Page margin-bottom matches the footer height. Driven by a ResizeObserver
    // on the footer (delivered after layout, so the offsetHeight read is free
    // and out of the boot task); it fires once on observe, on the font swap
    // and on any real change of the footer's box.
    if (page) {
      const setFooterMargin = () => {
        page.style.marginBottom = footer.offsetHeight + "px";
        measure(); // the margin moves the page bottom
        update(currentScroll());
      };
      if ("ResizeObserver" in window) {
        new ResizeObserver(setFooterMargin).observe(footer);
      } else {
        setFooterMargin();
        window.addEventListener("resize", setFooterMargin, { passive: true });
      }
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(setFooterMargin);
      }
    }

    const onScroll = ({ scroll }) => update(scroll);
    const onResize = () => { measure(); update(currentScroll()); };
    subscribeScroll(onScroll); // Lenis frame (native scroll under reduced motion)
    addEventListener("resize", onResize, { passive: true });
    window.addEventListener("load", onResize, { once: true });
    measure();
    update(currentScroll());
  }

  /* ----------------------------------------------------------
     Glow cursor + comet trail (pointer devices only).
     · Core follows INSTANTLY on mousemove (zero lag).
     · Glow halo lerps closely behind (snappy but soft).
     · Canvas draws, additively, a smooth velocity-reactive glow ribbon
       (no scattered particles). All glow is one pre-rendered sprite →
       cheap bloom, single rAF, no layout work.
  ---------------------------------------------------------- */
  function wireCursor() {
    const wrap = $("#cursorx"), core = $("#cxCore"), glow = $("#cxGlow"), canvas = $("#cursorTrail");
    if (!wrap) return;
    if (REDUCE || window.matchMedia("(hover: none), (pointer: coarse)").matches) {
      wrap.style.display = "none"; if (canvas) canvas.style.display = "none"; return;
    }
    body.classList.add("has-cursor");
    // The custom cursor layer is fully disabled in CSS (display:none !important
    // on .cursorx / .cursor-trail). Only the has-cursor class above still has
    // an effect (pointer cursors on links/buttons) — skip the mousemove + rAF
    // + full-viewport canvas work, which would otherwise render invisibly on
    // every mouse move.
    if (getComputedStyle(wrap).display === "none") return;
    wrap.style.opacity = "0"; // appear only once the pointer first moves
    const ctx = canvas.getContext("2d");
    let dpr = Math.min(2, window.devicePixelRatio || 1);
    function resize() {
      canvas.width = Math.floor(innerWidth * dpr);
      canvas.height = Math.floor(innerHeight * dpr);
      canvas.style.width = innerWidth + "px";
      canvas.style.height = innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    addEventListener("resize", resize, { passive: true });

    // pre-rendered soft glow sprite — drawn additively for cheap bloom
    const sprite = document.createElement("canvas"); sprite.width = sprite.height = 128;
    const sx = sprite.getContext("2d");
    const sg = sx.createRadialGradient(64, 64, 0, 64, 64, 64);
    sg.addColorStop(0.00, "rgba(255,248,231,1)");
    sg.addColorStop(0.20, "rgba(246,224,160,0.72)");
    sg.addColorStop(0.50, "rgba(214,172,92,0.26)");
    sg.addColorStop(1.00, "rgba(135, 206, 235,0)");
    sx.fillStyle = sg; sx.beginPath(); sx.arc(64, 64, 64, 0, Math.PI * 2); sx.fill();

    let mx = innerWidth / 2, my = innerHeight / 2;   // exact pointer (target)
    let px = mx, py = my;                             // previous (for velocity)
    let gx = mx, gy = my;                             // glow halo (smoothed)
    let visible = false, hover = false;
    const trail = [];                                 // recent points {x,y}
    const TRAIL_MAX = 24;
    const now = () => (window.performance && performance.now ? performance.now() : Date.now());

    // The trail canvas is a full-viewport, screen-blended layer; redrawing it
    // every frame forever (even with the pointer dead still) is the cursor's
    // biggest cost. So the rAF loop runs only while there's something to
    // animate — pointer moving or trail still receding — and parks itself once
    // settled. The sharp core + soft glow are CSS elements, so the cursor stays
    // fully visible at rest; only the comet stops being recomputed.
    let rafId = 0;
    let lastMove = 0;
    const wake = () => { if (!rafId) rafId = requestAnimationFrame(frame); };

    addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      lastMove = now();
      // zero-lag core: write transform directly each move
      core.style.transform = "translate3d(" + mx + "px," + my + "px,0) translate(-50%,-50%)";
      if (!visible) { visible = true; wrap.style.opacity = "1"; }
      wake();
    }, { passive: true });

    // NB: inputs/textarea deliberately excluded — the cursor stays its normal
    // state over the form instead of swelling into the hover ring.
    const isInteractive = (t) => t && t.closest("a, button, [data-cursor='link']");
    document.addEventListener("mouseover", (e) => { if (isInteractive(e.target)) { wrap.classList.add("is-hover"); hover = true; wake(); } });
    document.addEventListener("mouseout", (e) => { if (isInteractive(e.target)) { wrap.classList.remove("is-hover"); hover = false; wake(); } });
    document.addEventListener("mouseleave", () => { wrap.style.opacity = "0"; });

    function frame() {
      rafId = 0;
      const idle = now() - lastMove > 80; // tightened from 120ms: park the rAF sooner when cursor is still

      // pointer velocity
      const vx = mx - px, vy = my - py; px = mx; py = my;
      const speed = Math.hypot(vx, vy);

      // glow halo — snappy yet soft
      gx += (mx - gx) * 0.3; gy += (my - gy) * 0.3;
      glow.style.transform = "translate3d(" + gx + "px," + gy + "px,0) translate(-50%,-50%)";

      // record comet path — while idle, drain it so the ribbon recedes, then stops
      if (idle) { if (trail.length) trail.shift(); }
      else { trail.push({ x: mx, y: my }); if (trail.length > TRAIL_MAX) trail.shift(); }

      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.globalCompositeOperation = "lighter";

      // ---- smooth comet ribbon: wide soft bloom pass + bright core pass ----
      // Drawn as quadratic curves through segment midpoints so the trail is a
      // flowing line, never angular — and with no scattered dots.
      const n = trail.length;
      const vf = Math.max(1, Math.min(2.2, 1 + speed / 36));   // velocity → thickness
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      if (n > 2) {
        for (let pass = 0; pass < 2; pass++) {
          for (let i = 1; i < n - 1; i++) {
            const t = i / n;                                   // 0 tail → 1 head
            const p0 = trail[i - 1], p1 = trail[i], p2 = trail[i + 1];
            const m0x = (p0.x + p1.x) / 2, m0y = (p0.y + p1.y) / 2;
            const m1x = (p1.x + p2.x) / 2, m1y = (p1.y + p2.y) / 2;
            if (pass === 0) { ctx.strokeStyle = "rgba(221,180,108," + (t * t * 0.20) + ")"; ctx.lineWidth = t * vf * 15; }
            else { ctx.strokeStyle = "rgba(255,244,214," + (t * t * 0.55) + ")"; ctx.lineWidth = t * vf * 4.2; }
            ctx.beginPath(); ctx.moveTo(m0x, m0y); ctx.quadraticCurveTo(p1.x, p1.y, m1x, m1y); ctx.stroke();
          }
        }
      }

      // ---- glowing head bloom (the cursor itself) ----
      const hs = (hover ? 72 : 46) + Math.min(64, speed * 0.7);
      ctx.globalAlpha = 0.9;
      ctx.drawImage(sprite, mx - hs / 2, my - hs / 2, hs, hs);
      ctx.globalAlpha = 1;

      // Park the loop once everything has settled (no motion, ribbon gone, glow
      // caught up). It restarts instantly on the next mousemove/hover via wake().
      const glowSettled = Math.abs(mx - gx) < 0.5 && Math.abs(my - gy) < 0.5;
      const settled = idle && n === 0 && glowSettled;
      if (settled || document.hidden) { ctx.clearRect(0, 0, innerWidth, innerHeight); return; } // parked
      rafId = requestAnimationFrame(frame);
    }
  }

  /* ----------------------------------------------------------
     MAIN — GSAP world
  ---------------------------------------------------------- */
  function initGSAP() {
    const ST = ScrollTrigger;
    gsap.registerPlugin(ST);
    // Mobile browsers resize the viewport every time the address bar shows or
    // hides mid-scroll; by default ScrollTrigger then re-measures every
    // trigger on the spot — a visible hitch. Only real resizes (orientation,
    // window) refresh now; Lenis keeps its own limit fresh via autoResize.
    ST.config({ ignoreMobileResize: true });

    // One coalesced ScrollTrigger.refresh per frame, and none while the boot
    // overlay still holds the page (its plx:done pass follows and supersedes
    // it). Window load is covered by ScrollTrigger's own listener.
    let refreshRaf = 0;
    const queueRefresh = () => {
      cancelAnimationFrame(refreshRaf);
      refreshRaf = requestAnimationFrame(() => {
        refreshRaf = 0;
        if (root.classList.contains("plx-lock")) return;
        ST.refresh();
      });
    };

    /* ---- Lenis smooth scroll ----
       One instance for the whole page, built by lib/lenis.ts (the tuning
       lives there too) and driven from the GSAP ticker, so Lenis,
       ScrollTrigger and every subscribeScroll() consumer advance on the
       same frame. Skipped under prefers-reduced-motion: the page then
       scrolls natively and the subscribers fall back to the native scroll
       event on their own. */
    if (!REDUCE) {
      const lenis = createLenis();
      lenis.on("scroll", ST.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);

      // Boot overlay: html.plx-lock only hides the scrollbar — programmatic
      // scrolling still works under overflow:hidden, so wheel/touch input
      // during the preloader would drag the page along beneath it. Park
      // Lenis until the overlay reports done, then re-measure once: every
      // trigger was created behind the veil, and plx:done arrives after the
      // veil has left the DOM. (Lenis tracks the document height itself.)
      if (root.classList.contains("plx-lock")) {
        lenis.stop();
        window.addEventListener("plx:done", () => {
          lenis.start();
          queueRefresh();
        }, { once: true });
      }
    }

    /* ---- Always-on wiring ---- */
    wireMenu(); wireAnchors(); wireKeyboardScroll(); wireFooterReveal(); wireFooterWordCycle();
    wireCursor();

    /* ---- Refresh once the web fonts have settled (coalesced; skipped while the
            boot overlay holds the page — its plx:done pass covers that case) ---- */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(queueRefresh);
  }

  /* ----------------------------------------------------------
     Boot
  ---------------------------------------------------------- */
  initGSAP();
}
