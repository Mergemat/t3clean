import type { ComponentProps, ReactNode } from "react";

import { cn } from "../../lib/utils";

/**
 * A group of rows in the details card. Its heading names a list (side chats, servers) or a group
 * of several rows; a lone row names itself, so its group is only the space above it. A heading
 * that holds actions always shows.
 */
export function ThreadDetailsSection({
  headingId,
  title,
  actions,
  rowsClassName,
  children,
  ...props
}: Omit<ComponentProps<"section">, "className" | "style" | "title" | "aria-labelledby"> & {
  headingId: string;
  title: string;
  actions?: ReactNode;
  /** Lays out the rows (a grid for aligned columns); rows stay its direct children. */
  rowsClassName?: string;
}) {
  const hasActions = actions !== undefined && actions !== null;
  return (
    <section
      {...props}
      aria-labelledby={headingId}
      // A row can still render nothing (a fresh draft quiets Git actions), so an empty group
      // collapses.
      className="group/details-section has-[>[data-details-rows]:empty]:hidden"
    >
      <div
        className={cn(
          "min-h-8 min-w-0 items-center justify-between gap-2 px-2",
          hasActions
            ? "flex"
            : "hidden group-has-[>[data-details-rows]>:nth-child(2)]/details-section:flex group-has-[>[data-details-rows]_ul]/details-section:flex",
        )}
      >
        <h3
          id={headingId}
          className="min-w-0 truncate text-meta font-medium text-ink-2 select-none"
        >
          {title}
        </h3>
        {hasActions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
      </div>
      <div data-details-rows className={cn("flex flex-col gap-1", rowsClassName)}>
        {children}
      </div>
    </section>
  );
}
