import { DEFAULT_UNIFIED_SETTINGS } from "@t3tools/contracts/settings";
import type { ReactNode } from "react";

import { cn } from "~/lib/utils";
import { BACKDROP_STYLE, BACKDROPS } from "../chat/backdrops";
import { SettingResetButton, SettingsSection } from "./settingsLayout";
import { searchableSetting } from "./settingsSearch";
import { useScopedSettings, useUpdateScopedSettings } from "./useScopedSettings";

const SPEED = 0.4;
// The previews share one clock, so they move together like the one behind the chat.
const previewClock = () => (performance.now() / 1000) * SPEED;

/** The background behind the chat, as a gallery: each tile runs its effect in the theme. */
export function BackdropSettings() {
  const settings = useScopedSettings();
  const updateSettings = useUpdateScopedSettings();
  const current = settings.ditherBackdropEnabled ? settings.ditherBackdrop : null;
  const isDefault =
    settings.ditherBackdropEnabled === DEFAULT_UNIFIED_SETTINGS.ditherBackdropEnabled &&
    settings.ditherBackdrop === DEFAULT_UNIFIED_SETTINGS.ditherBackdrop;

  return (
    <SettingsSection
      id={searchableSetting("dither-backdrop").id}
      title="Backdrop"
      headerAction={
        isDefault ? null : (
          <SettingResetButton
            label="backdrop"
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
        aria-label="Backdrop"
        className="grid w-full gap-1"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 8rem), 1fr))" }}
      >
        <BackdropTile
          label="None"
          selected={current === null}
          onSelect={() => updateSettings({ ditherBackdropEnabled: false })}
        />
        {BACKDROPS.map((backdrop) => (
          <BackdropTile
            key={backdrop.id}
            label={backdrop.label}
            selected={current === backdrop.id}
            onSelect={() =>
              updateSettings({ ditherBackdropEnabled: true, ditherBackdrop: backdrop.id })
            }
          >
            {/* Stronger than behind the chat (15%), so the effect reads at tile size. */}
            {backdrop.render({ clock: previewClock, className: "absolute inset-0 opacity-40" })}
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
