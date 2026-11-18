import type { DitherBackdrop } from "@t3tools/contracts/settings";
import { useLayoutEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";

import { useClientSettings } from "../../hooks/useSettings";
import { BACKDROP_STYLE, backdropById } from "./backdrops";

const SPEED = 0.4;
const skyClock = () => (performance.now() / 1000) * SPEED;

// One sky for the whole app. Each pane that shows a backdrop is a slot that borrows it: the sky's
// element moves between slots instead of each pane building its own, and a moved canvas keeps its
// WebGL context. So navigating never rebuilds the shader, never flashes its fallback, and every
// pane shows the same sky.
let sky: { readonly host: HTMLDivElement; readonly root: Root } | null = null;
const slots: HTMLDivElement[] = [];

function skyHost() {
  if (!sky) {
    const host = document.createElement("div");
    host.className = "absolute inset-0";
    sky = { host, root: createRoot(host) };
  }
  return sky;
}

function Sky({ chosen }: { readonly chosen: DitherBackdrop }) {
  return backdropById(chosen).render({
    clock: skyClock,
    // At once, not faded in: on a reload a fade only adds to the wait.
    fadeIn: false,
    // Faded into the sky so text over the brightest parts stays readable.
    className: "absolute inset-0 opacity-15",
  });
}

/** The chosen dithercn background behind a pane, coloured from the active theme. */
export function ConversationBackdrop() {
  const enabled = useClientSettings((settings) => settings.ditherBackdropEnabled);
  const chosen = useClientSettings((settings) => settings.ditherBackdrop);
  // Automated browsers run WebGL in software, and the shader there trips Playwright's stability
  // check on the composer in the browser tests.
  const shown = enabled && !navigator.webdriver;
  const slotRef = useRef<HTMLDivElement>(null);

  // Layout effects, so the sky moves into the new pane in the same commit the old one leaves:
  // no frame paints without it.
  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- holds the shared sky's DOM node in this pane while mounted
  useLayoutEffect(() => {
    const slot = slotRef.current;
    if (!shown || !slot) return;
    const { host } = skyHost();
    slots.push(slot);
    slot.append(host);
    return () => {
      slots.splice(slots.indexOf(slot), 1);
      if (host.parentNode !== slot) return;
      const previous = slots.at(-1);
      if (previous) previous.append(host);
      else host.remove();
    };
  }, [shown]);

  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- keeps the sky's own React root showing the chosen backdrop
  useLayoutEffect(() => {
    if (shown) skyHost().root.render(<Sky chosen={chosen} />);
  }, [shown, chosen]);

  if (!shown) return null;
  // -z-10 sits under the content of the pane that renders it; that pane must isolate.
  return <div ref={slotRef} className="absolute inset-0 -z-10" style={BACKDROP_STYLE} />;
}
