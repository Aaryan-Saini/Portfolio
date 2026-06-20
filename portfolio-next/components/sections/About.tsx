export default function About() {
  return (
    <section
      className="about section"
      id="about"
      data-theme="light"
      aria-labelledby="about-h"
    >
      <h2 id="about-h" className="sr-only">
        About Aaryan Kumar Saini
      </h2>
      <div className="section__head">
        <span className="section__tag">02 — About</span>
        <span className="section__lead">QA, Data &amp; Dev — one mind</span>
        <span className="section__rule" />
      </div>

      <div className="about__grid">
        <p className="about__kicker">
          <span className="about__name">Aaryan Kumar Saini</span> works at the
          crossroads of quality, data and development —
        </p>
        <p className="about__body" data-reveal-text="">
          ensuring every product he touches is tested thoroughly, analysed
          intelligently, and built with care. Across internships in QA, data
          analytics and web development, he has shipped robust systems for sales
          management, school ERPs, e-commerce platforms, and AI-based
          diagnostics. He believes a bug caught early is a user saved always,
          that data without insight is just noise, and that the best code is the
          code no one notices because it simply works. Trained in SQL, Python
          and modern web technologies, he closes the loop between quality
          assurance and engineering delivery.
        </p>
      </div>

      <ul className="about__stats">
        <li>
          <b data-count-to="3">0</b>
          <span>Internships completed</span>
        </li>
        <li>
          <b data-count-to="50" data-suffix="k+">
            0
          </b>
          <span>Content creator followers</span>
        </li>
        <li>
          <b data-count-to="1000" data-suffix="+">
            0
          </b>
          <span>Bugs caught &amp; verified</span>
        </li>
        <li>
          <b data-count-to="10" data-suffix="+">
            0
          </b>
          <span>Platforms tested</span>
        </li>
      </ul>
    </section>
  );
}
