import { formatPercent } from "@t3tools/shared/usageFormat";
import { useMessages } from "gt-react";
import type { ReactNode } from "react";

import { PageSection } from "../WindowPage";
import { UsageDot, UsageRow } from "./UsageRow";

export interface ShareSegment {
  readonly label: string;
  readonly value: number;
  readonly color: string;
}

/** How a total splits: one track cut into its parts, then a row per part. */
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
      {/* The rows carry every figure; the track only shows the proportions. */}
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
      {visible.map((segment) => (
        <UsageRow
          key={segment.label}
          lead={<UsageDot color={segment.color} />}
          title={m(segment.label)}
          value={format(segment.value)}
          valueDetail={formatPercent(segment.value / total)}
        />
      ))}
    </PageSection>
  );
}
