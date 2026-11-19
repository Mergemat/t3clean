import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

/**
 * A row of the Usage page, made like a Settings row: the name and its detail on the left, the
 * figure and its detail on the right, each line in a 20px slot. Pressable when it opens more.
 */
export function UsageRow({
  lead,
  title,
  detail,
  value,
  valueDetail,
  dimmed = false,
  onClick,
  children,
}: {
  /** A mark before the name: a colour dot, a provider icon. */
  lead?: ReactNode;
  title: ReactNode;
  detail?: ReactNode;
  value: ReactNode;
  valueDetail?: ReactNode;
  /** Still loading: the figures fade, the row keeps its place. */
  dimmed?: boolean;
  onClick?: () => void;
  /** A full-width line under the row, such as a bar. */
  children?: ReactNode;
}) {
  const body = (
    <>
      <span className="flex min-w-0 flex-1 items-start gap-2">
        {lead ? <span className="flex h-5 shrink-0 items-center">{lead}</span> : null}
        <span className="flex min-w-0 flex-col gap-1">
          <span className="flex min-h-5 min-w-0 items-center truncate text-body text-ink-1">
            {title}
          </span>
          {detail ? <span className="truncate text-meta text-ink-2">{detail}</span> : null}
        </span>
      </span>
      <span
        className={cn(
          "flex shrink-0 flex-col items-end gap-1 tabular-nums transition-opacity",
          dimmed && "opacity-40 delay-150",
        )}
      >
        <span className="flex min-h-5 items-center text-body text-ink-1">{value}</span>
        {valueDetail ? <span className="text-meta text-ink-2">{valueDetail}</span> : null}
      </span>
    </>
  );
  return (
    <div className="flex flex-col gap-2 rounded-row px-2 py-2 has-[button:hover]:bg-tint-2 has-focus-visible:bg-tint-2">
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="flex w-full cursor-pointer items-start gap-6 text-left outline-none"
        >
          {body}
        </button>
      ) : (
        <div className="flex items-start gap-6">{body}</div>
      )}
      {children}
    </div>
  );
}

/** The colour that stands for a provider or a part, the same dot the chart's lines use. */
export function UsageDot({ color }: { color: string }) {
  return (
    <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
  );
}

/** A row's share of the whole, as a thin track under it; the figures beside it say it exactly. */
function UsageShareTrack({ share, color }: { share: number; color: string }) {
  return (
    <div aria-hidden className="h-1 overflow-hidden rounded-full bg-tint-1">
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.max(0, Math.min(1, share)) * 100}%`, backgroundColor: color }}
      />
    </div>
  );
}

/**
 * One line of a split (a provider, a model, a kind of cost): name and its detail, a short share
 * track, the figure and its share, in fixed columns so every list on the page lines up.
 */
export function UsageLine({
  lead,
  title,
  detail,
  share,
  color,
  value,
  shareLabel,
  dimmed = false,
  onClick,
}: {
  lead?: ReactNode;
  title: ReactNode;
  detail?: ReactNode;
  /** 0 to 1; null leaves the track out. */
  share: number | null;
  color: string;
  value: ReactNode;
  shareLabel?: ReactNode;
  dimmed?: boolean;
  onClick?: () => void;
}) {
  const className =
    "grid h-8 w-full min-w-0 grid-cols-(--grid-usage-line) items-center gap-x-4 rounded-row px-2 text-left tabular-nums";
  const body = (
    <>
      {/* The detail gives way before the name does. */}
      <span className="flex min-w-0 items-center gap-2 overflow-hidden">
        {lead ? <span className="flex shrink-0 items-center [&>svg]:size-4">{lead}</span> : null}
        <span className="max-w-full shrink-0 truncate text-body text-ink-1">{title}</span>
        {detail ? <span className="min-w-0 truncate text-meta text-ink-2">{detail}</span> : null}
      </span>
      <span>{share === null ? null : <UsageShareTrack share={share} color={color} />}</span>
      <span
        className={cn("text-end text-body text-ink-1 transition-opacity", dimmed && "opacity-40")}
      >
        {value}
      </span>
      <span className="text-end text-meta text-ink-2">{shareLabel}</span>
    </>
  );
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        className,
        "cursor-pointer outline-none hover:bg-tint-2 focus-visible:bg-tint-2",
      )}
    >
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  );
}
