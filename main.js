/* ============================================================
   AURELIA SINCLAIR — main.js
   GSAP + ScrollTrigger + Lenis.
   Highlights:
   · Fountain-pen scroll animation that stops at EXACTLY 50% page scroll
   · Sticky-hero overlap, word-by-word about reveal, scramble headline
   · Pinned horizontal project gallery with thumbnail scrubber
   ============================================================ */
(function () {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  root.classList.remove("no-js");

  const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const HAS_GSAP = !!(window.gsap && window.ScrollTrigger);

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const SPACE = " ";

  /* ----------------------------------------------------------
     0 · Graceful degradation — if GSAP failed to load, show
        all content and skip the rich behaviour.
  ---------------------------------------------------------- */
  function bailToStatic() {
    root.classList.add("no-js");
    body.removeAttribute("data-loading");
    body.classList.add("is-ready");
    const pre = $("#preloader");
    if (pre) pre.style.display = "none";
    wireMenu(); wireClock(); wireForm(); wireToTop(); wireMedia(); wireIntent(); wireFooterReveal(); wirePanelVideos();
    contactSmokeGL(); // GSAP-independent; smoke still renders without it
    footerCometGL();  // footer aurora-comet shader — always-on
  }

  /* ----------------------------------------------------------
     Always-on wiring (independent of GSAP)
  ---------------------------------------------------------- */
  function wireMenu() {
    const toggle = $("#menuToggle");
    const nav = $("#overlayNav");
    if (!toggle || !nav) return;
    const setState = (open) => {
      body.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      nav.setAttribute("aria-hidden", String(!open));
      // lock the background: pause smooth-scroll + block native/touch scroll
      if (window.__lenis) open ? window.__lenis.stop() : window.__lenis.start();
    };
    toggle.addEventListener("click", () => setState(!body.classList.contains("nav-open")));
    $$("a", nav).forEach((a) => a.addEventListener("click", () => setState(false)));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setState(false); });
  }

  function wireClock() {
    const els = $$("[data-clock]");
    if (!els.length) return;
    const tick = () => {
      const t = new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        timeZone: "Europe/London", hour12: false,
      });
      els.forEach((el) => (el.textContent = t));
    };
    tick();
    setInterval(tick, 1000);
  }

  function wireForm() {
    const form = $("#contactForm");
    if (!form) return;
    const note = $("#formNote");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        note.textContent = "Please complete every field before sending.";
        return;
      }
      const name = (form.querySelector("#cName").value || "there").split(" ")[0];
      note.textContent = "Thank you, " + name + ". This is a demo form — write to hello@aureliasinclair.com directly.";
      form.reset();
    });
  }

  // Contact intent chips — set the active reason and prefill the brief.
  function wireIntent() {
    const chips = $$(".chip");
    const msg = $("#cMsg");
    if (!chips.length) return;
    const prefixes = chips.map((c) => c.dataset.intent + " — ");
    chips.forEach((c) => c.addEventListener("click", () => {
      chips.forEach((x) => { const on = x === c; x.classList.toggle("is-active", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
      if (!msg) return;
      let v = msg.value;
      prefixes.forEach((p) => { if (v.startsWith(p)) v = v.slice(p.length); }); // drop any prior intent prefix
      msg.value = c.dataset.intent + " — " + v;
      msg.focus();
      try { const end = msg.value.length; msg.setSelectionRange(end, end); } catch (e) { }
    }));
  }

  // If a remote image (picsum) fails, fade it out so the elegant duotone
  // background of .panel__media shows instead of a broken-image icon.
  function wireMedia() {
    $$(".panel__media img").forEach((img) => {
      const fail = () => img.classList.add("is-broken");
      if (img.complete && img.naturalWidth === 0) fail();
      img.addEventListener("error", fail);
    });
  }

  // Force-autoplay all demo videos in the projects section, looping forever.
  // Uses IntersectionObserver as a fallback for browsers that block autoplay
  // until the element is actually visible.
  function wirePanelVideos() {
    const videos = $$(".panel__video-demo");
    if (!videos.length) return;
    videos.forEach((v) => {
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      // Try immediate play; if blocked, observe visibility and play on enter.
      const tryPlay = () => { v.play().catch(() => { }); };
      tryPlay();
      if ("IntersectionObserver" in window) {
        const obs = new IntersectionObserver((entries) => {
          entries.forEach((e) => { if (e.isIntersecting) tryPlay(); });
        }, { threshold: 0.1 });
        obs.observe(v);
      }
    });
  }

  function wireToTop() {
    const btn = $("#toTop");
    if (!btn) return;
    btn.addEventListener("click", () => {
      if (window.__lenis) window.__lenis.scrollTo(0, { duration: 1.6 });
      else window.scrollTo({ top: 0, behavior: REDUCE ? "auto" : "smooth" });
    });
  }

  /* Footer reveal — SCROLL-SCRUBBED.
     As the page slides up to uncover the fixed footer, the section above
     (.contact) recedes (lift + scale + dim) while the footer content rises and
     fades into place in uncover order (base → cols → big wordmark). Continuous
     and reversible — tied to scroll position, like the reference reveal. */
  function wireFooterReveal() {
    const footer = document.getElementById("footer");
    const contact = document.getElementById("contact");
    if (!footer || REDUCE) return;
    const big = footer.querySelector(".footer__big");
    const cols = footer.querySelector(".footer__cols");
    const base = footer.querySelector(".footer__base");

    const clamp = (v) => Math.min(Math.max(v, 0), 1);
    const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);

    // initial hidden state (progressive enhancement: visible if JS fails)
    [base, cols, big].forEach((el) => { if (el) { el.style.opacity = "0"; el.style.transform = "translateY(48px)"; } });

    const setGroup = (el, t, offset) => {
      if (!el) return;
      const e = easeOut(t);
      el.style.opacity = String(e);
      el.style.transform = "translateY(" + ((1 - e) * offset) + "px)";
    };

    let ticking = false;
    const update = () => {
      ticking = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const dist = max - (window.scrollY || 0);          // px from page bottom
      const zone = window.innerHeight;                   // reveal across last viewport
      const t = clamp(1 - dist / zone);                  // 0 -> 1 into the reveal

      // footer content rises in uncover order (bottom-up), grouped at the footer base
      setGroup(base, t / 0.32, 36);
      setGroup(cols, (t - 0.16) / 0.36, 46);
      if (big) {
        const e = easeOut((t - 0.34) / 0.42);            // wordmark last
        big.style.opacity = String(e);
        big.style.transform = "translateY(" + ((1 - e) * 60) + "px) scale(" + (0.95 + e * 0.05) + ")";
        big.style.transformOrigin = "left bottom";
      }

      // section above recedes "behind" as the footer rises (gentle — the
      // revealed area is now ink, so this reads as a soft fade, not a shrink)
      if (contact) {
        const e = easeOut(t);
        contact.style.opacity = String(1 - e * 0.3);
        contact.style.transform = "translateY(" + (-e * 20) + "px) scale(" + (1 - e * 0.025) + ")";
      }
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll, { passive: true });
    update();
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
    sg.addColorStop(1.00, "rgba(200,164,92,0)");
    sx.fillStyle = sg; sx.beginPath(); sx.arc(64, 64, 64, 0, Math.PI * 2); sx.fill();

    let mx = innerWidth / 2, my = innerHeight / 2;   // exact pointer (target)
    let px = mx, py = my;                             // previous (for velocity)
    let gx = mx, gy = my;                             // glow halo (smoothed)
    let visible = false, hover = false;
    const trail = [];                                 // recent points {x,y}
    const TRAIL_MAX = 24;

    addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      // zero-lag core: write transform directly each move
      core.style.transform = "translate3d(" + mx + "px," + my + "px,0) translate(-50%,-50%)";
      if (!visible) { visible = true; wrap.style.opacity = "1"; }
    }, { passive: true });

    // NB: inputs/textarea deliberately excluded — the cursor stays its normal
    // state over the form instead of swelling into the hover ring.
    const isInteractive = (t) => t && t.closest("a, button, [data-cursor='link']");
    document.addEventListener("mouseover", (e) => { if (isInteractive(e.target)) { wrap.classList.add("is-hover"); hover = true; } });
    document.addEventListener("mouseout", (e) => { if (isInteractive(e.target)) { wrap.classList.remove("is-hover"); hover = false; } });
    document.addEventListener("mouseleave", () => { wrap.style.opacity = "0"; });

    function frame() {
      // pointer velocity
      const vx = mx - px, vy = my - py; px = mx; py = my;
      const speed = Math.hypot(vx, vy);

      // glow halo — snappy yet soft
      gx += (mx - gx) * 0.3; gy += (my - gy) * 0.3;
      glow.style.transform = "translate3d(" + gx + "px," + gy + "px,0) translate(-50%,-50%)";

      // record comet path
      trail.push({ x: mx, y: my });
      if (trail.length > TRAIL_MAX) trail.shift();

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

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ----------------------------------------------------------
     IntersectionObserver reveals + counters + rail highlight
     (robust, GSAP-independent)
  ---------------------------------------------------------- */
  function wireReveals() {
    const items = $$("[data-reveal], .reveal-up");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
    items.forEach((el) => io.observe(el));
  }

  function wireCounters() {
    const nums = $$("[data-count-to]");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        io.unobserve(el);
        const to = parseFloat(el.dataset.countTo);
        const suffix = el.dataset.suffix || "";
        if (REDUCE) { el.textContent = to + suffix; return; }
        const dur = 1400, t0 = performance.now();
        const step = (now) => {
          const p = Math.min(1, (now - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(to * eased) + suffix;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    nums.forEach((n) => io.observe(n));
  }

  /* ----------------------------------------------------------
     Text splitting helpers
  ---------------------------------------------------------- */
  function splitChars(el) {
    const text = el.textContent;
    el.textContent = "";
    el.setAttribute("aria-label", text);
    const chars = [];
    for (const ch of text) {
      if (ch === " ") { el.appendChild(document.createTextNode(" ")); continue; }
      const wrap = document.createElement("span");
      wrap.className = "char";
      wrap.style.display = "inline-block";
      wrap.style.overflow = "hidden";
      wrap.style.verticalAlign = "top";
      const inner = document.createElement("span");
      inner.className = "char__in";
      inner.style.display = "inline-block";
      inner.textContent = ch;
      wrap.appendChild(inner);
      el.appendChild(wrap);
      chars.push(inner);
    }
    return chars;
  }

  function splitWords(el) {
    const text = el.textContent.replace(/\s+/g, " ").trim();
    el.textContent = "";
    el.setAttribute("aria-label", text);
    const inners = [];
    text.split(" ").forEach((word) => {
      const w = document.createElement("span"); w.className = "word";
      const inner = document.createElement("span"); inner.className = "word__in";
      inner.textContent = word; w.appendChild(inner);
      el.appendChild(w);
      el.appendChild(document.createTextNode(" "));
      inners.push(inner);
    });
    return inners;
  }

  /* Scramble-decode an element's text in place (keeps gradient/clip intact) */
  function scrambleText(el, finalText, done) {
    const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+/<>".split("");
    const chars = finalText.split("");
    let frame = 0;
    const settleAt = chars.map((_, i) => 6 + i * 2);
    const id = setInterval(() => {
      let out = "", allDone = true;
      chars.forEach((ch, i) => {
        if (ch.trim() === "") { out += ch; return; }
        if (frame >= settleAt[i]) { out += ch; }
        else { out += GLYPHS[(Math.random() * GLYPHS.length) | 0]; allDone = false; }
      });
      el.textContent = out;
      frame++;
      if (allDone) { clearInterval(id); el.textContent = finalText; if (done) done(); }
    }, 40);
  }

  /* ----------------------------------------------------------
     MAIN — GSAP world
  ---------------------------------------------------------- */
  function initGSAP() {
    const gsap = window.gsap;
    const ST = window.ScrollTrigger;
    gsap.registerPlugin(ST);

    /* ---- Lenis smooth scroll ---- */
    if (window.Lenis && !REDUCE) {
      const lenis = new window.Lenis({ lerp: 0.08, wheelMultiplier: 0.45, smoothWheel: true });
      window.__lenis = lenis;
      lenis.on("scroll", ST.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    /* ---- Preloader → reveal ---- */
    runPreloader(gsap, () => {
      body.removeAttribute("data-loading");
      body.classList.add("is-ready");
      ST.refresh();
    });

    /* ---- Always-on wiring ---- */
    wireMenu(); wireClock(); wireForm(); wireToTop(); wireMedia(); wireIntent(); wireFooterReveal(); wirePanelVideos();
    wireCursor(); wireReveals(); wireCounters();
    footerCometGL(); // footer aurora-comet shader

    /* ---- Story-progress bar ---- */
    const bar = $("#scrollProgress");
    if (bar) ST.create({ start: 0, end: () => ST.maxScroll(window), scrub: true, invalidateOnRefresh: true, onUpdate: (s) => gsap.set(bar, { scaleX: s.progress }) });

    /* ---- Section behaviours ---- */
    heroIntro(gsap);
    aboutReveal(gsap, ST);
    marquees(gsap);
    projectsGallery(gsap, ST);
    if (!contactSmokeGL()) contactSmoke(gsap);

    /* ---- Refresh after assets settle (image boxes are reserved via aspect-ratio,
            so layout is stable; window load covers late images) ---- */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ST.refresh());
    window.addEventListener("load", () => ST.refresh());
  }

  /* ---------- Preloader ---------- */
  function runPreloader(gsap, done) {
    const pre = $("#preloader");
    if (!pre || REDUCE) { if (pre) pre.style.display = "none"; done(); return; }
    const letters = $$(".preloader__monogram span");
    const bar = $(".preloader__bar i");
    const count = $("[data-count]");
    const tl = gsap.timeline({ onComplete: done });
    tl.to(letters, { y: 0, opacity: 1, duration: 0.9, ease: "expo.out", stagger: 0.08 })
      .to(bar, { width: "100%", duration: 1.5, ease: "power2.inOut" }, 0.2)
      .to(count, {
        duration: 1.5, ease: "power2.inOut",
        onUpdate: function () { count.textContent = String(Math.round(this.progress() * 100)).padStart(2, "0"); },
      }, 0.2)
      .to(".preloader__inner", { y: -30, opacity: 0, duration: 0.6, ease: "power2.in" }, "+=0.15")
      .to(pre, { yPercent: -100, duration: 0.9, ease: "expo.inOut" }, "-=0.2")
      .set(pre, { display: "none" });
  }

  /* ---------- Hero intro ---------- */
  function heroIntro(gsap) {
    const serif = $(".hero__line--serif");
    const sans = $(".hero__line--sans");
    const delay = REDUCE ? 0 : 1.7; // begins as the preloader lifts

    if (serif) {
      const chars = splitChars(serif);
      gsap.set(chars, { yPercent: 110 });
      gsap.to(chars, { yPercent: 0, duration: 1, ease: "expo.out", stagger: 0.025, delay: delay });
    }

    if (sans) {
      const finalText = sans.textContent;
      sans.setAttribute("aria-label", finalText); // keep correct text for screen readers during scramble
      if (REDUCE) {
        sans.textContent = finalText;
      } else {
        gsap.set(sans, { opacity: 0 });
        gsap.to(sans, { opacity: 1, duration: 0.5, delay: delay + 0.25 });
        setTimeout(() => scrambleText(sans, finalText), (delay + 0.25) * 1000);
      }
    }

    $$(".hero__eyebrow, .hero__lede").forEach((e) => e.classList.add("is-in"));
    gsap.fromTo(".hero__eyebrow, .hero__lede",
      { opacity: 0, y: 26 },
      { opacity: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.12, delay: delay + 0.4 });
  }

  /* ---------- About: word-by-word ink reveal (v1) ---------- */
  function aboutReveal(gsap, ST) {
    const el = $("[data-reveal-text]");
    if (!el) return;
    const words = splitWords(el);
    if (REDUCE) { words.forEach((w) => (w.style.color = "var(--wine-700)")); return; }
    gsap.to(words, {
      color: "#54121d", ease: "none", stagger: 0.32,
      scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 48%", scrub: 2 },
    });
  }

  /* ---------- Marquees ---------- */
  function marquees(gsap) {
    if (REDUCE) return;
    const skills = $(".marquee__track");
    if (skills) gsap.to(skills, { xPercent: -50, repeat: -1, duration: 50, ease: "none" });
    const foot = $(".footer__marquee-track");
    if (foot) gsap.to(foot, { xPercent: -50, repeat: -1, duration: 22, ease: "none" });
  }

  /* ---------- Contact: volumetric WebGL red-smoke background ----------
     Renders billowing fractal-noise (fbm) "smoke" tinted in the
     oxblood → crimson → gold palette to match the cinematic reference.
     Returns true on success; on any failure it returns false and the
     CSS blob smoke (.smoke) is used instead — so the page never breaks. */
  function contactSmokeGL() {
    const canvas = document.getElementById("contactSmoke");
    if (!canvas || canvas.dataset.glInit) return false;
    const section = document.getElementById("contact");

    let gl = null;
    try {
      const opts = { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "low-power" };
      gl = canvas.getContext("webgl", opts) || canvas.getContext("experimental-webgl", opts);
    } catch (e) { gl = null; }
    if (!gl) return false;

    const VERT =
      "attribute vec2 a_pos; varying vec2 v_uv;" +
      "void main(){ v_uv = a_pos*0.5 + 0.5; gl_Position = vec4(a_pos,0.0,1.0); }";

    const FRAG = [
      "precision highp float;",
      "varying vec2 v_uv;",
      "uniform vec2 u_res;",
      "uniform float u_time;",
      "float hash(vec2 p){ p=fract(p*vec2(123.34,345.45)); p+=dot(p,p+34.345); return fract(p.x*p.y); }",
      "float noise(vec2 p){",
      "  vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);",
      "  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x), mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x), u.y);",
      "}",
      "float fbm(vec2 p){",
      "  float v=0.0,a=0.5; mat2 m=mat2(1.6,1.2,-1.2,1.6);",
      "  for(int i=0;i<5;i++){ v+=a*noise(p); p=m*p; a*=0.5; }",
      "  return v;",
      "}",
      "void main(){",
      "  vec2 uv=v_uv;",
      "  float asp=u_res.x/max(u_res.y,1.0);",
      "  vec2 p=vec2((uv.x-0.5)*asp, uv.y-0.5)*2.6;",   // plume scale
      "  float t=u_time*0.05;",
      "  p.y -= t*0.35;",                                // gentle rise
      "  vec2 q=vec2(fbm(p+t), fbm(p+vec2(5.2,1.3)));",
      "  vec2 r=vec2(fbm(p+3.4*q+vec2(1.7,9.2)+0.10*t), fbm(p+3.4*q+vec2(8.3,2.8)-0.08*t));",
      "  float f=fbm(p+3.4*r);",
      "  vec2 c=vec2((uv.x-0.5)*asp, uv.y-0.34);",       // glow heart, upper-middle
      "  float glow=smoothstep(1.35,0.0,length(c)*0.9);",
      "  float d=smoothstep(0.30,0.86,f);",              // contrast: dark valleys + bright ridges
      "  d=d*(0.55+0.85*glow)+0.05;",                    // center brighter, faint ambient
      "  d=clamp(d,0.0,1.0);",
      "  vec3 cBlack=vec3(0.090,0.028,0.040);",   // ~wine-900 / ink — deep base
      "  vec3 cWine =vec3(0.219,0.051,0.075);",   // wine-800 #380d13 (dark-section bg)
      "  vec3 cRed  =vec3(0.329,0.071,0.114);",   // wine-700 #54121d (oxblood)
      "  vec3 cHot  =vec3(0.470,0.100,0.150);",   // brightened oxblood ~ wine-600
      "  vec3 cGold =vec3(0.840,0.668,0.408);",   // gold accent (theme)
      "  vec3 col=cBlack;",
      "  col=mix(col,cWine,smoothstep(0.0,0.40,d));",
      "  col=mix(col,cRed ,smoothstep(0.38,0.80,d));",
      "  col=mix(col,cHot ,smoothstep(0.74,1.0,d));",
      "  col=mix(col,cGold,smoothstep(0.94,1.0,d)*0.10);",
      "  float vig=smoothstep(1.42,0.36,length(vec2((uv.x-0.5)*asp,uv.y-0.5)));",
      "  col*=mix(0.56,1.0,vig);",
      "  col += (hash(uv*u_res + t)-0.5)*0.012;",        // dither out banding
      "  gl_FragColor=vec4(max(col,0.0),1.0);",
      "}"
    ].join("\n");

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { gl.deleteShader(s); return null; }
      return s;
    }
    const vs = compile(gl.VERTEX_SHADER, VERT), fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return false;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");

    const Q = Math.min(window.devicePixelRatio || 1, 1.5) * 0.85;  // soft → low res is fine
    let W = 0, H = 0;
    function resize() {
      const r = canvas.getBoundingClientRect();
      const w = Math.max(2, Math.round(r.width * Q)), h = Math.max(2, Math.round(r.height * Q));
      if (w === W && h === H) return;
      W = w; H = h; canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h); gl.uniform2f(uRes, w, h);
    }
    function draw(seconds) { resize(); gl.uniform1f(uTime, seconds); gl.drawArrays(gl.TRIANGLES, 0, 3); }

    canvas.dataset.glInit = "1";
    if (section) section.classList.add("smoke-gl");

    // Reduced motion: render a single still frame, no animation loop.
    if (REDUCE) {
      const r = () => draw(18.0);
      r(); window.addEventListener("resize", r, { passive: true });
      return true;
    }

    let raf = 0, t0 = null, inView = !("IntersectionObserver" in window);
    function tick(now) {
      if (t0 === null) t0 = now;
      draw((now - t0) / 1000);
      raf = requestAnimationFrame(tick);
    }
    function update() {
      const run = inView && !document.hidden;
      if (run && !raf) raf = requestAnimationFrame(tick);
      else if (!run && raf) { cancelAnimationFrame(raf); raf = 0; }
    }
    window.addEventListener("resize", () => { if (!raf) draw(t0 === null ? 0 : (performance.now() - t0) / 1000); }, { passive: true });
    if ("IntersectionObserver" in window && section) {
      new IntersectionObserver((ents) => { inView = ents[0].isIntersecting; update(); }, { threshold: 0 }).observe(section);
    }
    document.addEventListener("visibilitychange", update);
    update();
    return true;
  }

  /* ---------- Contact: flowing red-smoke background (CSS-blob fallback) ---------- */
  function contactSmoke(gsap) {
    if (REDUCE) return;
    const smokes = $$(".smoke");
    if (!smokes.length) return;
    const moves = [
      { x: 70, y: -50, r: 14 }, { x: -60, y: 40, r: -12 }, { x: 50, y: 60, r: 10 },
      { x: -70, y: -40, r: -16 }, { x: 40, y: -55, r: 12 },
    ];
    smokes.forEach((s, i) => {
      const m = moves[i % moves.length];
      gsap.to(s, { x: m.x, y: m.y, scale: 1.18, duration: 9 + i * 1.6, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(s, { rotation: m.r, duration: 16 + i * 2.4, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(s, { opacity: 0.7, duration: 6 + i * 1.2, repeat: -1, yoyo: true, ease: "sine.inOut", delay: i * 0.4 });
    });
  }

  /* ---------- Footer: aurora-comet WebGL shader (themed) ----------
     Ports the React Three.js aurora shader to raw WebGL, recolored in
     oxblood / wine / gold so the comets match the site palette.
     Returns true on success; silently no-ops on WebGL unavailability. */
  function footerCometGL() {
    const canvas = document.getElementById("footerShader");
    if (!canvas || canvas.dataset.glInit) return false;
    const footer = document.getElementById("footer");

    let gl = null;
    try {
      const opts = { alpha: true, antialias: false, depth: false, stencil: false, powerPreference: "low-power" };
      gl = canvas.getContext("webgl", opts) || canvas.getContext("experimental-webgl", opts);
    } catch (e) { gl = null; }
    if (!gl) return false;

    /* Vertex shader passes a UV varying the fragment shader uses */
    const VERT =
      "attribute vec2 a_pos; varying vec2 v_uv;" +
      "void main(){ v_uv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0.0, 1.0); }";

    /* WebGL 1.0 / GLSL ES 1.0-verified fragment shader —
       same fbm pattern as contactSmokeGL (confirmed working) but with
       distinct viewport / scale / speed so the footer looks different.
       Key differences vs contact: larger plume scale (3.4 vs 2.6),
       faster drift (0.08 vs 0.05), brighter gold accent, glow heart
       shifted lower (uv.y - 0.7) for a horizon-rising effect. */
    const FRAG = [
      "precision highp float;",
      "varying vec2 v_uv;",
      "uniform vec2 u_res;",
      "uniform float u_time;",
      "float hash(vec2 p){ p=fract(p*vec2(123.34,345.45)); p+=dot(p,p+34.345); return fract(p.x*p.y); }",
      "float noise(vec2 p){",
      "  vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);",
      "  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x), mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x), u.y);",
      "}",
      "float fbm(vec2 p){",
      "  float v=0.0,a=0.5; mat2 m=mat2(1.6,1.2,-1.2,1.6);",
      "  for(int i=0;i<5;i++){ v+=a*noise(p); p=m*p; a*=0.5; }",
      "  return v;",
      "}",
      "void main(){",
      "  vec2 uv=v_uv;",
      "  float asp=u_res.x/max(u_res.y,1.0);",
      "  vec2 p=vec2((uv.x-0.5)*asp, uv.y-0.5)*3.4;",       // larger plume
      "  float t=u_time*0.08;",                              // faster drift
      "  p.y -= t*0.42;",                                    // brisker upward flow
      "  vec2 q=vec2(fbm(p+t), fbm(p+vec2(5.2,1.3)));",
      "  vec2 r=vec2(fbm(p+3.4*q+vec2(1.7,9.2)+0.10*t), fbm(p+3.4*q+vec2(8.3,2.8)-0.08*t));",
      "  float f=fbm(p+3.4*r);",
      "  vec2 c=vec2((uv.x-0.5)*asp, uv.y-0.70);",          // glow heart near bottom → horizon-rise
      "  float glow=smoothstep(1.35,0.0,length(c)*0.85);",
      "  float d=smoothstep(0.28,0.88,f);",
      "  d=d*(0.50+0.95*glow)+0.04;",
      "  d=clamp(d,0.0,1.0);",
      "  vec3 cBlack=vec3(0.090,0.028,0.040);",
      "  vec3 cWine =vec3(0.219,0.051,0.075);",
      "  vec3 cRed  =vec3(0.329,0.071,0.114);",
      "  vec3 cHot  =vec3(0.470,0.100,0.150);",
      "  vec3 cGold =vec3(0.840,0.668,0.408);",
      "  vec3 col=cBlack;",
      "  col=mix(col,cWine,smoothstep(0.0,0.40,d));",
      "  col=mix(col,cRed ,smoothstep(0.35,0.78,d));",
      "  col=mix(col,cHot ,smoothstep(0.72,1.0,d));",
      "  col=mix(col,cGold,smoothstep(0.88,1.0,d)*0.18);",  // stronger gold
      "  float vig=smoothstep(1.42,0.36,length(vec2((uv.x-0.5)*asp,uv.y-0.5)));",
      "  col*=mix(0.48,1.0,vig);",
      "  col += (hash(uv*u_res + t)-0.5)*0.010;",           // dither
      "  gl_FragColor=vec4(max(col,0.0),1.0);",
      "}"
    ].join("\n");

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn("[footerShader] compile error:", gl.getShaderInfoLog(s));
        gl.deleteShader(s); return null;
      }
      return s;
    }
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return false;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);

    /* Full-screen triangle (covers clip-space without need for two tris) */
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes = gl.getUniformLocation(prog, "u_res");

    /* Render at reduced pixel ratio for performance */
    const Q = Math.min(window.devicePixelRatio || 1, 1.5) * 0.75;
    let W = 0, H = 0;
    function resize() {
      const r = canvas.getBoundingClientRect();
      const w = Math.max(2, Math.round(r.width * Q));
      const h = Math.max(2, Math.round(r.height * Q));
      if (w === W && h === H) return;
      W = w; H = h;
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
    }
    function draw(sec) {
      resize();
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, sec);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    canvas.dataset.glInit = "1";

    if (REDUCE) {
      const r = () => draw(12.0);
      r(); window.addEventListener("resize", r, { passive: true });
      return true;
    }

    let raf = 0, t0 = null, inView = !("IntersectionObserver" in window);
    function tick(now) {
      if (t0 === null) t0 = now;
      draw((now - t0) / 1000);
      raf = requestAnimationFrame(tick);
    }
    function update() {
      const run = inView && !document.hidden;
      if (run && !raf) raf = requestAnimationFrame(tick);
      else if (!run && raf) { cancelAnimationFrame(raf); raf = 0; }
    }
    window.addEventListener("resize", () => {
      if (!raf) draw(t0 === null ? 0 : (performance.now() - t0) / 1000);
    }, { passive: true });
    if ("IntersectionObserver" in window && footer) {
      new IntersectionObserver((ents) => { inView = ents[0].isIntersecting; update(); }, { threshold: 0 }).observe(footer);
    }
    document.addEventListener("visibilitychange", update);
    update();
    return true;
  }

  /* ---------- Projects: pinned horizontal gallery (v2) ---------- */
  function projectsGallery(gsap, ST) {
    const track = $("#hTrack");
    const section = $("#projects");
    if (!track || !section) return;
    const thumbs = $$(".thumb");
    const progressEl = $("#hProgress");
    const nThumbs = thumbs.length;

    const setActive = (p) => {
      if (progressEl) progressEl.style.width = (p * 100).toFixed(1) + "%";
      if (!nThumbs) return;
      const idx = Math.min(nThumbs - 1, Math.round(p * (nThumbs - 1)));
      thumbs.forEach((t, i) => t.classList.toggle("is-active", i === idx));
    };

    const mm = gsap.matchMedia();
    mm.add("(min-width: 901px)", () => {
      if (REDUCE) return;
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + window.innerWidth * 0.06);
      const tween = gsap.to(track, { x: () => -distance(), ease: "none" });
      const st = ST.create({
        animation: tween,
        trigger: section,
        start: "top top",
        end: () => "+=" + distance(),
        pin: true,
        pinType: "fixed",          // escapes .reveal's overflow:hidden, no edge clipping
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => setActive(self.progress),
      });
      thumbs.forEach((t) => t.addEventListener("click", () => {
        const i = parseInt(t.dataset.go, 10);
        const p = nThumbs > 1 ? i / (nThumbs - 1) : 0;
        const target = st.start + p * (st.end - st.start);
        if (window.__lenis) window.__lenis.scrollTo(target, { duration: 1.2 });
        else window.scrollTo({ top: target, behavior: "smooth" });
      }));
      return () => { st.kill(); tween.kill(); };
    });
  }


  /* ----------------------------------------------------------
     Boot
  ---------------------------------------------------------- */
  if (!HAS_GSAP) { bailToStatic(); return; }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initGSAP);
  else initGSAP();
})();
