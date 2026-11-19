import { useGT } from "gt-react";
import type { ScopedThreadRef } from "@t3tools/contracts";
import { X } from "lucide-react";

import { isValidHistoryTimestamp, type BrowserHistoryEntry } from "~/browserHistoryStore";
import { RelativeTime } from "~/components/RelativeTime";
import { Button } from "~/components/ui/button";

import { PreviewFaviconIcon } from "./PreviewFaviconIcon";

interface Props {
  threadRef: ScopedThreadRef;
  entry: BrowserHistoryEntry;
  onOpen: () => void;
  onRemove: () => void;
}

export function PreviewRecentUrlCard({ threadRef, entry, onOpen, onRemove }: Props) {
  const gt = useGT();
  const parsed = new URL(entry.url);
  const path = parsed.pathname === "/" ? "" : parsed.pathname;
  const label = `${parsed.host}${path}${parsed.search}${parsed.hash}`;
  const visitedAt = isValidHistoryTimestamp(entry.lastVisitedAt) ? (
    <RelativeTime timestamp={new Date(entry.lastVisitedAt).toISOString()} />
  ) : null;
  return (
    <div className="group relative flex w-full items-center">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-2 rounded-row px-2 py-2 pr-8 text-left hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <PreviewFaviconIcon threadRef={threadRef} url={entry.url} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-body font-medium text-ink-1">{entry.title ?? label}</span>
          <span className="truncate text-meta text-ink-2">
            {entry.title ? `${label} · ` : ""}
            {visitedAt}
          </span>
        </div>
      </button>
      <span className="absolute right-2 flex opacity-0 focus-within:opacity-100 group-hover:opacity-100">
        <Button
          size="icon-xs"
          variant="ghost-muted"
          aria-label={gt("Remove {url} from history", { url: label })}
          onClick={onRemove}
        >
          <X />
        </Button>
      </span>
    </div>
  );
}
