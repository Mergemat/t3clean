import { RefreshIcon } from "~/components/ui/refresh-icon";

import { cn } from "~/lib/utils";

import { Button } from "../ui/button";

export function PullRequestActivityUnavailableState({
  error,
  term,
  onRetry,
  compact = false,
}: {
  error: string;
  /** The host's word for a change request, as in "pull request". */
  term: string;
  onRetry: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 text-center",
        compact ? "py-2" : "min-h-48 px-4 py-6",
      )}
    >
      <p className="text-body font-medium text-ink-1">Could not load {term} activity</p>
      <p className="max-w-md text-meta text-ink-2">{error}</p>
      <Button size="sm" variant="outline" onClick={onRetry}>
        <RefreshIcon aria-hidden size="sm" />
        Retry
      </Button>
    </div>
  );
}
