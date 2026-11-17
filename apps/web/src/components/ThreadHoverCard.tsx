import type { ComponentProps, ReactNode } from "react";
import { TooltipPopup } from "./ui/tooltip";
import { cn } from "~/lib/utils";

export function ThreadHoverCardPopup({ className, ...props }: ComponentProps<typeof TooltipPopup>) {
  return (
    <TooltipPopup
      {...props}
      variant="glass"
      className={cn("max-w-80 text-left whitespace-normal", className)}
    />
  );
}

export function ThreadHoverCard({
  title,
  children,
  footer,
}: {
  /** Left out where the thing hovered already shows it. */
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 max-w-80 flex-col gap-2">
      {title ? (
        <div className="min-w-0 truncate text-meta leading-tight font-medium text-ink-1">
          {title}
        </div>
      ) : null}
      <div className="grid gap-2 text-meta text-ink-2">{children}</div>
      {footer}
    </div>
  );
}
