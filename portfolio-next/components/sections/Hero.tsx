import CrystalCursor from "@/components/ui/crystal-cursor";

export default function Hero() {
  return (
    <section className="hero" id="hero">
      {/* hero background: glowing gold crystalline field (ambient + cursor trail
          + click-to-shatter) on a themed ink base */}
      <CrystalCursor
        overlay
        transparent={false}
        ambient
        glow={7}
        background="#16100f"
        crystalColor="rgba(220, 196, 138, 0.95)"
        shatterColor="rgba(246, 230, 191, 1)"
        trailColor="rgba(22, 16, 15, 0.06)"
        style={{ zIndex: 0 }}
      />
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
