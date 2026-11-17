import { cn } from "~/lib/utils";

export function BrowserMockup({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative flex flex-col overflow-hidden rounded-row border border-border/60 bg-card p-1 shadow-xs/5",
        className,
      )}
    >
      <div className="flex">
        <span className="size-1 rounded-full bg-destructive/80" />
        <span className="size-1 rounded-full bg-warning/80" />
        <span className="size-1 rounded-full bg-success/80" />
      </div>
      <div className="mt-px flex flex-1 flex-col">
        <span className="h-1 w-full rounded-full bg-muted-foreground/30" />
        <span className="h-1 w-3/5 rounded-full bg-muted-foreground/20" />
      </div>
    </div>
  );
}
