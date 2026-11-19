import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

/**
 * Something a person wrote, shown outside a thread (an issue's description, a comment): on chat
 * glass like a message in a thread, so it reads as a message and not as page text.
 */
export function MessageCard({ className, ...props }: ComponentProps<"article">) {
  return (
    <article {...props} className={cn("level-chat flex min-w-0 flex-col gap-2 p-4", className)} />
  );
}
