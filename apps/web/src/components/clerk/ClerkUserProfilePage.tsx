import { RefreshIcon } from "~/components/ui/refresh-icon";

import type { ReactNode } from "react";

import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

export function ClerkUserProfilePage({
  action,
  children,
  className,
  description,
  title,
}: {
  readonly action?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
  readonly description?: ReactNode;
  readonly title: ReactNode;
}) {
  return (
    <div className={cn("w-full min-w-0 text-ink-1", className)}>
      <header className="flex flex-col gap-2 pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:pr-6">
        <div className="min-w-0">
          <h2 className="text-base leading-6 font-semibold">{title}</h2>
          {description ? (
            <p className="mt-1 max-w-136 text-meta leading-4 text-ink-2 sm:min-h-8">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>

      {children}
    </div>
  );
}

export function ClerkUserProfileRefreshButton({
  className,
  disabled = false,
  isPending,
  onClick,
}: {
  readonly className?: string;
  readonly disabled?: boolean;
  readonly isPending: boolean;
  readonly onClick: () => void;
}) {
  return (
    <Button
      size="sm"
      variant="outline"
      className={className}
      disabled={disabled || isPending}
      onClick={onClick}
    >
      <RefreshIcon aria-hidden="true" size="sm" refreshing={isPending} />
      Refresh
    </Button>
  );
}

export function ClerkUserProfileRow({
  children,
  className,
  icon,
}: {
  readonly children: ReactNode;
  readonly className?: string;
  readonly icon: ReactNode;
}) {
  return (
    <li className={cn("border-t py-4 first:border-t-0", className)}>
      <div className="flex items-start gap-2">
        <div
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-row border bg-muted/32 text-ink-2"
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </li>
  );
}
