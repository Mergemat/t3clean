import type { ComponentProps } from "react";

import { cn } from "../../lib/utils";

export function SettingsGroup({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="settings-group"
      {...props}
      className={cn(
        // Rows grouped by their label and the space around them, not a box (DESIGN.md).
        "relative flex flex-col gap-1 overflow-visible text-ink-1",
        className,
      )}
    />
  );
}
