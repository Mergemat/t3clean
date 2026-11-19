import type { SnapShotSource } from "@t3tools/contracts";
import { T, useGT } from "gt-react";
import { CheckIcon, CopyIcon, ImageIcon, TextIcon } from "lucide-react";
import { Suspense, useRef, useState } from "react";

import { useRenderedAppearance } from "../../hooks/useTheme";
import { cn } from "../../lib/utils";
import { RenderErrorBoundary } from "../RenderErrorBoundary";
import { Button } from "../ui/button";
import { Popover, PopoverPopup, PopoverTitle, PopoverTrigger } from "../ui/popover";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../ui/tooltip";
import {
  ANCHORED_COPY_TOAST_TIMEOUT_MS,
  showAnchoredCopyErrorToast,
} from "../ui/anchoredCopyToast";
import { HighlightedTokens } from "./HighlightedTokens";

export const SNAP_SHOT_ATTACHMENT_FRAME_CLASS =
  "relative h-28 w-52 max-w-full overflow-hidden rounded-row border border-border/80";

interface SnapShotAccessibilityDetails {
  content: string;
  format: "json" | "text";
}

export function SnapShotAccessibilityData({
  details,
  className,
}: {
  details: SnapShotAccessibilityDetails;
  className?: string;
}) {
  const resolvedTheme = useRenderedAppearance();
  const content =
    details.format === "json" ? (
      <RenderErrorBoundary fallback={details.content}>
        <Suspense fallback={details.content}>
          <HighlightedTokens code={details.content} language="json" theme={resolvedTheme} />
        </Suspense>
      </RenderErrorBoundary>
    ) : (
      details.content
    );

  return (
    <pre
      className={cn(
        "overflow-auto whitespace-pre-wrap break-words font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/70",
        className,
      )}
      tabIndex={0}
    >
      {content}
    </pre>
  );
}

export function snapShotAccessibilityDetails(
  source: SnapShotSource,
): SnapShotAccessibilityDetails | undefined {
  if (source.accessibility?.format === "element-tree") {
    return {
      content: JSON.stringify(source.accessibility, null, 2),
      format: "json",
    };
  }

  const text =
    source.accessibility?.format === "flat-text"
      ? source.accessibility.text.trim()
      : source.accessibleText?.trim();
  return text ? { content: text, format: "text" } : undefined;
}

function snapShotIncludesAccessibility(source: SnapShotSource): boolean {
  return Boolean(source.accessibility || source.accessibleText?.trim());
}

export function SnapShotCopyButton({
  onCopy,
  side = "top",
}: {
  onCopy: () => Promise<void>;
  side?: "top" | "right" | "bottom" | "left";
}) {
  const gt = useGT();
  const ref = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            ref={ref}
            aria-label={gt("Copy snapshot")}
            disabled={copied}
            onClick={(event) => {
              event.stopPropagation();
              void onCopy().then(
                () => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), ANCHORED_COPY_TOAST_TIMEOUT_MS);
                },
                (error: unknown) =>
                  showAnchoredCopyErrorToast(
                    ref,
                    error instanceof Error ? error : new Error(String(error)),
                  ),
              );
            }}
            size="xs"
            variant="ghost-muted"
          />
        }
      >
        {copied ? (
          <CheckIcon className="size-3 text-primary" aria-hidden="true" />
        ) : (
          <CopyIcon className="size-3" aria-hidden="true" />
        )}
      </TooltipTrigger>
      <TooltipPopup side={side}>
        <T>Copy snapshot</T>
      </TooltipPopup>
    </Tooltip>
  );
}

export function SnapShotContentsButton({
  source,
  className,
  side = "top",
  onCopySnapshot,
}: {
  source: SnapShotSource;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
  onCopySnapshot?: (() => Promise<void>) | undefined;
}) {
  const gt = useGT();
  const includesAccessibility = snapShotIncludesAccessibility(source);
  const ContentsIcon = includesAccessibility ? TextIcon : ImageIcon;
  const accessibilityDetails = snapShotAccessibilityDetails(source);
  const tooltip = includesAccessibility ? gt("Accessibility data") : gt("No accessibility data");

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <Button
                  aria-label={
                    includesAccessibility
                      ? gt("View accessibility data")
                      : gt("No accessibility data")
                  }
                  className={className}
                  onClick={(event) => event.stopPropagation()}
                  size="icon-xs"
                  variant="overlay"
                />
              }
            />
          }
        >
          <ContentsIcon className="size-3" aria-hidden="true" />
        </TooltipTrigger>
        <TooltipPopup side={side}>{tooltip}</TooltipPopup>
      </Tooltip>
      <PopoverPopup side={side} align="center" width="md">
        <div className="max-h-112 space-y-2 overflow-y-auto">
          <div className="flex items-center justify-between gap-2">
            <PopoverTitle>
              <T>Accessibility data</T>
            </PopoverTitle>
            {onCopySnapshot && (
              <div className="-my-2">
                <SnapShotCopyButton onCopy={onCopySnapshot} side={side} />
              </div>
            )}
          </div>
          {accessibilityDetails ? (
            <SnapShotAccessibilityData
              details={accessibilityDetails}
              className="max-h-64 rounded-row border border-border/70 bg-muted/45 p-2 text-meta leading-4"
            />
          ) : includesAccessibility ? (
            <div className="rounded-row border border-border/70 bg-muted/45 p-2 text-ink-2 text-meta leading-4">
              <T>
                Structured accessibility elements were included, but they have no readable names or
                values.
              </T>
            </div>
          ) : (
            <div className="rounded-row border border-border/70 bg-muted/45 p-2 text-ink-2 text-meta leading-4">
              <T>The app or capture backend did not provide verified accessibility data.</T>
            </div>
          )}
        </div>
      </PopoverPopup>
    </Popover>
  );
}

export function SnapShotAttachmentDetails({
  source,
  onCopySnapshot,
  className,
}: {
  source: SnapShotSource;
  onCopySnapshot?: (() => Promise<void>) | undefined;
  className?: string;
}) {
  const gt = useGT();
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 flex min-w-0 items-center gap-2 bg-linear-to-t from-black/85 via-black/55 to-transparent px-2 pb-2 pt-6",
        className,
      )}
    >
      {source.appIconDataUrl ? (
        <img src={source.appIconDataUrl} alt="" className="size-6 shrink-0 rounded-row" />
      ) : (
        <div className="flex size-6 shrink-0 items-center justify-center rounded-row bg-white/20 text-meta font-medium text-white uppercase">
          {source.appName.slice(0, 1)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2 text-meta font-medium leading-4 text-white">
          <span className="truncate">{source.appName}</span>
          <SnapShotContentsButton
            source={source}
            className="pointer-events-auto"
            onCopySnapshot={onCopySnapshot}
          />
        </div>
        <div className="truncate text-meta leading-4 text-white/70">
          {source.windowTitle || gt("Captured window")}
        </div>
      </div>
    </div>
  );
}
