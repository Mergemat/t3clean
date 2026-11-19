import type { PullRequestAction } from "@t3tools/contracts";
import { sourceControlClients } from "@t3tools/client-runtime/source-control-clients";
import { useGT } from "gt-react";
import { memo, type RefCallback } from "react";

import { cn } from "~/lib/utils";
import { getSourceControlPresentationForKind } from "~/sourceControlPresentation";
import { SidebarItemCard } from "../sidebar/SidebarItemCard";

import type { EnvironmentPullRequestEntry } from "./pullRequestList.logic";
import { openOnHostLabel, showPullRequestLinkContextMenu } from "./pullRequestLinkContextMenu";
import { PullRequestRowGlyph } from "./PullRequestListRow";
import type { PullRequestSpeedActionResult } from "./PullRequestSpeedActions";

export type PullRequestRowTarget = Pick<
  EnvironmentPullRequestEntry,
  "environmentId" | "projectId" | "host" | "repository" | "number"
>;

/** The one word the list says about a pull request's state, worst first. */
function useStatusWord(entry: EnvironmentPullRequestEntry) {
  const gt = useGT();
  if (entry.isDraft) return { label: gt("Draft"), className: "text-ink-3" };
  if (entry.checksState === "failing")
    return { label: gt("Checks failing"), className: "text-destructive-foreground" };
  if (entry.reviewDecision === "changes-requested")
    return { label: gt("Changes requested"), className: "text-warning-foreground" };
  if (entry.checksState === "pending") return { label: gt("Checks running"), className: "" };
  if (entry.reviewDecision === "approved") return { label: gt("Approved"), className: "" };
  if (entry.reviewDecision === "review-required")
    return { label: gt("Review required"), className: "" };
  return null;
}

/**
 * A pull request as the sidebar lists it, made like a thread card: where and when on the first
 * line, the title on the second, its number and state on the third. Everything else is in the
 * window once it is open.
 */
function PullRequestRowImpl({
  entry,
  selected,
  statsKey,
  statsRef,
  onSelect,
  onIntent,
}: {
  entry: EnvironmentPullRequestEntry;
  selected: boolean;
  showProjectTitle: boolean;
  showProvider: boolean;
  environmentLabel?: string;
  matchedElsewhere?: boolean;
  /** Visibility key for deferred line-count reads. */
  statsKey?: string;
  statsRef?: RefCallback<HTMLDivElement>;
  onSelect: (entry: PullRequestRowTarget) => void;
  /** The row the pointer or focus rests on, or null when it leaves. */
  onIntent?: (entry: PullRequestRowTarget | null) => void;
  hostActions: ReadonlySet<PullRequestAction>;
  onActed: (result: PullRequestSpeedActionResult) => void;
  closing?: boolean;
  sweeping?: boolean;
  onCloseSweepStart?: (entry: EnvironmentPullRequestEntry, event: PointerEvent) => void;
}) {
  const { Icon, providerName } = getSourceControlPresentationForKind(entry.provider);
  const status = useStatusWord(entry);
  // Line counts arrive after the list; 0/0 is what an unread entry reports, so it says nothing.
  const hasDiff = Boolean(entry.additions || entry.deletions);
  return (
    <SidebarItemCard
      ref={statsRef}
      data-pull-request-stats-key={statsKey}
      data-pull-request-key={statsKey}
      selected={selected}
      icon={<Icon aria-label={providerName} />}
      place={entry.repository}
      updatedAt={entry.updatedAt}
      title={entry.title}
      status={
        <>
          <PullRequestRowGlyph
            state={entry.state}
            isDraft={entry.isDraft}
            mergeability={entry.mergeability}
            baseBranch={entry.baseBranch}
          />
          <span className="shrink-0 tabular-nums">#{entry.number}</span>
          {status ? (
            <span className={cn("min-w-0 truncate", status.className)}>{status.label}</span>
          ) : null}
        </>
      }
      trailing={hasDiff ? `+${entry.additions} −${entry.deletions}` : null}
      buttonProps={{
        onClick: () => onSelect(entry),
        onPointerEnter: () => onIntent?.(entry),
        onPointerLeave: (event) => {
          if (event.currentTarget !== document.activeElement) onIntent?.(null);
        },
        onFocus: () => onIntent?.(entry),
        onBlur: (event) => {
          if (!event.currentTarget.matches(":hover")) onIntent?.(null);
        },
        onContextMenu: (event) => {
          event.preventDefault();
          void showPullRequestLinkContextMenu({
            url: entry.url,
            openLabel: openOnHostLabel(sourceControlClients.get(entry.provider)),
            position: { x: event.clientX, y: event.clientY },
          });
        },
      }}
    />
  );
}

export const PullRequestRow = memo(PullRequestRowImpl);
