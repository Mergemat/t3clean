import { useAtomValue } from "@effect/atom-react";
import { AuthOrchestrationOperateScope, type ScopedThreadRef } from "@t3tools/contracts";
import type { ChildThreadApproval } from "@t3tools/client-runtime/state/thread-requests";
import { fullAccessOverrideExplanation } from "@t3tools/client-runtime/state/thread-requests";
import {
  isAtomCommandInterrupted,
  squashAtomCommandFailure,
} from "@t3tools/client-runtime/state/runtime";
import { ShieldAlertIcon } from "lucide-react";
import { useState } from "react";
import { useEnvironmentScope } from "../../state/session";
import { childThreadApprovalsAtom, threadEnvironment } from "../../state/threads";
import { useAtomCommand } from "../../state/use-atom-command";
import { ComposerBanner } from "./ComposerBanner";
import { ComposerPendingApprovalActions } from "./ComposerPendingApprovalActions";

function ChildApproval({ entry }: { entry: ChildThreadApproval }) {
  const canRespond = useEnvironmentScope(entry.thread.environmentId, AuthOrchestrationOperateScope);
  const respond = useAtomCommand(threadEnvironment.respondToApproval, { reportFailure: false });
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { approval } = entry;
  return (
    <section aria-label={`Approval from ${entry.title}`} className="text-body">
      <ComposerBanner.Row>
        <ComposerBanner.Icon className="text-warning [&>svg]:size-4">
          <ShieldAlertIcon />
        </ComposerBanner.Icon>
        <ComposerBanner.Content>Approval needed from {entry.title}</ComposerBanner.Content>
      </ComposerBanner.Row>
      <ComposerBanner.Body className="pe-2 pb-2">
        <pre className="max-h-40 overflow-auto rounded-row bg-tint-1 px-4 py-2 font-mono text-meta whitespace-pre-wrap break-words">
          {approval.detail || approval.requestKind}
        </pre>
        {approval.appName ? <p className="mt-2 text-ink-2">{approval.appName}</p> : null}
        {approval.responseCapability !== "live" ? (
          <p className="mt-2 text-warning">
            Provider process is gone. Interrupt or restart the child thread to respond.
          </p>
        ) : null}
        {approval.reason ? <p className="mt-2 text-ink-2">{approval.reason}</p> : null}
        {approval.fullAccessOverride ? (
          <p className="mt-2 text-ink-2">
            {fullAccessOverrideExplanation(approval.fullAccessOverride)}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-2">
          <ComposerPendingApprovalActions
            presentation="inline"
            requestId={approval.requestId}
            isResponding={responding}
            canRespond={approval.responseCapability === "live"}
            disabled={!canRespond}
            options={approval.options}
            onRespondToApproval={async (requestId, decision) => {
              if (!canRespond || responding) return;
              setResponding(true);
              setError(null);
              const result = await respond({
                environmentId: entry.thread.environmentId,
                input: { threadId: entry.thread.threadId, requestId, decision },
              });
              if (result._tag === "Failure" && !isAtomCommandInterrupted(result)) {
                const failure = squashAtomCommandFailure(result);
                setError(
                  failure instanceof Error
                    ? failure.message
                    : "Failed to submit approval decision.",
                );
              }
              setResponding(false);
              return result;
            }}
          />
        </div>
        {error !== null ? (
          <p role="alert" className="mt-2 text-destructive">
            {error}
          </p>
        ) : null}
      </ComposerBanner.Body>
    </section>
  );
}

export function ChildThreadApprovals({ threadRef }: { threadRef: ScopedThreadRef | null }) {
  const approvals = useAtomValue(childThreadApprovalsAtom(threadRef));
  if (approvals.length === 0) return null;
  return (
    // A drawer of the composer below (see Height): it stands on the composer's top edge, one
    // corner in.
    <ComposerBanner.Root className="mx-(--radius-box) flex max-h-80 flex-col gap-2 overflow-auto">
      {approvals.map((entry) => (
        <ChildApproval
          key={JSON.stringify([
            entry.thread.environmentId,
            entry.thread.threadId,
            entry.approval.requestId,
          ])}
          entry={entry}
        />
      ))}
    </ComposerBanner.Root>
  );
}
