'use client';

import { useEffect } from 'react';
import { asset } from '@/lib/asset';
import { getLenis, subscribeScroll, whenLenis } from '@/lib/lenis';
import { whenUnlocked } from '@/lib/gl';

export type ShipStickyHeaderProps = {
  /** Words that cycle under “you can …” */
  items?: string[];
  /** UI theme */
  theme?: 'dark' | 'light';
  /** Where the highlight band starts (vh) */
  startVh?: number;
  /** Space (vh) below the sticky header block */
  spaceVh?: number;
};

export function WordHeroPage({
  items = ['Architect.', 'Test.', 'Automate.', 'Optimize.', 'Perfect.', 'Dominate.', 'Ship.'],
  startVh = 45,
  spaceVh = 50,
}: ShipStickyHeaderProps) {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--start-vh', `${startVh}vh`);
    root.style.setProperty('--space-vh', `${spaceVh}vh`);
  }, [startVh, spaceVh]);

  /* Phones: the highlight band is painted with background-attachment: fixed,
     which iOS Safari ignores (every word would sit dimmed). Under 768px the
     lit word is chosen here instead — the item whose centre is nearest the
     --start-vh line gets .is-lit; the mobile CSS block below colours it. */
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767.98px)');
    let raf = 0;
    let on = false;
    let items: HTMLElement[] = [];
    let offScroll: (() => void) | null = null;
    const paint = () => {
      raf = 0;
      const band = (window.innerHeight * startVh) / 100;
      for (const li of items) {
        const r = li.getBoundingClientRect();
        li.classList.toggle('is-lit', Math.abs(r.top + r.height / 2 - band) <= r.height * 0.5);
      }
    };
    const tick = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const start = () => {
      if (on) return;
      on = true;
      items = Array.from(document.querySelectorAll<HTMLElement>('#hero .hero-word-item'));
      /* ride the Lenis scroll frame (native scroll under reduced motion) */
      offScroll = subscribeScroll(tick);
      window.addEventListener('resize', tick, { passive: true });
      window.addEventListener('plx:done', tick);
      tick();
    };
    const stop = () => {
      if (!on) return;
      on = false;
      offScroll?.();
      offScroll = null;
      window.removeEventListener('resize', tick);
      window.removeEventListener('plx:done', tick);
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      items.forEach((li) => li.classList.remove('is-lit'));
    };
    const sync = () => (mq.matches ? start() : stop());
    sync();
    mq.addEventListener('change', sync);
    return () => {
      mq.removeEventListener('change', sync);
      stop();
    };
  }, [startVh]);

  /* Desktop under Lenis: the highlight band is anchored to the viewport by a
     CSS variable written once per scroll frame instead of by
     background-attachment: fixed. It is the same 100vh gradient at the same
     viewport position, so the wipe is pixel-identical — but fixed attachment
     makes the browser repaint all seven blurred words on the main thread on
     every scroll frame, which is what stuttered under Lenis. Native and
     reduced-motion scrolling keep the plain CSS rule (a JS-written variable
     would lag the compositor there). */
  useEffect(() => {
    const hero = document.getElementById('hero');
    if (!hero) return;
    const desktop = window.matchMedia('(min-width: 768px)');
    let on = false;
    let visible = true;
    let items: HTMLElement[] = [];
    let lastY: number | null = null;
    let offScroll: (() => void) | null = null;
    let ro: ResizeObserver | null = null;
    let io: IntersectionObserver | null = null;
    let cancelUnlock: (() => void) | null = null;
    const write = () => {
      if (!on || !visible || !items.length) return;
      const y = -items[0].getBoundingClientRect().top;
      if (y === lastY) return;
      lastY = y;
      hero.style.setProperty('--band-y', `${y}px`);
    };
    const start = () => {
      if (on) return;
      on = true;
      items = Array.from(hero.querySelectorAll<HTMLElement>('.hero-word-item'));
      lastY = null;
      /* the first read + rule flip wait for the boot overlay to lift: while
         the veil covers the hero the plain CSS rule is fine, and reading
         layout mid-flush would force a reflow of the whole document */
      cancelUnlock = whenUnlocked(() => {
        cancelUnlock = null;
        if (!on) return;
        write(); // first value before the rule flips, so nothing ever jumps
        hero.classList.add('hero-band-js');
      });
      offScroll = subscribeScroll(write); // same frame as Lenis, after ScrollTrigger
      window.addEventListener('resize', write, { passive: true });
      window.addEventListener('plx:done', write);
      const list = hero.querySelector('.hero-word-list');
      if (list && 'ResizeObserver' in window) {
        ro = new ResizeObserver(write); // font swap / line-height changes
        ro.observe(list);
      }
      if ('IntersectionObserver' in window) {
        io = new IntersectionObserver(
          ([e]) => {
            visible = e.isIntersecting;
            if (visible) write();
          },
          { rootMargin: '50% 0px' }
        );
        io.observe(hero);
      }
    };
    const stop = () => {
      if (!on) return;
      on = false;
      cancelUnlock?.();
      cancelUnlock = null;
      hero.classList.remove('hero-band-js');
      offScroll?.();
      offScroll = null;
      window.removeEventListener('resize', write);
      window.removeEventListener('plx:done', write);
      ro?.disconnect();
      ro = null;
      io?.disconnect();
      io = null;
      visible = true;
    };
    const sync = () => (desktop.matches && getLenis() ? start() : stop());
    /* Lenis boots in SiteEffects' effect, which may run after this one */
    const cancelLenis = whenLenis(sync);
    sync();
    desktop.addEventListener('change', sync);
    return () => {
      cancelLenis();
      desktop.removeEventListener('change', sync);
      stop();
    };
  }, []);

  return (
    <div
      className="hero-word-section"
      id="hero"
      style={
        {
          ['--count' as any]: items.length,
        } as React.CSSProperties
      }
    >
      {/* Subtle Laser Grid Lines Backdrop */}
      <div className="hero-grid-backdrop" aria-hidden="true" />

      {/* Background Person Overlay */}
      <div aria-hidden="true" className="hero-person-wrapper">
        <img
          src={asset('/hero-person.webp')}
          alt=""
          className="hero-person-img"
          width={1600}
          height={1200}
          decoding="async"
        />
      </div>

      {/* Atmospheric Glowing Orbs */}
      <div className="hero-glow-aura" aria-hidden="true" />
      <div className="hero-glow-core" aria-hidden="true" />

      {/* Sticky Word Cycle Section */}
      <header className="hero-word-header">
        <section className="hero-word-content">
          {/* The two spans are read as ONE heading by both crawlers and screen
              readers, so they have to form a single sentence in DOM order:
              "You Can Ship Things — Aaryan Kumar Saini, QA Engineer & Developer."
              The visible half is only "you can" (the rest of the line is the
              decorative aria-hidden word cycle below), so the sr-only half
              carries the words anyone would actually search for. Previously
              both spans said "you can", which rendered the page's single most
              weighted heading as "you can you can ship things." */}
          <h1 className="hero-word-prefix sm:not-sr-only">
            <span aria-hidden="true">You Can&nbsp;</span>
            <span className="sr-only">
              Ship Things — Aaryan Kumar Saini, QA Engineer &amp; Developer.
            </span>
          </h1>

          {/* Cycling words */}
          <ul className="hero-word-list" aria-hidden="true">
            {items.map((word, i) => (
              <li
                key={i}
                className="hero-word-item"
                style={{ ['--i' as any]: i } as React.CSSProperties}
              >
                {word}
              </li>
            ))}
          </ul>
        </section>
      </header>

      <style dangerouslySetInnerHTML={{ __html: `
        .hero-word-section {
          position: relative;
          width: 100%;
          background: radial-gradient(circle at 50% 30%, #1a1c4b 0%, #10112c 60%, #08091a 100%);
          color: var(--parch, #ffffff);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* Blend the section's cloud backdrop into the next section's indigo */
        .hero-word-section::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 42vh;
          z-index: 0;
          background: linear-gradient(180deg, rgba(16, 17, 44, 0) 0%, #10112c 90%);
          pointer-events: none;
        }

        .hero-grid-backdrop {
          position: absolute;
          inset: 0;
          z-index: 0;
          background-image: 
            linear-gradient(to right, rgba(135, 206, 235, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(135, 206, 235, 0.04) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(circle at 50% 40%, black 0%, transparent 80%);
          pointer-events: none;
        }

        .hero-person-wrapper {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          pointer-events: none;
          opacity: 0.3;
        }

        .hero-person-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 20%;
          /* grayscale(40%) contrast(110%) is baked into the asset itself — no
             colour-matrix pass on every paint of the hero layer */
        }

        .hero-glow-aura {
          position: absolute;
          left: 50%;
          top: 38%;
          width: 75vw;
          height: 75vw;
          max-width: 950px;
          max-height: 950px;
          z-index: 0;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, rgba(135, 206, 235, 0.25) 0%, rgba(21, 23, 61, 0) 65%);
          pointer-events: none;
        }

        .hero-glow-core {
          position: absolute;
          left: 50%;
          top: 36%;
          width: 280px;
          height: 280px;
          z-index: 0;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, rgba(177, 223, 242, 0.6) 0%, rgba(135, 206, 235, 0.15) 50%, transparent 75%);
          filter: blur(25px);
          pointer-events: none;
        }

        /* STICKY HEADER LOGIC */
        .hero-word-header {
          position: sticky;
          top: calc((var(--count) - 1) * -1lh);
          line-height: 1.15;
          display: flex;
          align-items: start;
          width: 100%;
          margin-bottom: var(--space-vh, 50vh);
          z-index: 1;
          font-size: clamp(2.8rem, 1.2rem + 6.5vw, 8rem);
        }

        .hero-word-content {
          display: flex; 
          width: 100%;
          align-items: start; 
          justify-content: center;
          padding-top: calc(var(--start-vh, 45vh) - 0.5lh);
          text-align: left;
        }

        .hero-word-prefix {
          position: sticky; 
          top: calc(var(--start-vh, 45vh) - 0.5lh);
          margin: 0; 
          font-weight: 400;
          font-family: var(--serif, "Cormorant Garamond", Georgia, serif);
          font-style: italic;
          color: rgba(255, 255, 255, 0.85);
          letter-spacing: -0.01em;
          white-space: nowrap;
          text-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
        }

        .hero-word-list {
          font-family: var(--sans, "Space Grotesk", sans-serif);
          font-weight: 700;
          list-style: none;
          padding: 0;
          margin: 0;
          letter-spacing: -0.035em;
        }

        .hero-word-item {
          --dimmed: rgba(255, 255, 255, 0.16);
          background: linear-gradient(
            180deg,
            var(--dimmed) 0 calc(var(--start-vh, 45vh) - 0.5lh),
            var(--gold, #87ceeb) calc(var(--start-vh, 45vh) - 0.55lh) calc(var(--start-vh, 45vh) + 0.55lh),
            var(--dimmed) calc(var(--start-vh, 45vh) + 0.5lh)
          );
          background-attachment: fixed;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.6));
        }

        /* Under Lenis (desktop) the band is anchored by --band-y — the negated
           viewport top of the first word, written on #hero every scroll frame
           — instead of by background-attachment: fixed. The gradient is the
           same 100vh image at the same viewport position, so the wipe is
           unchanged; fixed attachment made every scroll frame repaint all
           seven blurred words on the main thread. Each word is promoted so
           its drop-shadow blur runs on the GPU. */
        #hero.hero-band-js .hero-word-item {
          background-attachment: scroll;
          background-repeat: no-repeat;
          background-size: auto 100vh;
          background-position: 0 calc(var(--band-y, 0px) - var(--i, 0) * 1lh);
          will-change: transform;
        }

        /* ------------------------------------------------------- MOBILE
           "you can" sits on its own line above the word stack instead of
           beside it, so the words can run at ~12vw. The prefix is one line
           above the band and the first word lands in it on load — same
           sticky arithmetic as desktop, shifted by one line-height. */
        @media (max-width: 767.98px) {
          .hero-word-section {
            /* the 120vw glow below would otherwise widen the document */
            overflow-x: clip;
          }
          .hero-word-header {
            font-size: clamp(2.5rem, 12.5vw, 3.4rem);
            margin-bottom: 18vh;
          }
          /* Arithmetic (E = the header's em): a word row is 1.15E tall, the
             prefix is set at 1.3em so its row is 1.495E. The first word must
             centre on the band, so the prefix's top sits 0.575E + 1.495E =
             2.07E above the band — written in the prefix's own em that is
             2.07 / 1.3 = 1.5923em. The h1 size is pinned here because the
             UA stylesheet would otherwise double it and push every word
             below the band. */
          .hero-word-content {
            flex-direction: column;
            align-items: flex-start;
            padding-inline: var(--pad, 1.25rem);
            padding-top: calc(var(--start-vh, 45vh) - 2.07em);
          }
          .hero-word-prefix {
            font-size: 1.3em;
            line-height: 1.15;
            top: calc(var(--start-vh, 45vh) - 1.5923em);
          }
          .hero-word-item {
            background: none;
            color: var(--dimmed);
            filter: none;
            transition: color 0.3s ease, filter 0.3s ease;
          }
          .hero-word-item.is-lit {
            color: var(--gold, #87ceeb);
            filter: drop-shadow(0 8px 22px rgba(0, 0, 0, 0.55));
          }
          .hero-glow-aura {
            top: 44%;
            width: 120vw;
            height: 120vw;
          }
          .hero-glow-core {
            top: 42%;
            width: 210px;
            height: 210px;
          }
          .hero-person-img {
            object-position: 62% 18%;
          }
          .hero-grid-backdrop {
            background-size: 44px 44px;
          }
        }
      ` }} />
    </div>
  );
}
