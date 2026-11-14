import { useClientSettings } from "../../hooks/useSettings";
import { Ripples } from "../../vendor/dithercn/ripples";

// Ink is the theme's focus colour so the rings follow any theme. The middle stop and the capped
// intensity keep crests dim enough to read messages over.
const PALETTE = [
  "--background",
  "color-mix(in oklab, var(--ring) 30%, var(--background))",
  "color-mix(in oklab, var(--ring) 70%, var(--background))",
] as const;

export function ConversationBackdrop() {
  const enabled = useClientSettings((settings) => settings.ditherBackdropEnabled);
  if (!enabled) return null;
  // -z-10 sits under the timeline inside the conversation area's isolated stacking context.
  return <Ripples className="absolute inset-0 -z-10" palette={PALETTE} intensity={0.6} />;
}
