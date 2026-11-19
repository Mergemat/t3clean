import { sourceControlClients } from "@t3tools/client-runtime/source-control-clients";
import { T, useGT } from "gt-react";
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react";
import type { MouseEvent as ReactMouseEvent } from "react";

import { cn } from "~/lib/utils";
import { readLocalApi } from "~/localApi";
import { Button } from "../ui/button";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../ui/tooltip";
import { openOnHostLabel, showPullRequestLinkContextMenu } from "./pullRequestLinkContextMenu";

import { changeRequestTermKind } from "./changeRequestTerm";

interface CrumbsPullRequest {
  readonly url: string;
  readonly provider: string;
  readonly number: number;
  readonly repository: string;
  readonly title: string;
}

const openNumberContextMenu = (event: ReactMouseEvent, detail: CrumbsPullRequest): void => {
  event.preventDefault();
  event.stopPropagation();
  void showPullRequestLinkContextMenu({
    url: detail.url,
    openLabel: openOnHostLabel(sourceControlClients.get(detail.provider)),
    position: { x: event.clientX, y: event.clientY },
  });
};

const ROW_CLASS_NAME =
  "col-start-1 row-start-1 flex min-w-0 items-center gap-1 text-body text-ink-2 transition ease-out motion-reduce:transform-none motion-reduce:transition-none sm:text-meta";

function BackButton({ onBack, focusable }: { onBack: () => void; focusable: boolean }) {
  const gt = useGT();
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            size="icon-xs"
            variant="ghost-muted"
            {...(focusable ? {} : { tabIndex: -1 })}
            onClick={onBack}
            className="-ml-2"
            aria-label={gt("Back to this thread's pull requests")}
          >
            <ArrowLeftIcon aria-hidden className="size-4" />
          </Button>
        }
      />
      <TooltipPopup side="top">
        <T>Back to pull requests</T>
      </TooltipPopup>
    </Tooltip>
  );
}

function NumberLink({
  detail,
  toneClassName,
  openOnHostText,
  focusable,
}: {
  detail: CrumbsPullRequest;
  toneClassName: string;
  openOnHostText: string;
  focusable: boolean;
}) {
  const gt = useGT();
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            {...(focusable ? {} : { tabIndex: -1 })}
            onClick={() => void readLocalApi()?.shell.openExternal(detail.url)}
            onAuxClick={(event) => {
              if (event.button === 1) void readLocalApi()?.shell.openExternal(detail.url);
            }}
            onContextMenu={(event) => openNumberContextMenu(event, detail)}
            className={cn(
              "inline-flex shrink-0 cursor-pointer items-center font-medium underline-offset-2 hover:underline",
              toneClassName,
            )}
            aria-label={gt(
              "Open {term, select, mr {merge request} cr {change request} other {pull request}} #{number} on host",
              {
                term: changeRequestTermKind(
                  sourceControlClients.get(detail.provider).changeRequest,
                ),
                number: detail.number,
              },
            )}
          >
            #{detail.number}
            <ExternalLinkIcon aria-hidden className="size-3" />
          </button>
        }
      />
      <TooltipPopup side="top">{openOnHostText}</TooltipPopup>
    </Tooltip>
  );
}

/**
 * The repository and number above the title, swapped for the number and title once the reader has
 * scrolled the title away.
 */
export function PullRequestDetailCrumbs({
  detail,
  toneClassName,
  condensed,
  repositoryUrl,
  openOnHostText,
  onBack,
  frame = false,
}: {
  detail: CrumbsPullRequest | null;
  toneClassName: string | null;
  condensed: boolean;
  repositoryUrl: string | null;
  openOnHostText: string;
  onBack: (() => void) | undefined;
  /** In the frame header they read as its breadcrumb: its size and spacing, its inset. */
  frame?: boolean;
}) {
  const gt = useGT();
  const ready = detail !== null && toneClassName !== null;
  return (
    <div className={cn("grid h-6 min-w-0 items-center overflow-hidden", !frame && "pl-4")}>
      <div
        aria-hidden={condensed}
        inert={condensed}
        className={cn(
          ROW_CLASS_NAME,
          frame && "gap-2 sm:text-body",
          condensed
            ? "pointer-events-none -translate-y-1 opacity-0 duration-100"
            : "translate-y-0 opacity-100 delay-50 duration-150",
        )}
      >
        {ready ? (
          <>
            {onBack ? <BackButton onBack={onBack} focusable /> : null}
            <Tooltip>
              <TooltipTrigger
                render={
                  repositoryUrl ? (
                    <button
                      type="button"
                      onClick={() => void readLocalApi()?.shell.openExternal(repositoryUrl)}
                      className="min-w-0 cursor-pointer truncate text-left font-medium text-ink-2 underline-offset-2 hover:text-ink-1 hover:underline"
                    >
                      {detail.repository}
                    </button>
                  ) : (
                    <span className="min-w-0 truncate font-medium text-ink-2">
                      {detail.repository}
                    </span>
                  )
                }
              />
              <TooltipPopup side="top">
                {repositoryUrl
                  ? gt("Open {repository} repository", { repository: detail.repository })
                  : detail.repository}
              </TooltipPopup>
            </Tooltip>
            <NumberLink
              detail={detail}
              toneClassName={toneClassName}
              openOnHostText={openOnHostText}
              focusable
            />
          </>
        ) : null}
      </div>
      <div
        aria-hidden={!condensed}
        inert={!condensed}
        className={cn(
          ROW_CLASS_NAME,
          frame && "gap-2 sm:text-body",
          condensed
            ? "translate-y-0 opacity-100 delay-50 duration-150"
            : "pointer-events-none translate-y-1 opacity-0 duration-100",
        )}
      >
        {ready ? (
          <>
            {onBack ? <BackButton onBack={onBack} focusable={condensed} /> : null}
            <NumberLink
              detail={detail}
              toneClassName={toneClassName}
              openOnHostText={openOnHostText}
              focusable={condensed}
            />
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className="min-w-0 truncate font-medium text-ink-1">{detail.title}</span>
                }
              />
              <TooltipPopup side="top">{detail.title}</TooltipPopup>
            </Tooltip>
          </>
        ) : null}
      </div>
    </div>
  );
}
