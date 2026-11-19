import type { PullRequestReviewGuideStop } from "@t3tools/contracts";
import { T, useGT, useMessages } from "gt-react";
import { CheckIcon } from "lucide-react";

import { cn } from "~/lib/utils";

import { Badge } from "../../ui/badge";
import { stopSubline } from "@t3tools/client-runtime/review-guide-tour";

export function GuideRail({
  stops,
  position,
  seen,
  onSelect,
}: {
  stops: ReadonlyArray<PullRequestReviewGuideStop>;
  position: number;
  seen: ReadonlySet<number>;
  onSelect: (position: number) => void;
}) {
  const gt = useGT();
  const messages = useMessages();
  const reviewed = seen.size;
  const renderStop = (stop: PullRequestReviewGuideStop, index: number) => (
    <li key={index}>
      <RailRow
        active={position === index}
        onClick={() => onSelect(index)}
        lead={<StopBullet number={index + 1} seen={seen.has(index)} />}
        title={stop.title}
        detail={
          <>
            {stop.attention !== null ? (
              <Badge size="sm" variant="warning">
                <T>Look closely</T>
              </Badge>
            ) : null}
            <span>{stopSubline(stop, messages)}</span>
          </>
        }
      />
    </li>
  );

  return (
    <nav aria-label={gt("Review tour")} className="flex min-h-0 flex-col gap-2">
      <p className="text-meta text-ink-2 tabular-nums @max-[56rem]/guide:hidden">
        {gt(
          "{total, plural, one {{reviewed} of {total} read} other {{reviewed} of {total} read}}",
          { reviewed, total: stops.length },
        )}
      </p>
      <div className="flex flex-col gap-2">
        <ol className="flex flex-col">{stops.map(renderStop)}</ol>
      </div>
    </nav>
  );
}

function RailRow({
  active,
  onClick,
  lead,
  title,
  detail,
}: {
  active: boolean;
  onClick: () => void;
  lead: React.ReactNode;
  title: string;
  detail: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-current={active ? "step" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-2 rounded-row px-2 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        active ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
      )}
    >
      {lead}
      <span className="flex min-w-0 flex-col">
        <span className="text-body text-ink-1">{title}</span>
        {detail !== null ? (
          <span className="flex flex-wrap items-center gap-2 text-meta text-ink-2">{detail}</span>
        ) : null}
      </span>
    </button>
  );
}

function StopBullet({ number, seen }: { number: number; seen: boolean }) {
  const gt = useGT();
  return (
    <span
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full border text-meta tabular-nums",
        seen ? "border-success/40 text-success-foreground" : "border-border text-ink-2",
      )}
    >
      {seen ? (
        <CheckIcon aria-label={gt("Stop {number}, read", { number })} className="size-3" />
      ) : (
        number
      )}
    </span>
  );
}
