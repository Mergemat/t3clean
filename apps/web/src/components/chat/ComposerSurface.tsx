import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

function Shell({
  contextRow = false,
  className,
  ...props
}: ComponentProps<"div"> & { contextRow?: boolean }) {
  return (
    <div
      data-slot="composer-shell"
      data-context-row={contextRow || undefined}
      className={cn(
        "@container/composer-surface group/composer-surface relative isolate mx-auto w-full max-w-(--chat-content-max-width)",
        className,
      )}
      {...props}
    />
  );
}

function Host({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="composer-host"
      className={cn("relative z-10 w-full rounded-box", className)}
      {...props}
    />
  );
}

/** The composer's card: a float (see Height in DESIGN.md). Its drawers stand on its top edge. */
function Main({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-chat-composer-main-surface="true"
      className={cn("dropdown-glass group relative z-10 rounded-box", className)}
      {...props}
    />
  );
}

/** A row under the card (environment, worktree, branch); page-coloured glass hides the timeline scrolling behind it. */
function ContextStrip({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="composer-context-strip"
      className={cn(
        "group/composer-context surface-glass relative flex w-full items-center gap-2 overflow-x-clip px-2 pt-2 text-ink-2",
        className,
      )}
      {...props}
    />
  );
}

export const ComposerSurface = { Shell, Host, Main, ContextStrip };
