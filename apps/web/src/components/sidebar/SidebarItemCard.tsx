import type { ComponentProps, ReactNode } from "react";

import { RelativeTime } from "~/components/RelativeTime";
import { cn } from "~/lib/utils";

/**
 * Something the sidebar lists in place of threads (a pull request, an issue), made like a thread
 * card: where and when on the first line, the title on the second, its key and state on the third.
 * Everything else is in the window once it is open.
 */
export function SidebarItemCard({
  selected,
  icon,
  place,
  updatedAt,
  title,
  status,
  trailing,
  buttonProps,
  className,
  ...rest
}: Omit<ComponentProps<"div">, "title"> & {
  selected: boolean;
  icon: ReactNode;
  place: ReactNode;
  updatedAt: string;
  title: string;
  /** The third line: a state glyph, the key, one word of state. */
  status: ReactNode;
  /** Quiet numbers at the end of the third line. */
  trailing?: ReactNode;
  buttonProps: ComponentProps<"button">;
}) {
  return (
    <div
      {...rest}
      className={cn(
        "rounded-row content-visibility-auto contain-intrinsic-block-21",
        selected ? "bg-sidebar-row-active text-sidebar-foreground" : "hover:bg-sidebar-row-hover",
        className,
      )}
    >
      <button
        type="button"
        aria-current={selected ? "true" : undefined}
        {...buttonProps}
        className="flex w-full cursor-pointer flex-col gap-1 rounded-row px-(--sidebar-content-inset) py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <span className="flex h-5 min-w-0 items-center gap-2 text-meta text-ink-2 [&>svg]:size-4 [&>svg]:shrink-0">
          {icon}
          <span className="min-w-0 flex-1 truncate">{place}</span>
          <span className="shrink-0 tabular-nums">
            <RelativeTime timestamp={updatedAt} />
          </span>
        </span>
        <span className="flex h-5 min-w-0 items-center text-body text-ink-1">
          <span className="truncate">{title}</span>
        </span>
        <span className="flex h-5 min-w-0 items-center gap-2 text-meta text-ink-2">
          {status}
          {trailing ? (
            <span className="ml-auto flex shrink-0 items-center gap-1 tabular-nums text-ink-3">
              {trailing}
            </span>
          ) : null}
        </span>
      </button>
    </div>
  );
}

/** The list's section heading: what the cards under it share, and how many there are. */
export function SidebarItemGroupHeading({
  icon,
  label,
  count,
}: {
  icon?: ReactNode;
  label: ReactNode;
  count?: number;
}) {
  return (
    <h2 className="flex h-8 items-center gap-2 px-(--sidebar-content-inset) text-meta font-medium text-ink-2 [&>svg]:size-4 [&>svg]:shrink-0">
      {icon}
      <span className="min-w-0 truncate">{label}</span>
      {count === undefined ? null : <span className="tabular-nums text-ink-3">{count}</span>}
    </h2>
  );
}
