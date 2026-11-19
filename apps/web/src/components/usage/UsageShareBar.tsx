import { formatPercent } from "@t3tools/shared/usageFormat";
import { useMessages } from "gt-react";
import type { ReactNode } from "react";

import { PageSection } from "../WindowPage";
import { UsageDot, UsageLine } from "./UsageRow";

export interface ShareSegment {
  readonly label: string;
  readonly value: number;
  readonly color: string;
}

/** How a total splits: one line per part, each with its share. */
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
      {visible.map((segment) => (
        <UsageLine
          key={segment.label}
          lead={<UsageDot color={segment.color} />}
          title={m(segment.label)}
          share={segment.value / total}
          color={segment.color}
          value={format(segment.value)}
          shareLabel={formatPercent(segment.value / total)}
        />
      ))}
    </PageSection>
  );
}
