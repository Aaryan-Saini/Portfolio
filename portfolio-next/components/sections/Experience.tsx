export default function Experience() {
  return (
    <section className="experience section" id="experience" data-theme="light">
      <div className="section__head">
        <span className="section__tag">05 — The Path</span>
        <span className="section__lead">The road so far</span>
        <span className="section__rule" />
      </div>
      <h2 className="experience__title">
        <span className="serif-it">A</span> deliberate <b>trajectory.</b>
      </h2>

      <ol className="timeline">
        <li className="timeline__item" data-reveal="">
          <span className="timeline__years">Dec 2025 — Jun 2026</span>
          <div className="timeline__body">
            <h3>QA Intern</h3>
            <p className="timeline__org">Kayease · On-Site · Dec 2025 – Jun 2026</p>
            <p className="timeline__desc">
              Executed comprehensive QA across three flagship products — a{" "}
              <strong>Sales Management ERP</strong> (covering inventory, salesman
              tracking, distributor workflows and accounts), a{" "}
              <strong>School Management System</strong> (with Student, Teacher,
              Staff, Admin and Super Admin roles), and a{" "}
              <strong>Financial CRM</strong> built for NBFCs and private lending
              firms, where DSA agents and sales reps manage customer pipelines,
              track loan progress, monitor repayments and handle end-to-end client
              lifecycle — tested across all role-based flows. Performed manual,
              functional, regression, smoke, UI, cross-browser and mobile testing
              on both web and Android applications. Wrote 500+ test cases and test
              scenarios, validated role-based permissions, business workflows and
              edge cases. Tested Shopify themes and e-commerce flows. Explored
              Playwright-based automation scripting for web application regression
              suites. Conducted API testing via Postman and tracked all defects in
              Jira through full SDLC cycles.
            </p>
          </div>
        </li>
        <li className="timeline__item" data-reveal="">
          <span className="timeline__years">May – Jul 2025</span>
          <div className="timeline__body">
            <h3>Data Analyst Intern</h3>
            <p className="timeline__org">Growly · Remote</p>
            <p className="timeline__desc">
              Worked with 100+ datasets (up to 100 MB) using SQL, MySQL and Excel
              — cleaning, transforming and analysing raw business data into
              actionable insights. Built 3 interactive dashboards and pivot-based
              reports to track KPIs across sales and operations. Identified
              processing bottlenecks through SQL query optimisation, improving
              pipeline efficiency by 15%. Documented findings and presented to
              stakeholders. Earned a Letter of Recommendation for quality of
              analysis and delivery speed.
            </p>
          </div>
        </li>
        <li className="timeline__item" data-reveal="">
          <span className="timeline__years">May – Jul 2025</span>
          <div className="timeline__body">
            <h3>Web Developer Intern</h3>
            <p className="timeline__org">Saatvik Fincorp · On-Site</p>
            <p className="timeline__desc">
              Led a 3-person team to design, develop and launch a 10+ page
              business website for a financial services firm — from wireframe to
              live deployment. Built with HTML, CSS and JavaScript; implemented
              dark/light mode, testimonials carousel, responsive navigation and
              contact forms. Grew organic traffic to 1,000+ users in month one.
              Conducted full end-to-end manual QA across browsers and devices
              before each release. Managed client communication and delivered
              within deadline.
            </p>
          </div>
        </li>
      </ol>
    </section>
  );
}
