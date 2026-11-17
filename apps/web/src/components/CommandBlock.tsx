import { CheckIcon, CopyIcon } from "lucide-react";

import { useCopyToClipboard } from "~/hooks/useCopyToClipboard";
import { cn } from "~/lib/utils";

import { Button } from "./ui/button";

export function CommandBlock({
  command,
  className,
  prominent = false,
}: {
  readonly command: string;
  readonly className?: string;
  readonly prominent?: boolean;
}) {
  const { copyToClipboard, isCopied } = useCopyToClipboard({
    timeout: 1500,
    target: "command",
  });
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 border border-border bg-muted/50 font-mono",
        prominent ? "rounded-box px-4 py-4 text-base" : "rounded-row px-2 py-2 text-body",
        className,
      )}
    >
      <span className="min-w-0 truncate">
        <span className="mr-2 text-ink-2">$</span>
        {command}
      </span>
      <Button
        size="icon-xs"
        variant="ghost"
        aria-label="Copy command"
        onClick={() => copyToClipboard(command, undefined)}
      >
        {isCopied ? <CheckIcon /> : <CopyIcon />}
      </Button>
    </div>
  );
}
