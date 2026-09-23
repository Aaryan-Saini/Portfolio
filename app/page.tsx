import PreloaderEditorial from "@/components/PreloaderEditorial";
import CursorLayer from "@/components/CursorLayer";
import Chrome from "@/components/Chrome";
import OverlayNav from "@/components/OverlayNav";
import Hero from "@/components/sections/Hero";
import IntroStamp from "@/components/sections/IntroStamp";
import FeaturedProjects from "@/components/sections/FeaturedProjects";
import WorksMarquee from "@/components/sections/WorksMarquee";
import MethodStack from "@/components/sections/MethodStack";
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

      <PreloaderEditorial />
      <CursorLayer />
      <Chrome />
      <OverlayNav />

      <main id="page">
        {/* original word-stack hero */}
        <Hero />

        {/* editorial "Field Notes" sections */}
        {/* IntroStamp now carries the "Quality, as I see it" credo that used
            to be its own PhilosophyPaper section, in place of the stats strip */}
        <IntroStamp />
        <FeaturedProjects />
        <WorksMarquee />
        <MethodStack />
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
