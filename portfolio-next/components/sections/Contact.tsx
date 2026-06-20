export default function Contact() {
  return (
    <section className="contact section--dark" id="contact" data-theme="dark">
      {/* flowing red-smoke background (animated in JS) */}
      <div className="contact__bg" aria-hidden="true">
        {/* volumetric WebGL smoke; falls back to the CSS blobs below if unavailable */}
        <canvas className="contact__smoke" id="contactSmoke" />
        <span className="smoke smoke--1" />
        <span className="smoke smoke--2" />
        <span className="smoke smoke--3" />
        <span className="smoke smoke--4" />
        <span className="smoke smoke--5" />
        <span className="contact__vignette" />
      </div>

      <div className="contact__inner">
        <div className="section__head">
          <span className="section__tag">08 — Contact</span>
          <span className="section__lead">Let's make something</span>
          <span className="section__rule" />
        </div>

        <h2 className="contact__title">
          Let&rsquo;s work
          <br />
          <em>together</em>
        </h2>
        <p className="contact__sub">
          Looking to hire a QA engineer, discuss a project, or just connect? I
          read every message personally and reply within a day.
        </p>

        <div className="contact__grid">
          <form className="contact__form" id="contactForm" noValidate>
            <fieldset className="contact__intent">
              <legend>I&rsquo;m reaching out about</legend>
              <div className="chips" role="group" aria-label="Reason for reaching out">
                <button
                  type="button"
                  className="chip is-active"
                  data-intent="Hiring — QA role"
                  aria-pressed="true"
                >
                  Hiring
                </button>
                <button
                  type="button"
                  className="chip"
                  data-intent="A project to test or build"
                  aria-pressed="false"
                >
                  A Project
                </button>
                <button
                  type="button"
                  className="chip"
                  data-intent="A collaboration or internship"
                  aria-pressed="false"
                >
                  Collaboration
                </button>
                <button
                  type="button"
                  className="chip"
                  data-intent="Just saying hello"
                  aria-pressed="false"
                >
                  Just saying hello
                </button>
              </div>
            </fieldset>
            <div className="field">
              <label htmlFor="cName">Your name</label>
              <input
                id="cName"
                name="name"
                type="text"
                autoComplete="name"
                required
                placeholder="Jane Beaumont"
              />
            </div>
            <div className="field">
              <label htmlFor="cEmail">Email</label>
              <input
                id="cEmail"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="jane@studio.com"
              />
            </div>
            <div className="field">
              <label htmlFor="cMsg">Your message</label>
              <textarea
                id="cMsg"
                name="message"
                rows={4}
                required
                placeholder="Tell me what you need tested, built or discussed…"
              />
            </div>
            <button type="submit" className="btn btn--solid" data-cursor="link">
              Send the note<span className="btn__meta">↵</span>
            </button>
            <p className="contact__note" id="formNote" role="status" aria-live="polite" />
          </form>

          <aside className="contact__aside">
            <div className="contact__avail">
              <span className="dot" />
              <span>
                Open to QA &amp; Dev Opportunities — available <b>immediately</b>
              </span>
            </div>
            <div className="contact__block">
              <span className="contact__label">Email</span>
              <a href="mailto:aaryankrsaini24@gmail.com" data-cursor="link">
                aaryankrsaini24@gmail.com
              </a>
            </div>
            <div className="contact__block">
              <span className="contact__label">Elsewhere</span>
              <div className="contact__socials">
                <a
                  href="https://linkedin.com/in/Aaryan-Saini"
                  target="_blank"
                  data-cursor="link"
                  className="social-link"
                >
                  <span className="social-link__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </span>
                  LinkedIn ↗
                </a>
                <a
                  href="https://github.com/AaryanSaini"
                  target="_blank"
                  data-cursor="link"
                  className="social-link"
                >
                  <span className="social-link__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                    </svg>
                  </span>
                  GitHub ↗
                </a>
                <a href="tel:+919625511881" data-cursor="link" className="social-link">
                  <span className="social-link__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                    </svg>
                  </span>
                  +91 96255 11881 ↗
                </a>
              </div>
            </div>
            <div className="contact__block">
              <span className="contact__label">Studio</span>
              <p>
                Jaipur, Rajasthan · <b data-clock="">--:--:--</b>
                <br />
                Open to remote &amp; on-site roles
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
