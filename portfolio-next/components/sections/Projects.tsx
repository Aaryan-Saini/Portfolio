import { asset } from "@/lib/asset";

export default function Projects() {
  return (
    <section className="projects section--dark" id="projects" data-theme="dark">
      <div className="projects__intro">
        <div className="section__head">
          <span className="section__tag">04 — QA Case Studies</span>
          <span className="section__lead">Bugs found. Quality delivered.</span>
          <span className="section__rule" />
        </div>
        <h2 className="projects__heading">
          <span className="serif-it">Pieces</span> worth keeping.
        </h2>
        <p className="projects__hint" data-cursor="link">
          <span>Scroll</span> to explore →
        </p>
      </div>

      <div className="projects__viewport">
        <div className="projects__track" id="hTrack">
          {/* panel 01 — Diabetic Retinopathy AI */}
          <article className="panel" data-index="0">
            <span className="panel__no">04 / 01</span>
            <div className="panel__media">
              <video
                className="panel__video-demo"
                id="diabeticDemo"
                src={asset("/videos/diabetic_retinopathy.mp4")}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-label="Diabetic Retinopathy AI project demo"
              />
              <span className="panel__media-tint" />
            </div>
            <div className="panel__text">
              <h3 className="panel__title">
                <span className="serif-it">Diabetic</span>
                <b>Retinopathy AI</b>
              </h3>
              <p className="panel__meta">
                Team Leader &amp; AI Engineer · Prayogam · Nov 2023 – Apr 2024
              </p>
              <p className="panel__desc">
                Deep learning diagnostic system detecting retinopathy severity
                (Mild, Moderate, Severe) from retinal images. Trained on 50,000
                images from a 20 GB Kaggle dataset — accuracy boosted from 65% to
                80%.
              </p>
              <ul className="panel__tags">
                <li>QA Validation</li>
                <li>Model Testing</li>
                <li>Python / CNN</li>
              </ul>
              <a href="#" className="panel__link" data-cursor="link">
                View QA details
                <i />
              </a>
            </div>
          </article>

          {/* panel 02 — Brain Tumor Detection QA */}
          <article className="panel" data-index="1">
            <span className="panel__no">04 / 02</span>
            <div className="panel__media">
              <video
                className="panel__video-demo"
                id="brainTumorDemo"
                src={asset("/videos/brain_tumor.mp4")}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-label="Brain Tumor Detection QA app demo"
              />
              <span className="panel__media-tint" />
            </div>
            <div className="panel__text">
              <h3 className="panel__title">
                <span className="serif-it">Brain Tumor</span>
                <b>Detection QA</b>
              </h3>
              <p className="panel__meta">
                Quality Assurance · Last Year Project · Feb – Apr 2026
              </p>
              <p className="panel__desc">
                Full QA cycle for an AI-based brain tumour detection app —
                functional &amp; usability testing, test case design, bug
                tracking, MRI dataset validation, and pre-deployment edge-case
                testing.
              </p>
              <ul className="panel__tags">
                <li>Manual Testing</li>
                <li>AI/ML QA</li>
                <li>Bug Reporting</li>
              </ul>
              <a href="#" className="panel__link" data-cursor="link">
                View test report
                <i />
              </a>
            </div>
          </article>

          {/* panel 03 — Saatvik Fincorp Website */}
          <article className="panel" data-index="2">
            <span className="panel__no">04 / 03</span>
            <div className="panel__media">
              <video
                className="panel__video-demo"
                id="fincorpDemo"
                src={asset("/videos/fincorp.mp4")}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-label="Saatvik Fincorp website demo"
              />
              <span className="panel__media-tint" />
            </div>
            <div className="panel__text">
              <h3 className="panel__title">
                <span className="serif-it">Fincorp</span>
                <b>Business Website</b>
              </h3>
              <p className="panel__meta">
                Web Developer Intern · Saatvik Fincorp · May – Jul 2025
              </p>
              <p className="panel__desc">
                Led a 3-person team to design &amp; ship a 10+ page business site
                from scratch. Grew traffic to 1,000+ users in month one. Delivered
                dark/light mode, testimonials, and responsive navigation.
              </p>
              <ul className="panel__tags">
                <li>HTML/CSS/JS</li>
                <li>End-to-End QA</li>
                <li>Cross-Browser</li>
              </ul>
              <a href="#" className="panel__link" data-cursor="link">
                View QA report
                <i />
              </a>
            </div>
          </article>

          <article className="panel panel--end" data-index="4">
            <div className="panel__cta">
              <p className="serif-it">Test coverage matters.</p>
              <a href="#contact" className="btn btn--ghost" data-cursor="link">
                Let's talk quality
              </a>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
