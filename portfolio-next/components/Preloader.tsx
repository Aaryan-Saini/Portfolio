export default function Preloader() {
  return (
    <div id="preloader" role="status" aria-label="Loading">
      {/* ── living atmosphere (parallax: far layer) ── */}
      <div className="ld-bg" aria-hidden="true">
        <div className="ld-bloom" />
        <div className="ld-smoke ld-smoke--1" />
        <div className="ld-smoke ld-smoke--2" />
        <div className="ld-smoke ld-smoke--3" />
        <div className="ld-stars" />
        <div className="ld-grain" />
      </div>

      {/* ── HUD (parallax: near layer) ── */}
      <div className="ld-fg" aria-hidden="true">
        <div className="ld-cross">
          <i className="ld-cross-h" />
          <i className="ld-cross-v" />
          <i className="ld-cross-diag" />
        </div>
        <div className="ld-horizon" />
        <div className="ld-horizon ld-horizon--2" />

        {/* left orbital instrument */}
        <div className="ld-orbit ld-rise">
          <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1">
            <circle cx="100" cy="100" r="96" strokeOpacity=".22" strokeDasharray="2 7" />
            <g className="ld-orbit__spin">
              <circle cx="100" cy="100" r="78" strokeOpacity=".4" strokeDasharray="12 9" />
            </g>
            <circle cx="100" cy="100" r="58" strokeOpacity=".5" />
            <g className="ld-orbit__spin-r">
              <circle cx="100" cy="100" r="40" strokeOpacity=".3" strokeDasharray="3 6" />
            </g>
            <circle cx="100" cy="100" r="12" strokeOpacity=".7" />
            <line x1="100" y1="2" x2="100" y2="198" strokeOpacity=".16" />
            <line x1="2" y1="100" x2="198" y2="100" strokeOpacity=".16" />
            <g className="ld-orbit__dot">
              <circle cx="100" cy="22" r="3" fill="currentColor" stroke="none" />
            </g>
            <circle cx="100" cy="100" r="2.6" fill="currentColor" stroke="none" />
          </svg>
          <span className="ld-orbit__label">SECTOR · P-2517</span>
        </div>
      </div>

      {/* shared "core" — the glowing heart that carries over into the hero */}
      <div className="ld-core" data-ld-core aria-hidden="true" />

      {/* center counter / enter console (own parallax weight) */}
      <div className="ld-stage ld-rise" aria-hidden="true">
        <div className="ld-box" data-ld-box>
          <i className="ld-box__fill" data-ld-fill />
          <i className="ld-box__scan" />
          <span className="ld-bracket ld-bracket--tl" />
          <span className="ld-bracket ld-bracket--tr" />
          <span className="ld-bracket ld-bracket--bl" />
          <span className="ld-bracket ld-bracket--br" />
          <span className="ld-count">
            <b data-count>00</b>
            <u>%</u>
          </span>
          <button
            type="button"
            className="ld-enter"
            data-ld-enter
            aria-label="Enter site"
          >
            Begin Journey
          </button>
        </div>
        <span className="ld-calib" data-ld-calib>
          Calibration
          <br />
          Complete
        </span>
      </div>

      {/* right headline (types in) */}
      <div className="ld-headline" aria-hidden="true">
        <span className="ld-h-line ld-rise" data-type>Prepare Your</span>
        <span className="ld-h-line ld-rise" data-type>Journey Across</span>
        <span className="ld-h-line ld-rise">
          <span data-type>Distant Worlds</span>
          <span className="ld-dots" data-dots>
            <i>.</i>
            <i>.</i>
            <i>.</i>
          </span>
        </span>
        <small className="ld-hint ld-rise" data-type>
          For best experience turn volume on
        </small>
      </div>

      {/* interactive sound toggle (HUD control) */}
      <button
        type="button"
        className="ld-audio ld-rise is-off"
        data-ld-audio
        aria-pressed="false"
        aria-label="Turn sound on"
      >
        <span className="ld-audio__eq" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <span className="ld-audio__txt">
          <b data-ld-audio-label>Sound Off</b>
          <em>Click to enable audio</em>
        </span>
      </button>

      {/* corner sigils */}
      <div className="ld-glyphs ld-rise" aria-hidden="true">
        <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1">
          <circle cx="20" cy="20" r="17" />
          <path d="M20 6 L32 27 L8 27 Z" />
          <path d="M20 34 L8 13 L32 13 Z" />
        </svg>
        <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1">
          <circle cx="20" cy="20" r="17" />
          <circle cx="20" cy="20" r="9" />
          <path d="M20 7 L33 29 L7 29 Z" />
          <circle cx="20" cy="20" r="2.2" fill="currentColor" stroke="none" />
        </svg>
        <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1">
          <circle cx="20" cy="20" r="17" />
          <rect x="10" y="10" width="20" height="20" />
          <path d="M20 6 L34 20 L20 34 L6 20 Z" />
        </svg>
      </div>
    </div>
  );
}
