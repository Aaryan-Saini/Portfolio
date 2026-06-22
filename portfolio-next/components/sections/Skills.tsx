import { RevealWaveImage } from "@/components/ui/reveal-wave-image";
import { asset } from "@/lib/asset";

export default function Skills() {
  return (
    <section className="skills section section--dark" id="skills" data-theme="dark">
      {/* Interactive reveal-wave backdrop — animated B&W dither that reveals
          colour under the cursor. Sits behind the content (z-index 0); a wine
          scrim keeps the copy legible. Content is made pointer-transparent in
          CSS so the reveal tracks the cursor across the whole section. */}
      <div className="skills__bg" aria-hidden="true">
        <RevealWaveImage
          src={asset("/forest.jpg")}
          className="skills__reveal"
          waveSpeed={0.2}
          waveFrequency={0.7}
          waveAmplitude={0.4}
          revealRadius={0.45}
          revealSoftness={1}
          pixelSize={2}
          mouseRadius={0.4}
        />
        <span className="skills__bg-scrim" />
      </div>

      <div className="section__head">
        <span className="section__tag">03 — Capabilities</span>
        <span className="section__lead">QA · Data · Code</span>
        <span className="section__rule" />
      </div>

      <h2 className="skills__title">
        <span className="serif-it">A</span> craft <span className="serif-it">of</span>{" "}
        <b>three hands.</b>
      </h2>

      <div className="skills__cols">
        <article className="skills__col">
          <header>
            <span className="skills__no">i</span>
            <h3>Manual &amp; Automation</h3>
          </header>
          <ul>
            <li>Functional, Regression &amp; Smoke</li>
            <li>Cross-Browser &amp; Mobile</li>
            <li>Test Cases, Scenarios &amp; UAT</li>
            <li>ERP &amp; Multi-Role Testing</li>
            <li>Playwright (Python)</li>
            <li>API Testing — Postman</li>
            <li>SDLC / STLC</li>
          </ul>
        </article>
        <article className="skills__col">
          <header>
            <span className="skills__no">ii</span>
            <h3>Data</h3>
          </header>
          <ul>
            <li>SQL &amp; MySQL</li>
            <li>Python &amp; Excel</li>
            <li>Database Testing</li>
            <li>Dashboard &amp; Pivot Reports</li>
            <li>Data Cleaning &amp; Analysis</li>
          </ul>
        </article>
        <article className="skills__col">
          <header>
            <span className="skills__no">iii</span>
            <h3>Tools &amp; Code</h3>
          </header>
          <ul>
            <li>HTML, CSS &amp; JavaScript</li>
            <li>Git &amp; GitHub</li>
            <li>Jira &amp; Chrome DevTools</li>
            <li>Shopify Theme Testing</li>
            <li>AI/ML Application QA</li>
          </ul>
        </article>
      </div>

      <div className="marquee" aria-hidden="true">
        <div className="marquee__track">
          <span>Manual Testing</span>
          <span>·</span>
          <span>Selenium</span>
          <span>·</span>
          <span>Postman</span>
          <span>·</span>
          <span>Jira</span>
          <span>·</span>
          <span>API Testing</span>
          <span>·</span>
          <span>SQL</span>
          <span>·</span>
          <span>Regression</span>
          <span>·</span>
          <span>Cross-Browser</span>
          <span>·</span>
          <span>STLC</span>
          <span>·</span>
          <span>Python</span>
          <span>·</span>
          <span>Bug Reporting</span>
          <span>·</span>
          <span>UAT</span>
          <span>·</span>
          <span>Manual Testing</span>
          <span>·</span>
          <span>Playwright</span>
          <span>·</span>
          <span>Postman</span>
          <span>·</span>
          <span>Jira</span>
          <span>·</span>
          <span>API Testing</span>
          <span>·</span>
          <span>SQL</span>
          <span>·</span>
          <span>Regression</span>
          <span>·</span>
          <span>Cross-Browser</span>
          <span>·</span>
          <span>STLC</span>
          <span>·</span>
          <span>Python</span>
          <span>·</span>
          <span>Bug Reporting</span>
          <span>·</span>
          <span>UAT</span>
          <span>·</span>
          <span>Manual Testing</span>
          <span>·</span>
          <span>Playwright</span>
          <span>·</span>
          <span>Postman</span>
          <span>·</span>
          <span>Jira</span>
          <span>·</span>
          <span>API Testing</span>
          <span>·</span>
          <span>SQL</span>
          <span>·</span>
          <span>Regression</span>
          <span>·</span>
          <span>Cross-Browser</span>
          <span>·</span>
          <span>STLC</span>
          <span>·</span>
          <span>Python</span>
          <span>·</span>
          <span>Bug Reporting</span>
          <span>·</span>
          <span>UAT</span>
          <span>·</span>
        </div>
      </div>
    </section>
  );
}
