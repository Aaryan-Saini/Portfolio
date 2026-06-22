import SilkShader from "@/components/ui/bloodline";

export default function Hero() {
  return (
    <section className="hero" id="hero">
      {/* Blood-silk WebGL backdrop — animated crimson silk. Opaque, so it
          becomes the hero background (covering the section gradient). Sits at
          z-index 0 behind the core (1), aura (0) and content grid (2);
          pointer-events:none keeps the hero clickable. `invert` forces the dark
          treatment so the light hero copy stays legible. The radial ink scrim
          lifts text contrast over the busy weave. */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}
      >
        <SilkShader invert />
        <span
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(72% 60% at 50% 46%, rgba(22,16,15,0.55) 0%, rgba(22,16,15,0.14) 50%, transparent 78%)",
          }}
        />
      </div>

      {/* shared "core" — the glowing heart carried over from the loader */}
      <div className="hero__core" data-hero-core aria-hidden="true" />
      <div className="hero__aura" aria-hidden="true" />

      <div className="hero__grid">
        <p className="hero__eyebrow reveal-up">
          <span>QA Engineer</span>
          <span className="hero__eyebrow-line" />
          <span>Portfolio · MMXXVI</span>
        </p>

        <h1 className="hero__title">
          <span className="hero__line hero__line--serif" data-split="">
            Written in logic,
          </span>
          <span
            className="hero__line hero__line--sans"
            data-split=""
            data-scramble=""
          >
            BUILT IN CODE.
          </span>
        </h1>

        <div className="hero__foot">
          <p className="hero__lede reveal-up">
            I'm <strong>Aaryan Kumar Saini</strong> — a QA engineer who
            hunts bugs before users do, writes test cases that hold, and ensures
            every product ships with quality baked in.
          </p>
          <a href="#about" className="hero__scroll" data-cursor="link">
            <span className="hero__scroll-text">Begin the descent</span>
            <span className="hero__scroll-rule">
              <i />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
