import { T, useGT, useMessages } from "gt-react";
import { useAtomValue } from "@effect/atom-react";
import {
  isTerminalSubagentStatus,
  workflowMemberModelSelection,
  workflowOpeningHeadline,
  type RuntimeSubagent,
  type WorkflowOpening,
} from "@t3tools/client-runtime/state/subagentRuntime";
import type {
  EnvironmentId,
  ProviderDriverKind,
  ProviderInstanceId,
  ServerProvider,
} from "@t3tools/contracts";
import { ChevronRightIcon, WorkflowIcon } from "lucide-react";
import { useState } from "react";

import { cn } from "../../lib/utils";
import { providersIgnoringCheckedAtAtom } from "../../state/server";
import ChatMarkdown from "../ChatMarkdown";
import { ThreadHoverCardPopup } from "../ThreadHoverCard";
import { Button } from "../ui/button";
import { Tooltip, TooltipTrigger } from "../ui/tooltip";
import { AgentElapsed } from "./AgentElapsed";
import { findRevealRef } from "./markdownFindContext";
import { useTallEnoughToFold } from "./useTallEnoughToFold";
import { SubagentTooltipContent } from "./SubagentTooltipContent";
import { EnvironmentSubagentAvatar } from "./V2LifecycleRow";

const FOLDED_SCRIPT_MASK = "linear-gradient(to bottom, black calc(100% - 1.75rem), transparent)";

function scriptMarkdown(script: string) {
  const longestRun = Math.max(2, ...(script.match(/`+/g) ?? []).map((run) => run.length));
  const fence = "`".repeat(longestRun + 1);
  return `${fence}javascript\n${script.trimEnd()}\n${fence}`;
}

export function WorkflowOpeningBlock(props: {
  readonly opening: WorkflowOpening;
  readonly environmentId: EnvironmentId;
  readonly onOpenThread: (threadId: string) => void;
}) {
  const gt = useGT();
  const { opening } = props;
  const m = useMessages();
  const providers = useAtomValue(providersIgnoringCheckedAtAtom(props.environmentId));
  const headline = workflowOpeningHeadline(opening, m);
  const phases = opening.group?.phases.filter((phase) => phase.members.length > 0) ?? [];
  const memberRow = (member: RuntimeSubagent) =>
    opening.providerInstanceId === null ? null : (
      <WorkflowMemberRow
        key={member.id}
        member={member}
        environmentId={props.environmentId}
        providerInstanceId={opening.providerInstanceId}
        providers={providers}
        driver={opening.driver ?? undefined}
        onOpenThread={props.onOpenThread}
      />
    );
  return (
    <section
      aria-label={gt("Workflow started: {title}", { title: headline.title })}
      className="flex min-w-0 flex-col gap-2 px-1 py-1"
      data-workflow-opening
    >
      <header className="flex min-w-0 items-start gap-2">
        <WorkflowIcon aria-hidden className="h-lh w-4 shrink-0 text-ink-2" />
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-meta font-medium text-ink-2">
            <T>Workflow started</T>
          </p>
          <h3 className="truncate text-body font-medium text-ink-1" data-thread-find-text="true">
            {headline.title}
          </h3>
          {headline.description ? (
            <p className="text-meta text-ink-2" data-thread-find-text="true">
              {headline.description}
            </p>
          ) : null}
        </div>
        {headline.agents ? (
          <span aria-live="polite" className="shrink-0 text-meta tabular-nums text-ink-2">
            {headline.agents}
          </span>
        ) : null}
      </header>
      {phases.map((phase) => (
        <section key={phase.index} aria-label={gt("{title} phase", { title: phase.title })}>
          <h4 className="flex items-baseline gap-2 px-2 pb-1 text-meta font-medium text-ink-2">
            <span className="min-w-0 truncate" data-thread-find-text="true">
              {phase.title}
            </span>
            <span className="shrink-0 font-normal tabular-nums">
              {phase.settledCount}/{phase.members.length}
            </span>
          </h4>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">{phase.members.map(memberRow)}</ul>
        </section>
      ))}
      {opening.group && opening.group.unphasedMembers.length > 0 ? (
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {opening.group.unphasedMembers.map(memberRow)}
        </ul>
      ) : null}
      <WorkflowScript script={opening.script} />
    </section>
  );
}

function WorkflowMemberRow(props: {
  readonly member: RuntimeSubagent;
  readonly environmentId: EnvironmentId;
  readonly providerInstanceId: ProviderInstanceId;
  readonly providers: ReadonlyArray<ServerProvider>;
  readonly driver: ProviderDriverKind | undefined;
  readonly onOpenThread: (threadId: string) => void;
}) {
  const gt = useGT();
  const { member } = props;
  const threadId = member.childThreadId;
  const failed = member.status === "failed";
  const detail = (
    isTerminalSubagentStatus(member.status)
      ? (member.error ?? member.result ?? member.progress)
      : member.progress
  )
    ?.replace(/`/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const className =
    "group/subagent flex w-full min-w-0 items-center gap-2 rounded-row px-2 py-2 text-left";
  return (
    <li>
      <Tooltip>
        <TooltipTrigger
          delay={200}
          render={
            threadId === null ? (
              <div aria-description={member.status} className={className} />
            ) : (
              <button
                type="button"
                aria-label={gt("Open {title}", { title: member.title })}
                aria-description={member.status}
                onClick={() => props.onOpenThread(threadId)}
                className={cn(
                  className,
                  "cursor-pointer transition-colors hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/70",
                )}
              />
            )
          }
        >
          <EnvironmentSubagentAvatar
            environmentId={props.environmentId}
            providerInstanceId={props.providerInstanceId}
            driver={props.driver}
            status={member.status}
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-meta font-medium text-ink-1">{member.title}</span>
            {detail ? (
              <span
                className={cn(
                  "block truncate text-meta leading-relaxed",
                  failed ? "text-destructive" : "text-ink-2",
                )}
              >
                {detail}
              </span>
            ) : null}
          </span>
          {member.startedAt ? (
            <span className="shrink-0 text-meta text-ink-2 tabular-nums">
              <AgentElapsed agent={member} />
            </span>
          ) : null}
          {threadId !== null ? (
            <ChevronRightIcon
              aria-hidden
              className="size-4 shrink-0 text-ink-3 transition-colors group-hover/subagent:text-ink-1"
            />
          ) : null}
        </TooltipTrigger>
        <ThreadHoverCardPopup>
          <SubagentTooltipContent
            title={member.title}
            model={member.model}
            providerInstanceId={props.providerInstanceId}
            origin="provider_native"
            modelSelection={workflowMemberModelSelection(member, props.providerInstanceId)}
            provider={props.providers.find(
              (provider) => provider.instanceId === props.providerInstanceId,
            )}
            providers={props.providers}
            driver={props.driver}
            elapsed={<AgentElapsed agent={member} />}
            status={member.status}
            result={member.result ?? member.error}
            progress={member.progress}
          />
        </ThreadHoverCardPopup>
      </Tooltip>
    </li>
  );
}

function WorkflowScript(props: { readonly script: string }) {
  const gt = useGT();
  const [expanded, setExpanded] = useState(false);
  const revealRef = findRevealRef(() => setExpanded(true));
  const { ref: contentRef, tallEnough: canFold } = useTallEnoughToFold();
  const folded = canFold && !expanded;
  return (
    <div>
      <div
        ref={revealRef}
        className={cn("relative", folded && "max-h-44 overflow-hidden")}
        data-thread-find-text="true"
        data-thread-find-fold={folded ? "" : undefined}
        style={
          folded
            ? { WebkitMaskImage: FOLDED_SCRIPT_MASK, maskImage: FOLDED_SCRIPT_MASK }
            : undefined
        }
      >
        <div ref={contentRef}>
          <ChatMarkdown text={scriptMarkdown(props.script)} cwd={undefined} />
        </div>
      </div>
      {canFold ? (
        <div className="-ms-1">
          <Button
            type="button"
            size="xs"
            variant="ghost-muted"
            aria-expanded={expanded}
            data-scroll-anchor-ignore
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? gt("Show less") : gt("Show full script")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
