import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type * as React from "react";

import { cn } from "~/lib/utils";

type ContextChipKind =
  | "neutral"
  | "image"
  | "video"
  | "file"
  | "mention"
  | "terminal"
  | "element"
  | "preview-annotation"
  | "review-comment"
  | "pull-request"
  | "pr-open"
  | "pr-draft"
  | "pr-merged"
  | "pr-closed"
  | "skill"
  | "model"
  | "thread"
  | "environment"
  | "citation"
  | "doc-pdf"
  | "doc-word"
  | "doc-spreadsheet"
  | "doc-slides"
  | "doc-epub";

type ContextChipState = "unresolved" | "invalid";

// Each kind's colour is a theme variable named after it (themePalette.ts).
function contextChipAccent(kind: ContextChipKind, state: ContextChipState | undefined): string {
  if (state === "invalid") return "var(--context-chip-invalid, var(--destructive-foreground))";
  if (state === "unresolved" || kind === "neutral") return "currentColor";
  return `var(--context-chip-${kind})`;
}

interface ContextChipProps extends useRender.ComponentProps<"span"> {
  kind?: ContextChipKind;
  state?: ContextChipState;
  shape?: "inline" | "bubble";
}

function ContextChip({
  className,
  kind = "neutral",
  state,
  shape = "inline",
  render,
  ...props
}: ContextChipProps) {
  const defaultProps = {
    // `--context-chip-ink` stays unset here so surrounding surfaces can recolour chips
    // (TimelineUserMessageRow); inline style would outrank their selector.
    className: cn(
      "inline-flex max-w-full items-center gap-1 font-medium leading-tight [&_svg]:block [&_svg]:size-em [&_svg]:shrink-0 [&_svg]:self-center [button&,a&,[data-popup-open]&]:cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-current rounded-row disabled:cursor-default",
      // PDF red reads as the invalid state, so only the icon carries it.
      kind === "doc-pdf" && state !== "invalid"
        ? "text-(--context-chip-ink,currentColor)"
        : "text-(--context-chip-ink,var(--context-chip-accent))",
      shape === "bubble" &&
        "w-64 gap-2 rounded-box bg-message px-2 py-2 text-body text-message-foreground",
      className,
    ),
    style: {
      "--context-chip-accent": contextChipAccent(kind, state),
      "--document-icon-stroke": "var(--context-chip-ink, var(--context-chip-accent))",
    } as React.CSSProperties,
    "data-slot": "context-chip",
    "data-state": state,
  };
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(defaultProps, props),
    render,
  });
}

function ContextChipLabel({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "block min-w-0 self-baseline overflow-x-clip text-ellipsis whitespace-nowrap underline decoration-transparent decoration-1 underline-offset-3 transition-colors motion-reduce:transition-none [:is(button:enabled,a):hover>&]:decoration-current",
        className,
      )}
      data-slot="context-chip-label"
      {...props}
    />
  );
}

function ContextChipAction({ className, render, ...props }: useRender.ComponentProps<"button">) {
  const defaultProps = {
    className: cn(
      "inline-flex size-em shrink-0 cursor-pointer items-center justify-center rounded-row text-current transition-colors hover:bg-(--context-chip-accent,var(--color-foreground))/17 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none [&_svg]:size-3",
      className,
    ),
    "data-slot": "context-chip-action",
    type: render ? undefined : ("button" as const),
  };
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(defaultProps, props),
    render,
  });
}

export { ContextChip, ContextChipAction, ContextChipLabel, type ContextChipKind };
