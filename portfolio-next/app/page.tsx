import CursorLayer from "@/components/CursorLayer";
import Fireworks from "@/components/Fireworks";
import Preloader from "@/components/Preloader";
import Chrome from "@/components/Chrome";
import OverlayNav from "@/components/OverlayNav";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Skills from "@/components/sections/Skills";
import Projects from "@/components/sections/Projects";
import Experience from "@/components/sections/Experience";
import Honours from "@/components/sections/Honours";
import Resume from "@/components/sections/Resume";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/Footer";
import SiteEffects from "@/components/SiteEffects";

export default function Home() {
  return (
    <>
      <a href="#page" className="skip-link">
        Skip to main content
      </a>

      <CursorLayer />
      <Fireworks />
      <Preloader />
      <Chrome />
      <OverlayNav />

      <main id="page">
        <Hero />

        {/* OVERLAP WRAPPER — slides up over the sticky hero */}
        <div className="reveal" id="reveal">
          <About />
          <Skills />
          <Projects />
          <Experience />
          <Honours />
          <Resume />
          <Contact />
        </div>
      </main>

      <Footer />

      <SiteEffects />
    </>
  );
}
