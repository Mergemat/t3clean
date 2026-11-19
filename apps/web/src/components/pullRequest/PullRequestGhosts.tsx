import type { PullRequestListEntry, PullRequestSummary } from "@t3tools/contracts";
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  EllipsisIcon,
  ExternalLinkIcon,
  PanelRightIcon,
  TagIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";
import { msg, T, useGT, useMessages, Var } from "gt-react";
import { useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { BarContext, barControlSize } from "../barSize";
import { WindowHeaderSlotContext } from "../ListPageWindow";
import {
  sourceControlClients,
  type ChangeRequestTerminology,
} from "@t3tools/client-runtime/source-control-clients";

import { readLocalApi } from "~/localApi";
import { cn } from "~/lib/utils";
import { RelativeTime } from "~/components/RelativeTime";

import { Button, InlineButton } from "../ui/button";
import { MiddleTruncate } from "../ui/middle-truncate";
import { PullRequestCopyableCode } from "./PullRequestCopyableCode";
import {
  PullRequestChecksStatusLine,
  PullRequestDetailHeaderBody,
  PullRequestDetailTabBar,
  PullRequestDetailTitleRow,
} from "./PullRequestDetailLayout";
import {
  PullRequestActorLabel,
  PullRequestDiffStat,
  PullRequestLabelChip,
  pullRequestChecksStatePresentation,
  resolvePullRequestState,
} from "./pullRequestPresentation";
import { resolveFilterOptions } from "./pullRequestListOptions";

import { changeRequestTermKind } from "./changeRequestTerm";

export function GhostBar({ className }: { className?: string | undefined }) {
  return (
    <span aria-hidden className={cn("block h-3 rounded-chip bg-muted-foreground/15", className)} />
  );
}

const TITLE_WIDTHS = ["w-3/5", "w-2/5", "w-1/2", "w-2/3", "w-2/5", "w-3/5", "w-1/2"];
const META_WIDTHS = ["w-2/5", "w-1/3", "w-2/5", "w-1/4", "w-1/3", "w-2/5", "w-1/3"];
const DEFAULT_DETAIL_TABS = [
  { value: "summary", label: msg("Summary", { $context: "pull request tab" }) },
  { value: "timeline", label: msg("Timeline", { $context: "pull request tab" }) },
  { value: "code", label: msg("Code", { $context: "pull request tab" }) },
] as const;

export function PullRequestListGhost({ rows = 7, caption }: { rows?: number; caption?: string }) {
  const gt = useGT();
  return (
    <div role="status" aria-label={caption ?? gt("Loading pull requests")} className="">
      {/* Outside the pulse so the explanation stays readable. */}
      {caption ? <p className="px-2 pb-1 text-meta font-medium text-ink-2">{caption}</p> : null}
      <div className="motion-safe:animate-skeleton">
        {Array.from({ length: rows }, (_, index) => (
          <div
            key={index}
            className="grid grid-cols-(--grid-lead-trail) items-center gap-2 rounded-row px-2 py-2"
          >
            <GhostBar className="size-4 rounded-full" />
            <div className="min-w-0 space-y-2">
              <GhostBar className={cn("h-4", TITLE_WIDTHS[index % TITLE_WIDTHS.length])} />
              <GhostBar className={cn("h-4", META_WIDTHS[index % META_WIDTHS.length])} />
            </div>
            <div className="flex flex-col items-end gap-2">
              <GhostBar className="w-12" />
              <GhostBar className="w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PullRequestDetailGhost({
  seed: entry,
  summary,
  actions,
  checkoutCommand,
  tabs: requestedTabs,
  activeTab,
  number,
  onBack,
  onClose,
  onCheckoutError,
}: {
  seed?: PullRequestListEntry | null;
  summary?: PullRequestSummary | null;
  actions?: ReactNode;
  checkoutCommand?: string | null;
  tabs?: ReadonlyArray<{ value: string; label: string }>;
  activeTab?: string;
  number?: number;
  onBack?: (() => void) | undefined;
  onClose?: (() => void) | undefined;
  onCheckoutError?: ((error: Error) => void) | undefined;
}) {
  const gt = useGT();
  const frameHeader = useContext(WindowHeaderSlotContext);
  const controlSize = barControlSize(frameHeader ? "frame" : "panel");
  const resolve = useMessages();
  const tabs = requestedTabs ?? resolveFilterOptions(DEFAULT_DETAIL_TABS, resolve);
  const seed = summary
    ? {
        ...entry,
        ...summary,
        isDraft: summary.isDraft ?? entry?.isDraft,
      }
    : entry;
  const terminology = sourceControlClients.get(seed?.provider).changeRequest;
  const statePresentation = seed
    ? resolvePullRequestState(
        {
          state: seed.state,
          isDraft: seed.isDraft ?? false,
        },
        resolve,
      )
    : null;
  // Passing list rollups can omit workflows awaiting approval; wait for detail.
  const checksPresentation =
    seed?.checksState === "failing" || seed?.checksState === "pending"
      ? pullRequestChecksStatePresentation(seed.checksState, resolve)
      : null;
  const checkout = checkoutCommand ?? null;
  const changedFiles = summary?.changedFiles ?? null;
  const selectedTab =
    tabs.find((item) => item.value === activeTab)?.value ?? tabs[0]?.value ?? "summary";

  const headerRow = (
    <>
      <div className={cn("grid h-6 min-w-0 items-center overflow-hidden", !frameHeader && "pl-4")}>
        <div className="flex min-w-0 items-center gap-1 text-body text-ink-2 sm:text-meta">
          {onBack ? (
            <Button
              size={controlSize.icon}
              variant="ghost-muted"
              className="-ml-2"
              onClick={onBack}
              aria-label={gt("Back to this thread's pull requests")}
            >
              <ArrowLeftIcon aria-hidden className="size-4" />
            </Button>
          ) : null}
          {seed ? (
            <>
              <span className="min-w-0 truncate font-medium">{seed.repository}</span>
              <InlineButton
                onClick={() => void readLocalApi()?.shell.openExternal(seed.url)}
                aria-label={gt(
                  "Open {term, select, mr {merge request} cr {change request} other {pull request}} #{number} on host",
                  {
                    term: changeRequestTermKind(terminology),
                    number: seed.number,
                  },
                )}
              >
                <span className={statePresentation?.toneClassName}>#{seed.number}</span>
                <ExternalLinkIcon aria-hidden className="size-3" />
              </InlineButton>
            </>
          ) : (
            <>
              <GhostBar className="w-24" />
              <span className="shrink-0 text-meta text-ink-2">#{number ?? "…"}</span>
            </>
          )}
        </div>
      </div>
      <div
        className={cn("flex h-6 shrink-0 items-center justify-end gap-1", !frameHeader && "mr-2")}
      >
        {actions ?? <GhostBar className="h-6 w-16 rounded-row" />}
        <Button
          size={controlSize.icon}
          variant="ghost"
          disabled
          aria-label={gt(
            "{term, select, mr {Merge request} cr {Change request} other {Pull request}} actions loading",
            {
              term: changeRequestTermKind(terminology),
            },
          )}
        >
          <EllipsisIcon aria-hidden className="size-4" />
        </Button>
        {onClose ? (
          <Button
            size={controlSize.icon}
            variant="ghost"
            aria-label={gt(
              "Collapse {term, select, mr {merge request} cr {change request} other {pull request}} panel",
              { term: changeRequestTermKind(terminology) },
            )}
            onClick={onClose}
          >
            <PanelRightIcon aria-hidden className="size-4" />
          </Button>
        ) : null}
      </div>
    </>
  );

  return (
    <div
      role="status"
      aria-label={gt(
        "Loading {term, select, mr {merge request} cr {change request} other {pull request}}",
        { term: changeRequestTermKind(terminology) },
      )}
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden",
        !seed && "motion-safe:animate-skeleton",
      )}
    >
      <div className="@container/pr-header grid min-w-0 shrink-0 grid-cols-(--grid-trail) items-start gap-x-2">
        {/* In the window the crumbs and actions sit in the frame header, as the loaded panel's do. */}
        {frameHeader
          ? createPortal(<BarContext value="frame">{headerRow}</BarContext>, frameHeader)
          : headerRow}

        <div className="col-span-2 grid grid-rows-(--grid-open)">
          <div className="min-h-0 overflow-hidden">
            <PullRequestDetailHeaderBody
              title={
                <PullRequestDetailTitleRow>
                  {seed ? (
                    <h1 className="truncate text-base font-semibold leading-snug">{seed.title}</h1>
                  ) : (
                    <GhostBar className="h-5 w-4/5 max-w-md" />
                  )}
                </PullRequestDetailTitleRow>
              }
              author={
                seed ? (
                  <PullRequestActorLabel actor={seed.author ?? null} tooltip={false} />
                ) : (
                  <span className="flex items-center gap-2">
                    <GhostBar className="size-4 rounded-full" />
                    <GhostBar className="h-3 w-14" />
                  </span>
                )
              }
              updated={
                seed ? (
                  <span>
                    <T context="followed by a relative time such as 5m ago or just now">
                      updated{" "}
                      <Var>
                        <RelativeTime timestamp={seed.updatedAt} />
                      </Var>
                    </T>
                  </span>
                ) : (
                  <GhostBar className="h-3 w-16" />
                )
              }
              checkout={
                checkout ? (
                  <PullRequestCopyableCode
                    key={checkout}
                    value={checkout}
                    target={{
                      target: `${terminology.singular} checkout command`,
                      unavailableMessage: msg(
                        "Clipboard API is unavailable while copying {term, select, mr {merge request} cr {change request} other {pull request}} checkout command.",
                        { term: changeRequestTermKind(terminology) },
                      ),
                      failureMessage: msg(
                        "Failed to copy {term, select, mr {merge request} cr {change request} other {pull request}} checkout command to the clipboard.",
                        { term: changeRequestTermKind(terminology) },
                      ),
                    }}
                    copyLabel={gt("Copy checkout command")}
                    copiedLabel={gt("Checkout command copied")}
                    className="ml-auto font-mono"
                    tooltipSide="bottom"
                    {...(onCheckoutError ? { onError: onCheckoutError } : {})}
                  />
                ) : null
              }
              base={
                <span className="inline-flex min-w-0 max-w-2/5 shrink-0 items-center gap-1">
                  {seed ? (
                    <code className="flex min-w-0">
                      <MiddleTruncate value={seed.baseBranch} />
                    </code>
                  ) : (
                    <GhostBar className="h-3 w-12" />
                  )}
                </span>
              }
              head={
                seed ? (
                  <PullRequestCopyableCode
                    key={seed.headBranch}
                    value={seed.headBranch}
                    target={{
                      target: "branch name",
                      unavailableMessage: msg(
                        "Clipboard API is unavailable while copying branch name.",
                      ),
                      failureMessage: msg("Failed to copy branch name to the clipboard."),
                    }}
                    copyLabel={gt(
                      "Copy {term, select, mr {merge request} cr {change request} other {pull request}} branch",
                      { term: changeRequestTermKind(terminology) },
                    )}
                    copiedLabel={gt("Branch name copied")}
                    className="min-w-0 font-mono"
                  />
                ) : (
                  <GhostBar className="h-3 w-32 flex-1" />
                )
              }
              files={
                changedFiles === null ? (
                  <GhostBar className="h-3 w-10" />
                ) : (
                  gt("{count, plural, one {{formatted} file} other {{formatted} files}}", {
                    count: changedFiles,
                    formatted: changedFiles.toLocaleString(),
                  })
                )
              }
              diffStat={
                seed ? (
                  <PullRequestDiffStat
                    additions={seed.additions ?? 0}
                    deletions={seed.deletions ?? 0}
                    className="shrink-0 font-mono text-meta"
                  />
                ) : (
                  <GhostBar className="h-3 w-20" />
                )
              }
            />
          </div>
        </div>

        <PullRequestDetailTabBar tabs={tabs} value={selectedTab} inert>
          {checksPresentation ? (
            <PullRequestChecksStatusLine
              className={checksPresentation.toneClassName}
              icon={<checksPresentation.Icon aria-hidden className="size-4" />}
              label={checksPresentation.label}
            />
          ) : (
            <PullRequestChecksStatusLine
              icon={<GhostBar className="my-px size-4 rounded-full" />}
              label={<GhostBar className="w-28" />}
            />
          )}
        </PullRequestDetailTabBar>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <section className="px-4 pt-2 pb-1">
          <div className="space-y-2">
            <div className="grid min-h-6 min-w-0 grid-cols-(--grid-lead) items-center gap-2 text-meta sm:min-h-6">
              <span className="flex w-24 items-center gap-2 text-ink-2">
                <UsersIcon aria-hidden className="size-4" />
                <T>Reviewers</T>
              </span>
              <span className="flex min-w-0 items-center gap-2 text-ink-1">
                <GhostBar className="h-3 w-10" />
                <Button
                  size="icon-xs"
                  variant="ghost"
                  disabled
                  aria-label={gt("Reviewers loading")}
                >
                  <UserPlusIcon aria-hidden className="size-4" />
                </Button>
              </span>
            </div>
            <div className="grid min-h-6 min-w-0 grid-cols-(--grid-lead) items-center gap-2 text-meta sm:min-h-6">
              <span className="flex w-24 items-center gap-2 text-ink-2">
                <TagIcon aria-hidden className="size-4" />
                <T>Labels</T>
              </span>
              <span className="flex min-w-0 flex-wrap items-center gap-1 text-ink-1">
                {entry?.labels ? (
                  entry.labels.length > 0 ? (
                    entry.labels.map((label) => (
                      <PullRequestLabelChip
                        key={label.name}
                        label={label}
                        size="default"
                        className="max-w-48"
                      />
                    ))
                  ) : (
                    <span className="text-ink-2">
                      <T context="no labels">None</T>
                    </span>
                  )
                ) : (
                  <>
                    <GhostBar className="h-4 w-24" />
                    <GhostBar className="h-4 w-20" />
                  </>
                )}
                <Button size="icon-xs" variant="ghost" disabled aria-label={gt("Labels loading")}>
                  <TagIcon aria-hidden className="size-4" />
                </Button>
              </span>
            </div>
          </div>
        </section>

        <section>
          <div className="sticky top-0 z-10 flex w-full items-center bg-(--pane-fill) pr-4">
            <div className="flex min-w-0 flex-1 items-center gap-2 px-4 py-2 text-left text-meta font-medium text-ink-2">
              <span>
                <T>Description</T>
              </span>
              <ChevronRightIcon aria-hidden className="size-4 rotate-90 text-ink-3" />
            </div>
          </div>
          <div className="space-y-2 px-4 pb-4">
            <GhostBar className="h-5 w-40" />
            <div className="space-y-2">
              <GhostBar className="h-4 w-full" />
              <GhostBar className="h-4 w-11/12" />
              <GhostBar className="h-4 w-4/5" />
              <GhostBar className="h-4 w-2/3" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export function PullRequestPeopleGhost({ rows = 4 }: { rows?: number }) {
  const gt = useGT();
  return (
    <div
      role="status"
      aria-label={gt("Loading people")}
      className="motion-safe:animate-skeleton space-y-1 p-1"
    >
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex h-6 items-center gap-2 rounded-row px-2">
          <GhostBar className="size-4 rounded-full" />
          <GhostBar className={META_WIDTHS[index % META_WIDTHS.length]} />
        </div>
      ))}
    </div>
  );
}

export function PullRequestTimelineGhost({ rows = 6 }: { rows?: number }) {
  const gt = useGT();
  return (
    <div
      role="status"
      aria-label={gt("Loading timeline")}
      className="motion-safe:animate-skeleton px-4 py-4"
    >
      <div className="relative ml-2 border-l border-border/70 pl-4">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="relative pb-4">
            <GhostBar className="absolute -left-6 top-1 size-2 rounded-full" />
            <GhostBar className={cn("h-4", TITLE_WIDTHS[index % TITLE_WIDTHS.length])} />
            <GhostBar className="mt-2 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PullRequestConversationGhost({
  rows = 3,
  terminology,
}: {
  rows?: number;
  terminology: ChangeRequestTerminology;
}) {
  const gt = useGT();
  return (
    <div
      role="status"
      aria-label={gt(
        "Loading {term, select, mr {merge request} cr {change request} other {pull request}} conversation",
        { term: changeRequestTermKind(terminology) },
      )}
      className="motion-safe:animate-skeleton space-y-2 py-2"
    >
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-start gap-2">
          <GhostBar className="size-5 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <GhostBar className={META_WIDTHS[index % META_WIDTHS.length]} />
            <GhostBar className="w-full" />
            <GhostBar className="w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
