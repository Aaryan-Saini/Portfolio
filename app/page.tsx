import Preloader from "@/components/Preloader";
import CursorLayer from "@/components/CursorLayer";
import Chrome from "@/components/Chrome";
import OverlayNav from "@/components/OverlayNav";
import Hero from "@/components/sections/Hero";
import FeaturedProjects from "@/components/sections/FeaturedProjects";
import WorksMarquee from "@/components/sections/WorksMarquee";
import ExperienceEditorial from "@/components/sections/ExperienceEditorial";
import HonoursEditorial from "@/components/sections/HonoursEditorial";
import ResumeEditorial from "@/components/sections/ResumeEditorial";
import Footer from "@/components/Footer";
import SiteEffects from "@/components/SiteEffects";

export default function Home() {
  return (
    <>
      <a href="#page" className="skip-link">
        Skip to main content
      </a>

      <Preloader />
      <CursorLayer />
      <Chrome />
      <OverlayNav />

      <main id="page">
        {/* horizon hero — act one the name, act two the "How I earn trust"
            credo (formerly the About section below it); FeaturedProjects’
            torn-paper strip rolls in over its final hold */}
        <Hero />

        {/* editorial "Field Notes" sections */}
        <FeaturedProjects />
        <WorksMarquee />
        <ExperienceEditorial />
        <HonoursEditorial />
        <ResumeEditorial />
      </main>

      {/* original fixed-reveal footer (WavesShader + giant AARYAN) */}
      <Footer />

      <SiteEffects />
    </>
  );
}
