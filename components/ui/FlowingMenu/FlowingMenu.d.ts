export interface FlowingMenuItem {
  link: string;
  text: string;
  /** optional override for the flowing band copy (falls back to `text`) */
  marqueeText?: string;
  /**
   * Pill artwork. An array stacks CSS background layers front-to-back, so a
   * source that fails to load falls through to the next one — pass
   * `[photo, fallback]` to have the photo win once it exists.
   */
  image: string | string[];
}

export interface FlowingMenuProps {
  items?: FlowingMenuItem[];
  speed?: number;
  textColor?: string;
  bgColor?: string;
  marqueeBgColor?: string;
  marqueeTextColor?: string;
  borderColor?: string;
}

declare function FlowingMenu(props: FlowingMenuProps): JSX.Element;
export default FlowingMenu;
