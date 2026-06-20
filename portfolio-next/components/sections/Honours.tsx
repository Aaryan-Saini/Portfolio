import { asset } from "@/lib/asset";

export default function Honours() {
  return (
    <section
      className="honours section section--dark"
      id="certifications"
      data-theme="dark"
      style={{ backgroundImage: `url(${asset("/forest.jpg")})` }}
    >
      <div className="section__head">
        <span className="section__tag">06 — Honours &amp; Certification</span>
        <span className="section__lead">In good company</span>
        <span className="section__rule" />
      </div>
      <h2 className="honours__title">
        <span className="serif-it">Marks of</span> <b>recognition.</b>
      </h2>

      <div className="honours__grid">
        <article className="cert" data-reveal="">
          <span className="cert__year">2024</span>
          <h3>50% Merit Scholarship</h3>
          <p>
            Poornima University — Merit-based undergraduate scholarship for
            academic excellence.
          </p>
        </article>
        <article className="cert" data-reveal="">
          <span className="cert__year">2024</span>
          <h3>Top 10 · Prayogam</h3>
          <p>
            Inter-University AI/ML competition — top 10 rank for Diabetic
            Retinopathy project.
          </p>
        </article>
        <article className="cert" data-reveal="">
          <span className="cert__year">2024</span>
          <h3>Top 50 · Hack2Skill</h3>
          <p>
            National-level hackathon — top 50 finish among hundreds of competing
            teams.
          </p>
        </article>
        <article className="cert" data-reveal="">
          <span className="cert__year">2023</span>
          <h3>Google GDG Participant</h3>
          <p>
            Google Solution Challenge — participant with GDG campus community.
          </p>
        </article>
      </div>

      <div className="awards" data-reveal="">
        <span className="awards__label">Certifications</span>
        <ul className="awards__list">
          <li>
            Python <em>×2</em>
          </li>
          <li>MySQL &amp; PostgreSQL Basics</li>
          <li>Excel &amp; R</li>
          <li>DSA · Cyber-Security · Gen-AI · Prompt Engineering</li>
        </ul>
      </div>
    </section>
  );
}
