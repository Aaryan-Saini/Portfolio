/* Film grain, vignette, and the glow cursor + comet-trail canvas.
   Purely presentational shells — the behaviour is wired in SiteEffects. */
export default function CursorLayer() {
  return (
    <>
      {/* ============ FILM GRAIN + VIGNETTE ============ */}
      <div className="grain" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />

      {/* ============ GLOW CURSOR (comet trail injected by JS) ============ */}
      <canvas className="cursor-trail" id="cursorTrail" aria-hidden="true" />
      <div className="cursorx" id="cursorx" aria-hidden="true">
        <span className="cursorx__glow" id="cxGlow" />
        <span className="cursorx__core" id="cxCore" />
      </div>
    </>
  );
}
