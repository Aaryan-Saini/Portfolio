import { asset } from "@/lib/asset";
import { GLSLHills } from "@/components/ui/glsl-hills";

export default function Footer() {
  return (
    <footer className="footer" id="footer">
      {/* Animated GLSL hills — drifting noise ridges as the footer backdrop
          (z-index 0, behind the content which sits at z-index 1). */}
      <div className="footer__hills" aria-hidden="true">
        {/* wine-red ridges (oxblood family). Lightened vs the pure #260a0e
            token because the ridges are semi-transparent — a near-black colour
            would vanish against the dark footer. */}
        <GLSLHills color={[0.62, 0.17, 0.2]} />
      </div>
      <div className="footer__inner">
        <div className="footer__marquee" aria-hidden="true">
          <div className="footer__marquee-track">
            <span>Available for select projects</span>
            <span className="footer__star">✦</span>
            <span>Written in light, built in code</span>
            <span className="footer__star">✦</span>
            <span>Available for select projects</span>
            <span className="footer__star">✦</span>
            <span>Written in light, built in code</span>
            <span className="footer__star">✦</span>
          </div>
        </div>
        <div className="footer__head">
          <div className="footer__big">
            <h2 data-split-foot="">
              AARYAN KUMAR
              <br />
              SAINI
            </h2>
            <div className="footer__bigvid-wrap" aria-hidden="true">
              <video
                className="footer__bigvid"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                poster={asset("/forest.jpg")}
                aria-hidden="true"
              >
                <source src={asset("/videos/nature.mp4")} type="video/mp4" />
              </video>
            </div>
            <svg
              className="footer__bigclip"
              width="0"
              height="0"
              aria-hidden="true"
              focusable="false"
            >
              <defs>
                <clipPath id="footTextClip">
                  <text x="0" y="0.74em">
                    AARYAN KUMAR
                    <tspan x="0" dy="0.95em">
                      SAINI
                    </tspan>
                  </text>
                </clipPath>
              </defs>
            </svg>
          </div>
        </div>
        <div className="footer__cols">
          <div className="footer__socials">
            <a
              className="footer__social"
              href="mailto:aaryankrsaini24@gmail.com"
              title="aaryankrsaini24@gmail.com"
              aria-label="Email"
              data-cursor="link"
            >
              <span className="footer__social-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </span>
              <span className="footer__social-label">Email</span>
            </a>
            <a
              className="footer__social"
              href="tel:+919625511881"
              title="+91 96255 11881"
              aria-label="Phone"
              data-cursor="link"
            >
              <span className="footer__social-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                </svg>
              </span>
              <span className="footer__social-label">Phone</span>
            </a>
            <a
              className="footer__social"
              href="https://linkedin.com/in/Aaryan-Saini"
              target="_blank"
              rel="noopener"
              title="linkedin.com/in/Aaryan-Saini"
              aria-label="LinkedIn"
              data-cursor="link"
            >
              <span className="footer__social-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </span>
              <span className="footer__social-label">LinkedIn</span>
            </a>
            <a
              className="footer__social"
              href="https://github.com/AaryanSaini"
              target="_blank"
              rel="noopener"
              title="github.com/AaryanSaini"
              aria-label="GitHub"
              data-cursor="link"
            >
              <span className="footer__social-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
              </span>
              <span className="footer__social-label">GitHub</span>
            </a>
          </div>
          <button className="footer__totop" id="toTop" data-cursor="link">
            <span>Back to top</span>
            <i>↑</i>
          </button>
        </div>
        <div className="footer__base">
          <span>© 2026 Aaryan Kumar Saini</span>
          <span>Built with logic &amp; care</span>
          <span>QA Engineer &amp; Developer</span>
        </div>
      </div>
    </footer>
  );
}
