import { useState } from "react";

import { useClientSettings } from "../../hooks/useSettings";
import { Aurora } from "../../vendor/dithercn/aurora";

const SPEED = 0.4;
// Each route mounts its own backdrop. One clock for all of them makes the new one show the same
// sky the old one did, and only the first ever fades in, so navigating never restarts the aurora.
const skyClock = () => (performance.now() / 1000) * SPEED;
let skySeen = false;

const SKY = "var(--aurora-sky, var(--card))";
const EDGE = "var(--aurora-edge, var(--primary))";
const TIP = "var(--aurora-tip, color-mix(in oklab, var(--primary) 45%, var(--muted-foreground)))";

// dithercn's "Northern lights" shape, coloured from the active theme: sky from the card surface, edges
// from the accent. A theme can override them with --aurora-sky, --aurora-edge and --aurora-tip.
export function ConversationBackdrop() {
  const enabled = useClientSettings((settings) => settings.ditherBackdropEnabled);
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
    <div className="absolute inset-0 -z-10" style={{ backgroundColor: SKY }}>
      <Aurora
        background={SKY}
        color={EDGE}
        tipColor={TIP}
        curtains={4}
        height={0.28}
        spread={0.08}
        sway={1.6}
        rays={11}
        length={0.7}
        tilt={-6}
        drift={0.5}
        clock={skyClock}
        fadeIn={fadeIn}
        // Faded into the sky so text over the brightest curtains stays readable.
        className="absolute inset-0 opacity-15"
      />
    </div>
  );
}
