export default function OverlayNav() {
  return (
    <nav className="overlay-nav" id="overlayNav" aria-hidden="true">
      <div className="overlay-nav__bg" />
      <div className="overlay-nav__inner">
        <ul className="overlay-nav__list">
          <li>
            <a href="#about" data-cursor="link">
              <em>02</em> About
            </a>
          </li>
          <li>
            <a href="#skills" data-cursor="link">
              <em>03</em> Skills
            </a>
          </li>
          <li>
            <a href="#projects" data-cursor="link">
              <em>04</em> Selected Work
            </a>
          </li>
          <li>
            <a href="#experience" data-cursor="link">
              <em>05</em> Experience
            </a>
          </li>
          <li>
            <a href="#certifications" data-cursor="link">
              <em>06</em> Honours
            </a>
          </li>
          <li>
            <a href="#resume" data-cursor="link">
              <em>07</em> Résumé
            </a>
          </li>
          <li>
            <a href="#contact" data-cursor="link">
              <em>08</em> Contact
            </a>
          </li>
        </ul>
        <div className="overlay-nav__aside">
          <p className="overlay-nav__caption">Get in touch</p>
          <a
            className="overlay-nav__mail"
            href="mailto:aaryankrsaini24@gmail.com"
            data-cursor="link"
          >
            aaryankrsaini24@gmail.com
          </a>
          <div className="overlay-nav__socials">
            <a
              href="https://linkedin.com/in/Aaryan-Saini"
              target="_blank"
              data-cursor="link"
            >
              LinkedIn
            </a>
            <a
              href="https://github.com/AaryanSaini"
              target="_blank"
              data-cursor="link"
            >
              GitHub
            </a>
            <a href="tel:+919625511881" data-cursor="link">
              +91 96255 11881
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
