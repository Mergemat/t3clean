import type { ReactNode } from "react";

import { cn } from "~/lib/utils";
import { WorkspacePageContainer, type WorkspacePageWidth } from "./WorkspacePageContainer";

/** The window's body for a page that is not a thread: solid, scrolling, Settings' container. */
export function WindowPage({
  width = "readable",
  children,
}: {
  width?: WorkspacePageWidth;
  children: ReactNode;
}) {
  return (
    <div className="topbar-scroll-fade scrollbar-gutter-both min-h-0 flex-1 overflow-y-auto">
      <WorkspacePageContainer width={width}>{children}</WorkspacePageContainer>
    </div>
  );
}

/**
 * A part of a page, as Settings groups its rows: a small label on the rows' text edge, its
 * controls at the end of that row, then the rows, one step apart. No box. Content that is not a
 * row (a chart, a bar) takes the rows' inset itself (`px-2`).
 */
export function PageSection({
  title,
  actions,
  children,
  className,
  ...rest
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  "aria-busy"?: boolean;
}) {
  return (
    <section {...rest} className="flex min-w-0 flex-col gap-2">
      {title !== undefined || actions !== undefined ? (
        <div className="flex min-h-8 items-center justify-between gap-2 px-2">
          <h2 className="flex min-w-0 items-center gap-2 text-meta font-medium text-ink-2 [&>svg]:size-4 [&>svg]:shrink-0">
            {title}
          </h2>
          {actions}
        </div>
      ) : null}
      <div className={cn("flex min-w-0 flex-col gap-1", className)}>{children}</div>
    </section>
  );
}
