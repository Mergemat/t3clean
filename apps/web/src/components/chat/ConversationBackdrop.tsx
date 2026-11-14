import { useClientSettings } from "../../hooks/useSettings";
import { Aurora } from "../../vendor/dithercn/aurora";

// dithercn's "Northern lights" preset. A theme can recolour it by setting --aurora-sky, --aurora-edge
// and --aurora-tip.
export function ConversationBackdrop() {
  const enabled = useClientSettings((settings) => settings.ditherBackdropEnabled);
  // Automated browsers run WebGL in software, and the shader there trips Playwright's stability
  // check on the composer in the browser tests.
  if (!enabled || navigator.webdriver) return null;
  // -z-10 sits under the chat body inside its isolated stacking context.
  return (
    <div className="absolute inset-0 -z-10 bg-(--sky) [--edge:var(--aurora-edge,oklch(0.62_0.17_155))] [--sky:var(--aurora-sky,oklch(0.975_0.012_290))] [--tip:var(--aurora-tip,oklch(0.58_0.19_300))] dark:[--edge:var(--aurora-edge,oklch(0.8_0.18_150))] dark:[--sky:var(--aurora-sky,oklch(0.14_0.03_250))] dark:[--tip:var(--aurora-tip,oklch(0.55_0.16_300))]">
      <Aurora
        background="--sky"
        color="--edge"
        tipColor="--tip"
        curtains={4}
        height={0.28}
        spread={0.08}
        sway={1.6}
        rays={11}
        length={0.7}
        tilt={-6}
        drift={0.5}
        className="absolute inset-0"
      />
    </div>
  );
}
