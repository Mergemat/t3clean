import { formatPercent } from "@t3tools/shared/usageFormat";
import type { ReactNode } from "react";

import { Tooltip, TooltipPopup, TooltipTrigger } from "../ui/tooltip";

export interface ShareSegment {
  readonly label: string;
  readonly value: number;
  readonly color: string;
}

export function UsageShareBar({
  label,
  segments,
  format,
  aside,
}: {
  readonly label: string;
  readonly segments: readonly ShareSegment[];
  readonly format: (value: number) => string;
  readonly aside?: ReactNode;
}) {
  const visible = segments.filter((segment) => segment.value > 0);
  const total = visible.reduce((sum, segment) => sum + segment.value, 0);
  if (total <= 0) return null;

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-body font-medium text-ink-1">{label}</h3>
        {aside}
      </div>
      {/* The legend below carries every figure; the bar's tooltips are pointer-only. */}
      <div aria-hidden className="flex h-2">
        {visible.map((segment) => (
          <Tooltip key={segment.label}>
            <TooltipTrigger
              render={
                <div
                  className="h-full min-w-1 rounded-chip first:rounded-l-full last:rounded-r-full"
                  style={{ flex: `${segment.value} 1 0`, backgroundColor: segment.color }}
                />
              }
            />
            <TooltipPopup>
              {segment.label} · {format(segment.value)} · {formatPercent(segment.value / total)}
            </TooltipPopup>
          </Tooltip>
        ))}
      </div>
      <ul aria-label={label} className="flex flex-wrap gap-x-2 gap-y-1 text-meta">
        {visible.map((segment) => (
          <li key={segment.label} className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-2 rounded-chip"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-ink-2">{segment.label}</span>{" "}
            <span className="text-ink-1 tabular-nums">{format(segment.value)}</span>
            <span className="sr-only">, {formatPercent(segment.value / total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
