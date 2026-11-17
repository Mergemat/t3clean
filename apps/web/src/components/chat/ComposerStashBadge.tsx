import { BookmarkIcon } from "lucide-react";
import { memo } from "react";

import { cn } from "~/lib/utils";
import { ComposerBanner } from "./ComposerBanner";

export const ComposerStashBadge = memo(function ComposerStashBadge(props: {
  count: number;
  menuOpen: boolean;
  /** Bumped per stash; each new key replays the pulse. 0 means never pulsed. */
  pulseKey: number;
  onToggleMenu: () => void;
}) {
  if (props.count === 0) return null;
  const pulsed = props.pulseKey > 0;
  const count = (
    <ComposerBanner.Count
      // Remounting the count per stash restarts its CSS pulse; no timer has to end it.
      key={props.pulseKey}
      className={cn(
        "text-ink-2",
        pulsed &&
          "animate-stash-pulse-count transition duration-180 ease-out starting:translate-y-1 starting:opacity-0 motion-reduce:transition-none",
      )}
    >
      {props.count}
    </ComposerBanner.Count>
  );

  return (
    <ComposerBanner.Root
      density="comfortable"
      width="content"
      data-composer-shoulder-tab
      className="ml-auto"
    >
      <ComposerBanner.Row
        render={<button type="button" />}
        data-prompt-stash-badge="true"
        aria-label={`Stashed prompts: ${props.count}. Open stash.`}
        aria-expanded={props.menuOpen}
        className={cn(
          "transition-colors duration-200",
          props.menuOpen && "pointer-events-none",
          props.menuOpen ? "text-ink-1" : "text-ink-2 hover:text-ink-1",
          // The button keeps its identity (focus, hover) across stashes. Swapping between two
          // identical keyframes restarts the row's animation instead.
          pulsed &&
            (props.pulseKey % 2 === 0 ? "animate-stash-pulse-row-alt" : "animate-stash-pulse-row"),
        )}
        onPointerDown={(event) => event.preventDefault()}
        onClick={props.onToggleMenu}
      >
        <ComposerBanner.Icon>
          <BookmarkIcon />
        </ComposerBanner.Icon>
        <ComposerBanner.Content>Stash</ComposerBanner.Content>
        <ComposerBanner.Actions>{count}</ComposerBanner.Actions>
      </ComposerBanner.Row>
    </ComposerBanner.Root>
  );
});
