import { DEFAULT_UNIFIED_SETTINGS } from "@t3tools/contracts/settings";
import { useGT, useMessages } from "gt-react";
import { type ReactNode, useEffect, useState } from "react";

import { cn } from "~/lib/utils";
import { BACKDROP_STYLE, BACKDROPS } from "../chat/backdrops";
import { SettingResetButton, SettingsSection } from "./settingsLayout";
import { useSearchableSetting } from "./settingsSearch";
import { useScopedSettings, useUpdateScopedSettings } from "./useScopedSettings";

const SPEED = 0.4;
// The previews share one clock, so they move together like the one behind the chat.
const previewClock = () => (performance.now() / 1000) * SPEED;
// A tile is about a sixth of the pane and the sky's cell is 3px, so a tile that looks like the sky
// shrunk down needs half a pixel: one device pixel on a retina screen, the smallest the shader draws.
const PREVIEW_CELL = 0.5;

/** The background behind the chat, as a gallery: each tile runs its effect in the theme. */
export function BackdropSettings() {
  const gt = useGT();
  const m = useMessages();
  const settings = useScopedSettings();
  const searchableSetting = useSearchableSetting();
  // Each preview compiles a shader. Starting one per idle moment after the page has painted keeps
  // opening Appearance instant and leaves room for input between them.
  const [previewsStarted, setPreviewsStarted] = useState(0);
  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- paces work to the browser's idle time, outside React
  useEffect(() => {
    if (previewsStarted >= BACKDROPS.length) return;
    const id = requestIdleCallback(() => setPreviewsStarted((count) => count + 1), {
      timeout: 500,
    });
    return () => cancelIdleCallback(id);
  }, [previewsStarted]);
  const updateSettings = useUpdateScopedSettings();
  const current = settings.ditherBackdropEnabled ? settings.ditherBackdrop : null;
  const isDefault =
    settings.ditherBackdropEnabled === DEFAULT_UNIFIED_SETTINGS.ditherBackdropEnabled &&
    settings.ditherBackdrop === DEFAULT_UNIFIED_SETTINGS.ditherBackdrop;

  return (
    <SettingsSection
      id={searchableSetting("dither-backdrop").id}
      title={gt("Backdrop")}
      headerAction={
        isDefault ? null : (
          <SettingResetButton
            ariaLabel={gt("Reset backdrop")}
            onClick={() =>
              updateSettings({
                ditherBackdropEnabled: DEFAULT_UNIFIED_SETTINGS.ditherBackdropEnabled,
                ditherBackdrop: DEFAULT_UNIFIED_SETTINGS.ditherBackdrop,
              })
            }
          />
        )
      }
    >
      <div
        role="group"
        aria-label={gt("Backdrop")}
        className="grid w-full gap-1"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 8rem), 1fr))" }}
      >
        <BackdropTile
          label={gt("None")}
          selected={current === null}
          onSelect={() => updateSettings({ ditherBackdropEnabled: false })}
        />
        {BACKDROPS.map((backdrop, index) => (
          <BackdropTile
            key={backdrop.id}
            label={m(backdrop.label)}
            selected={current === backdrop.id}
            onSelect={() =>
              updateSettings({ ditherBackdropEnabled: true, ditherBackdrop: backdrop.id })
            }
          >
            {index < previewsStarted
              ? backdrop.render({
                  clock: previewClock,
                  cell: PREVIEW_CELL,
                  className: "absolute inset-0 opacity-15",
                })
              : null}
          </BackdropTile>
        ))}
      </div>
    </SettingsSection>
  );
}

function BackdropTile(props: {
  readonly label: string;
  readonly selected: boolean;
  readonly onSelect: () => void;
  readonly children?: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={props.selected}
      onClick={props.onSelect}
      className={cn(
        "flex cursor-pointer flex-col gap-2 rounded-box p-2 text-left outline-none transition-colors hover:bg-foreground/4 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        props.selected && "bg-foreground/8 hover:bg-foreground/8",
      )}
    >
      <span
        aria-hidden
        className="relative isolate block aspect-video overflow-hidden rounded-row"
        style={BACKDROP_STYLE}
      >
        {props.children}
      </span>
      <span className="truncate px-1 text-center text-body text-ink-1">{props.label}</span>
    </button>
  );
}
