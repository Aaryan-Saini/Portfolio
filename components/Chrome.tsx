export default function Chrome() {
  return (
    <header className="chrome" id="chrome">
      <button
        className="chrome__menu"
        id="menuToggle"
        data-cursor="link"
        aria-expanded={false}
        aria-controls="overlayNav"
        aria-label="Menu"
        style={{ marginLeft: "auto" }}
      >
        {/* masked label roll: MENU exits up, CLOSE rises — same clock as the
            glyph's cross morph. Both words aria-hidden; the button's
            accessible name is the aria-label + aria-expanded state. */}
        <span className="chrome__menu-label">
          <span className="chrome__menu-roll">
            <span aria-hidden="true">Menu</span>
            <span aria-hidden="true">Close</span>
          </span>
        </span>
        <span className="chrome__menu-glyph">
          <i />
          <i />
        </span>
      </button>
    </header>
  );
}
