export default function Chrome() {
  return (
    <>
      {/* persistent cinematic-sound toggle (kept in sync with the loader's) */}
      <button
        type="button"
        className="site-audio is-off"
        data-site-audio
        aria-pressed={false}
        aria-label="Turn sound on"
        title="Cinematic sound"
      >
        <span className="site-audio__eq" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <span className="site-audio__label" data-site-audio-label>
          Sound
        </span>
      </button>

      <header className="chrome" id="chrome">
        <button
          className="chrome__menu"
          id="menuToggle"
          data-cursor="link"
          aria-expanded={false}
          aria-controls="overlayNav"
          style={{ marginLeft: "auto" }}
        >
          <span className="chrome__menu-label">Menu</span>
          <span className="chrome__menu-glyph">
            <i />
            <i />
          </span>
        </button>
      </header>
    </>
  );
}
