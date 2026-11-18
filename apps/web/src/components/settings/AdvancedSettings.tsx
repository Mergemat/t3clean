import { type ReactNode, useState } from "react";

import { Collapsible, CollapsiblePanel } from "../ui/collapsible";
import { SettingsFoldTrigger } from "./FoldedSettingsSection";
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
      <div className="flex min-h-8 items-center px-2">
        <SettingsFoldTrigger>Advanced</SettingsFoldTrigger>
      </div>
      <CollapsiblePanel>{children}</CollapsiblePanel>
    </Collapsible>
  );
}
