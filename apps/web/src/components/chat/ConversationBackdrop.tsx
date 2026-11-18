import { useState } from "react";

import { useClientSettings } from "../../hooks/useSettings";
import { BACKDROP_STYLE, backdropById } from "./backdrops";

const SPEED = 0.4;
// Each route mounts its own backdrop. One clock for all of them makes the new one show the same
// sky the old one did, and only the first ever fades in, so navigating never restarts it.
const skyClock = () => (performance.now() / 1000) * SPEED;
let skySeen = false;

/** The chosen dithercn background behind the chat, coloured from the active theme. */
export function ConversationBackdrop() {
  const enabled = useClientSettings((settings) => settings.ditherBackdropEnabled);
  const chosen = useClientSettings((settings) => settings.ditherBackdrop);
  const [fadeIn] = useState(() => {
    const first = !skySeen;
    skySeen = true;
    return first;
  });
  // Automated browsers run WebGL in software, and the shader there trips Playwright's stability
  // check on the composer in the browser tests.
  if (!enabled || navigator.webdriver) return null;
  // -z-10 sits under the content of the card that renders it; that card must isolate.
  return (
    <div className="absolute inset-0 -z-10" style={BACKDROP_STYLE}>
      {backdropById(chosen).render({
        clock: skyClock,
        fadeIn,
        // Faded into the sky so text over the brightest parts stays readable.
        className: "absolute inset-0 opacity-15",
      })}
    </div>
  );
}
