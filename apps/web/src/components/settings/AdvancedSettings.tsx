import { ChevronRightIcon } from "lucide-react";
import { type ReactNode, useState } from "react";

import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "../ui/collapsible";
import { useSettingsSearchTargetId } from "./settingsLayout";

/**
 * Folds power-user rows at the end of a section. `targetIds` names the search targets inside, so a
 * search jump opens the fold before its row mounts.
 */
export function AdvancedSettings({
  targetIds,
  children,
}: {
  readonly targetIds: ReadonlyArray<string>;
  readonly children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const searchTargetId = useSettingsSearchTargetId();
  const [seenSearchTargetId, setSeenSearchTargetId] = useState<string | null>(null);
  if (seenSearchTargetId !== searchTargetId) {
    setSeenSearchTargetId(searchTargetId);
    if (searchTargetId !== null && targetIds.includes(searchTargetId)) setOpen(true);
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="group flex min-h-10 w-full items-center gap-2 rounded-b-box px-4 text-left text-meta font-medium text-ink-2 outline-none transition-colors hover:text-ink-1 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring data-panel-open:rounded-none">
        <ChevronRightIcon
          aria-hidden
          className="size-4 shrink-0 transition-transform duration-150 group-data-panel-open:rotate-90 motion-reduce:transition-none"
        />
        Advanced
      </CollapsibleTrigger>
      <CollapsiblePanel>{children}</CollapsiblePanel>
    </Collapsible>
  );
}
