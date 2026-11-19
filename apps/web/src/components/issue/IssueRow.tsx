import type { EnvironmentIssueEntry } from "@t3tools/client-runtime/issue-list";
import { MessageSquareIcon } from "lucide-react";
import { memo } from "react";

import { SidebarItemCard } from "../sidebar/SidebarItemCard";
import {
  IssueStateGlyph,
  issueStatePresentation,
  issueTrackerPresentation,
} from "./issuePresentation";

export type IssueRowTarget = Pick<
  EnvironmentIssueEntry,
  "environmentId" | "projectId" | "tracker" | "host" | "scope" | "key" | "url"
>;

/** An issue as the sidebar lists it, on the same card as a pull request. */
function IssueRowImpl({
  entry,
  selected,
  onSelect,
}: {
  entry: EnvironmentIssueEntry;
  selected: boolean;
  onSelect: (entry: IssueRowTarget) => void;
}) {
  const tracker = issueTrackerPresentation(entry.tracker);
  return (
    <SidebarItemCard
      selected={selected}
      icon={<tracker.Icon aria-label={tracker.providerName} />}
      place={entry.scope}
      updatedAt={entry.updatedAt}
      title={entry.title}
      status={
        <>
          <IssueStateGlyph state={entry.state} />
          <span className="shrink-0 tabular-nums">{entry.displayKey}</span>
          <span className="min-w-0 truncate">{issueStatePresentation(entry.state).label}</span>
        </>
      }
      trailing={
        entry.commentCount > 0 ? (
          <>
            <MessageSquareIcon aria-hidden className="size-3" />
            {entry.commentCount}
          </>
        ) : null
      }
      buttonProps={{ onClick: () => onSelect(entry) }}
    />
  );
}

export const IssueRow = memo(IssueRowImpl);
