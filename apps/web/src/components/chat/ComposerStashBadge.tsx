import { BookmarkIcon } from "lucide-react";
import { memo } from "react";

import { cn } from "~/lib/utils";
import { Button } from "../ui/button";

export const ComposerStashBadge = memo(function ComposerStashBadge(props: {
  count: number;
  menuOpen: boolean;
  /** Bumped per stash; each new key replays the pulse. 0 means never pulsed. */
  pulseKey: number;
  onToggleMenu: () => void;
}) {
  if (props.count === 0) return null;
  const pulsed = props.pulseKey > 0;

  return (
    <Button
      type="button"
      variant="ghost-muted"
      size="sm"
      data-prompt-stash-badge="true"
      data-pressed={props.menuOpen || undefined}
      aria-label={`Stashed prompts: ${props.count}. ${props.menuOpen ? "Close" : "Open"} stash.`}
      aria-expanded={props.menuOpen}
      onPointerDown={(event) => event.preventDefault()}
      onClick={props.onToggleMenu}
    >
      <span
        // The button keeps its identity (focus, hover) across stashes. Swapping between two
        // identical keyframes restarts its animation instead.
        className={cn(
          "flex items-center gap-2",
          pulsed &&
            (props.pulseKey % 2 === 0 ? "animate-stash-pulse-row-alt" : "animate-stash-pulse-row"),
        )}
      >
        <BookmarkIcon />
        <span
          // Remounting the count per stash restarts its CSS pulse; no timer has to end it.
          key={props.pulseKey}
          className={cn(
            "tabular-nums",
            pulsed &&
              "animate-stash-pulse-count transition duration-180 ease-out starting:translate-y-1 starting:opacity-0 motion-reduce:transition-none",
          )}
        >
          {props.count}
        </span>
      </span>
    </Button>
  );
});
