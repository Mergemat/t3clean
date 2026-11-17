import { useAtomCommand } from "~/state/use-atom-command";
import type {
  EnvironmentId,
  PullRequestReaction,
  PullRequestReactionContent,
  PullRequestRef,
} from "@t3tools/contracts";
import { SmilePlusIcon } from "lucide-react";
import { useState } from "react";

import { cn } from "~/lib/utils";
import { pullRequestEnvironment } from "~/state/pullRequests";

import { Popover, PopoverPopup, PopoverTrigger } from "../ui/popover";
import { toastManager } from "../ui/toast";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../ui/tooltip";
import {
  applyPendingPullRequestReactions,
  PULL_REQUEST_REACTION_ORDER,
  pullRequestReactionEmoji,
  pullRequestReactionName,
  pullRequestReactionTooltip,
  pullRequestReactionsSignature,
} from "@t3tools/client-runtime/pull-request-reactions";

const PILL_CLASS =
  "inline-flex h-6 shrink-0 items-center gap-1 rounded-row border px-2 text-meta outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring";

const EMPTY_PENDING: ReadonlyMap<PullRequestReactionContent, boolean> = new Map();

export function PullRequestReactionBar({
  reactions,
  canReact,
  subjectId,
  environmentId,
  reference,
  onRefresh,
  className,
}: {
  readonly reactions: ReadonlyArray<PullRequestReaction>;
  readonly canReact: boolean;
  /** Omit to react to the pull request description. */
  readonly subjectId?: string | undefined;
  readonly environmentId: EnvironmentId;
  readonly reference: PullRequestRef;
  readonly onRefresh: () => void;
  readonly className?: string | undefined;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pending, setPending] = useState<{
    readonly signature: string;
    readonly values: ReadonlyMap<PullRequestReactionContent, boolean>;
  }>({ signature: "", values: EMPTY_PENDING });
  const setReaction = useAtomCommand(pullRequestEnvironment.setReaction, {
    reportFailure: false,
  });

  const signature = pullRequestReactionsSignature(reactions);
  const values = pending.signature === signature ? pending.values : EMPTY_PENDING;
  const shown = applyPendingPullRequestReactions(reactions, values);

  const toggle = async (content: PullRequestReactionContent, reacted: boolean) => {
    setPending({ signature, values: new Map([...values, [content, reacted]]) });
    const result = await setReaction({
      environmentId,
      input: {
        ...reference,
        ...(subjectId === undefined ? {} : { subjectId }),
        content,
        reacted,
      },
    });
    if (result._tag === "Failure") {
      setPending((current) => {
        const next = new Map(current.values);
        next.delete(content);
        return { signature: current.signature, values: next };
      });
      toastManager.add({ type: "error", title: "The reaction could not be saved" });
      return;
    }
    onRefresh();
  };

  if (shown.length === 0 && !canReact) return null;

  return (
    <div className={cn("flex min-w-0 max-w-full flex-wrap items-center gap-1", className)}>
      {shown.map((reaction) => (
        <Tooltip key={reaction.content}>
          <TooltipTrigger
            render={
              <button
                type="button"
                aria-pressed={reaction.viewerHasReacted}
                aria-label={`${pullRequestReactionName(reaction.content)}, ${reaction.count}`}
                disabled={!canReact}
                className={cn(
                  PILL_CLASS,
                  reaction.viewerHasReacted
                    ? "border-primary/60 bg-primary/10 text-ink-1"
                    : "border-border/70 bg-muted/40 text-ink-2",
                  canReact ? "hover:border-primary/60" : "cursor-default",
                )}
                onClick={() => void toggle(reaction.content, !reaction.viewerHasReacted)}
              />
            }
          >
            <span aria-hidden>{pullRequestReactionEmoji(reaction.content)}</span>
            <span className="tabular-nums">{reaction.count}</span>
          </TooltipTrigger>
          <TooltipPopup side="top">{pullRequestReactionTooltip(reaction)}</TooltipPopup>
        </Tooltip>
      ))}

      {canReact ? (
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger
            render={
              <button
                type="button"
                aria-label="Add a reaction"
                className={cn(
                  PILL_CLASS,
                  "border-border/70 px-2 text-ink-2 hover:border-primary/60 hover:text-ink-1",
                )}
              />
            }
          >
            <SmilePlusIcon aria-hidden className="size-4" />
          </PopoverTrigger>
          <PopoverPopup align="start" side="top" padding="compact">
            <div className="flex items-center">
              {PULL_REQUEST_REACTION_ORDER.map((content) => {
                const reacted =
                  shown.find((reaction) => reaction.content === content)?.viewerHasReacted ?? false;
                return (
                  <button
                    key={content}
                    type="button"
                    aria-pressed={reacted}
                    aria-label={pullRequestReactionName(content)}
                    className={cn(
                      "flex size-6 items-center justify-center rounded-row text-base outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                      reacted && "bg-primary/10",
                    )}
                    onClick={() => {
                      setPickerOpen(false);
                      void toggle(content, !reacted);
                    }}
                  >
                    <span aria-hidden>{pullRequestReactionEmoji(content)}</span>
                  </button>
                );
              })}
            </div>
          </PopoverPopup>
        </Popover>
      ) : null}
    </div>
  );
}
