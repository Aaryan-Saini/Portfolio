/* Single source of truth for the site's identity — consumed by the metadata in
   app/layout.tsx, the JSON-LD Person block, and app/sitemap.ts.

   SITE_URL must be absolute and without a trailing slash: og:image, canonical
   and sitemap entries are all resolved against it, and relative URLs are not
   valid in any of those three places. Override per-deploy with
   NEXT_PUBLIC_SITE_URL (e.g. a custom domain, or a GitHub Pages project URL). */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://aaryansaini.vercel.app"
).replace(/\/$/, "");

export const SITE_NAME = "Aaryan Kumar Saini";
export const SITE_TITLE = "Aaryan Kumar Saini — QA Engineer & Developer";

/* Kept under ~160 characters: Google truncates the snippet around there, and
   the previous 175-char version lost its closing line in results. Front-loaded
   with name + role, then the tool names people actually search for. */
export const SITE_DESCRIPTION =
  "Aaryan Kumar Saini — QA Engineer & Developer. Manual and automated testing with Playwright, Selenium, Cypress and k6. Portfolio, projects and résumé.";

/* schema.org Person — lets search engines tie this site to Aaryan as an
   entity rather than treating it as an anonymous page. Every field below is
   already published on the page itself (footer, overlay nav, résumé). */
export const personSchema = {
  "@type": "Person",
  "@id": `${SITE_URL}/#person`,
  name: SITE_NAME,
  alternateName: "Aaryan Saini",
  givenName: "Aaryan",
  additionalName: "Kumar",
  familyName: "Saini",
  jobTitle: "QA Engineer & Developer",
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  /* a real photograph (the stamp portrait on the page), not the social card —
     it is what a knowledge panel or profile result would show */
  image: {
    "@type": "ImageObject",
    url: `${SITE_URL}/stamp-portrait.webp`,
    width: 600,
    height: 720,
  },
  email: "mailto:aaryankrsaini24@gmail.com",
  telephone: "+91-96255-11881",
  /* every profile that is Aaryan's: the site links github.com/AaryanSaini;
     github.com/Aaryan-Saini hosts this portfolio's own repository */
  sameAs: [
    "https://github.com/AaryanSaini",
    "https://github.com/Aaryan-Saini",
    "https://www.linkedin.com/in/Aaryan-Saini",
  ],
  worksFor: { "@type": "Organization", name: "Kayease" },
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "Poornima University",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Jaipur",
      addressRegion: "Rajasthan",
      addressCountry: "IN",
    },
  },
  knowsAbout: [
    "Manual Testing",
    "Test Automation",
    "Playwright",
    "Selenium",
    "Cypress",
    "API Testing",
    "Postman",
    "Performance Testing",
    "k6",
    "Regression Testing",
    "Cross-browser Testing",
    "Mobile App Testing",
    "Jira",
    "CI/CD",
    "Chrome Extensions",
    "JavaScript",
    "Python",
    "SQL",
    "Data Analysis",
  ],
  hasOccupation: {
    "@type": "Occupation",
    name: "Quality Assurance Engineer",
    occupationalCategory: "15-1253.00", // O*NET: Software QA Analysts & Testers
    skills:
      "Manual testing, test automation, Playwright, Selenium, Cypress, API testing, performance testing",
  },
} as const;

/* WebSite — the node Google reads for the site name shown above a result
   ("Aaryan Kumar Saini" rather than "aaryansaini.vercel.app"). */
export const websiteSchema = {
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  alternateName: ["Aaryan Saini", "Aaryan Saini Portfolio"],
  description: SITE_DESCRIPTION,
  inLanguage: "en",
  publisher: { "@id": personSchema["@id"] },
} as const;

/* ProfilePage wraps the Person above. Google treats a ProfilePage as "this
   page IS the profile of that entity" rather than "this page mentions them",
   which is exactly what a one-page portfolio is. mainEntity carries the
   Person inline (Google's ProfilePage docs expect it there). */
export const profilePageSchema = {
  "@type": "ProfilePage",
  "@id": `${SITE_URL}/#profilepage`,
  url: SITE_URL,
  name: SITE_TITLE,
  description: SITE_DESCRIPTION,
  inLanguage: "en",
  isPartOf: { "@id": websiteSchema["@id"] },
  primaryImageOfPage: `${SITE_URL}/og.jpg`,
  mainEntity: personSchema,
} as const;

/* the single JSON-LD block rendered in app/layout.tsx */
export const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [websiteSchema, profilePageSchema],
} as const;
