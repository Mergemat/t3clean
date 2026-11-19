import { formatPercent } from "@t3tools/shared/usageFormat";
import { useMessages } from "gt-react";
import type { ReactNode } from "react";

import { PageSection } from "../WindowPage";
import { UsageDot } from "./UsageRow";

export interface ShareSegment {
  readonly label: string;
  readonly value: number;
  readonly color: string;
}

/** How a total splits: one track cut into its parts, then the parts read across under it. */
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
  const m = useMessages();
  const visible = segments.filter((segment) => segment.value > 0);
  const total = visible.reduce((sum, segment) => sum + segment.value, 0);
  if (total <= 0) return null;

  return (
    <PageSection title={label} actions={aside}>
      {/* The parts below carry every figure; the track only shows the proportions. */}
      <div aria-hidden className="px-2 py-2">
        <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
          {visible.map((segment) => (
            <div
              key={segment.label}
              className="h-full min-w-0.5"
              style={{ flex: `${segment.value} 1 0`, backgroundColor: segment.color }}
            />
          ))}
        </div>
      </div>
      {/* Read across like the totals: each part's name over its figure, set apart by space. */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-2 sm:grid-cols-4">
        {visible.map((segment) => (
          <div key={segment.label} className="flex min-w-0 flex-col gap-1">
            <span className="flex min-w-0 items-center gap-2 text-meta text-ink-2">
              <UsageDot color={segment.color} />
              <span className="truncate">{m(segment.label)}</span>
            </span>
            <span className="flex items-baseline gap-2 tabular-nums">
              <span className="text-heading font-semibold text-ink-1">{format(segment.value)}</span>
              <span className="text-meta text-ink-2">{formatPercent(segment.value / total)}</span>
            </span>
          </div>
        ))}
      </div>
    </PageSection>
  );
}
