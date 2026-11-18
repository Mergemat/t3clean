import type { DitherBackdrop } from "@t3tools/contracts/settings";
import type { CSSProperties, ReactNode } from "react";

import { cn } from "~/lib/utils";
import { Aurora } from "../../vendor/dithercn/aurora";
import { FlowField } from "../../vendor/dithercn/flow-field";
import { MeshGradient } from "../../vendor/dithercn/mesh-gradient";
import { NoiseField } from "../../vendor/dithercn/noise-field";
import { Silk } from "../../vendor/dithercn/silk";
import { Smoke } from "../../vendor/dithercn/smoke";
import { Starfield } from "../../vendor/dithercn/starfield";
import { Waves } from "../../vendor/dithercn/waves";

const SKY = "var(--aurora-sky, var(--card))";
const EDGE = "var(--aurora-edge, var(--primary))";
const TIP = "var(--aurora-tip, color-mix(in oklab, var(--primary) 45%, var(--muted-foreground)))";

// Every backdrop is coloured from the active theme: the engine's paper and ink are read in the
// backdrop's own scope, so setting them here themes all of them, sky from the card surface and
// ink from the accent. A theme can override them with --aurora-sky, --aurora-edge and --aurora-tip.
export const BACKDROP_STYLE = {
  backgroundColor: SKY,
  "--dither-paper": SKY,
  "--dither-ink": EDGE,
} as CSSProperties;

type BackdropProps = {
  readonly clock?: () => number;
  readonly cell?: number;
  readonly fadeIn?: boolean;
  readonly className?: string;
};

// Each effect's own fallback is a blurred CSS imitation of it, shown until the shader draws its
// first frame, which on a reload can take a while. The plain sky shows instead.
const skyUntilDrawn = (props: BackdropProps) => ({
  ...props,
  className: cn("[&>[data-dither-fallback]]:hidden", props.className),
});

/** The calm set: low contrast and slow, so text over them stays readable. */
export const BACKDROPS: ReadonlyArray<{
  readonly id: DitherBackdrop;
  readonly label: string;
  readonly render: (props: BackdropProps) => ReactNode;
}> = [
  {
    id: "aurora",
    label: "Aurora",
    // dithercn's "Northern lights" shape.
    render: (props) => (
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
        {...skyUntilDrawn(props)}
      />
    ),
  },
  {
    id: "mesh-gradient",
    label: "Mesh",
    render: (props) => <MeshGradient {...skyUntilDrawn(props)} />,
  },
  {
    id: "noise-field",
    label: "Noise",
    render: (props) => <NoiseField {...skyUntilDrawn(props)} />,
  },
  { id: "waves", label: "Waves", render: (props) => <Waves {...skyUntilDrawn(props)} /> },
  { id: "starfield", label: "Stars", render: (props) => <Starfield {...skyUntilDrawn(props)} /> },
  { id: "silk", label: "Silk", render: (props) => <Silk {...skyUntilDrawn(props)} /> },
  { id: "smoke", label: "Smoke", render: (props) => <Smoke {...skyUntilDrawn(props)} /> },
  { id: "flow-field", label: "Flow", render: (props) => <FlowField {...skyUntilDrawn(props)} /> },
];

export const backdropById = (id: DitherBackdrop) =>
  BACKDROPS.find((backdrop) => backdrop.id === id) ?? BACKDROPS[0]!;
