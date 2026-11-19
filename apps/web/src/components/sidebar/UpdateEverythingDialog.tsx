import { useAtomValue } from "@effect/atom-react";
import { EnvironmentId } from "@t3tools/contracts";
import { Atom } from "effect/reactivity";
import { msg, T, useGT, useMessages } from "gt-react";
import { Fragment, type RefObject, useRef } from "react";

import { environmentThreadShells } from "~/state/threads";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { MiddleTruncate } from "../ui/middle-truncate";
import { ScrollArea } from "../ui/scroll-area";
import type { RestartingMachine, UpdateEverythingRow } from "./updateEverything.logic";

const isRunning = (status: string) =>
  status === "preparing" || status === "starting" || status === "running";

const runningThreadCountAtom = Atom.family((environmentIds: string) =>
  Atom.make((get) =>
    environmentIds
      .split("\n")
      .filter((id) => id !== "")
      .reduce(
        (count, id) =>
          count +
          get(environmentThreadShells.environmentThreadsAtom(EnvironmentId.make(id))).filter(
            (thread) => isRunning(thread.status),
          ).length,
        0,
      ),
  ).pipe(Atom.withLabel(`update-everything-running-threads:${environmentIds}`)),
);

interface UpdateEverythingDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly version: string | null;
  readonly rows: ReadonlyArray<UpdateEverythingRow>;
  readonly restarts: ReadonlyArray<RestartingMachine>;
  readonly onConfirm: () => void;
  /** Overrides the "Update N machines?" title, for an update-track switch. */
  readonly title?: string;
  readonly confirmLabel?: string;
  readonly notes?: ReadonlyArray<string>;
  /** Shown in place of running-thread counts; disables the confirm button. */
  readonly disabledReason?: string | null;
  /** The confirmed work is starting; it cannot be cancelled from here. */
  readonly busy?: boolean;
  /** Machines are still looking for provider updates, so more rows can appear. */
  readonly checking?: boolean;
}

type UpdateEverythingDialogContentProps = Omit<
  UpdateEverythingDialogProps,
  "open" | "onOpenChange"
> & {
  readonly cancelRef: RefObject<HTMLButtonElement | null>;
};

export function UpdateEverythingDialog({
  open,
  onOpenChange,
  ...content
}: UpdateEverythingDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {/* Refocusing the trigger after a pointer close shows its focus ring and opens its tooltip. */}
      <AlertDialogPopup
        size="md"
        initialFocus={cancelRef}
        finalFocus={(closeType) => closeType === "keyboard"}
      >
        <UpdateEverythingDialogContent {...content} cancelRef={cancelRef} />
      </AlertDialogPopup>
    </AlertDialog>
  );
}

const APP_LABELS = {
  "this-app": msg("This app"),
  server: msg("Server"),
  "desktop-app": msg("Desktop app"),
} as const;

function UpdateEverythingDialogContent({
  version,
  rows,
  restarts,
  onConfirm,
  cancelRef,
  title,
  confirmLabel,
  notes = [],
  disabledReason = null,
  busy = false,
  checking = false,
}: UpdateEverythingDialogContentProps) {
  const gt = useGT();
  const m = useMessages();
  const stopped = useAtomValue(
    runningThreadCountAtom(
      restarts
        .filter((machine) => !machine.continuesThreads)
        .map((machine) => machine.environmentId)
        .join("\n"),
    ),
  );
  const continuing = useAtomValue(
    runningThreadCountAtom(
      restarts
        .filter((machine) => machine.continuesThreads)
        .map((machine) => machine.environmentId)
        .join("\n"),
    ),
  );
  const running = stopped + continuing;
  const restarting = new Set(restarts.map((machine) => machine.environmentId));
  const updating = rows.filter((row) => row.app !== null || row.providers.length > 0);
  const skipped = rows.filter((row) => row.skipped !== null);

  return (
    <>
      <AlertDialogHeader className="shrink-0">
        <AlertDialogTitle>
          {title ??
            gt("{count, plural, one {Update {count} machine?} other {Update {count} machines?}}", {
              count: updating.length,
            })}
        </AlertDialogTitle>
        {/* Only what the rows don't say: which T3 Code version, and whether more may come. */}
        {version !== null || checking ? (
          <AlertDialogDescription>
            {version !== null ? (
              <>
                T3 Code <span className="font-mono text-meta">{version}</span>
              </>
            ) : null}
            {version !== null && checking ? " · " : null}
            {checking ? gt("Checking for more…") : null}
          </AlertDialogDescription>
        ) : null}
      </AlertDialogHeader>
      <ScrollArea scrollFade>
        {/* A dialog body: rows one step in, their text on the title's edge (DESIGN.md 12). */}
        <div className="flex flex-col gap-1 px-2 pb-2">
          {notes.map((note) => (
            <p key={note} className="px-2 text-ink-2 text-meta">
              {note}
            </p>
          ))}
          {/* Rows to the eye, a table to a screen reader: each value keeps its column. */}
          <div role="table" aria-label={gt("Machines to update")} className="flex flex-col gap-1">
            <div role="row" className="sr-only">
              <span role="columnheader">
                <T>Machine</T>
              </span>
              <span role="columnheader">T3 Code</span>
              <span role="columnheader">
                <T>Providers</T>
              </span>
              <span role="columnheader">
                <T>Running threads</T>
              </span>
            </div>
            {updating.map((row) => (
              <div
                key={row.environmentId ?? "this-app"}
                role="row"
                className="flex min-h-8 items-center gap-6 rounded-row px-2 text-body"
              >
                <span role="cell" className="min-w-0 flex-1">
                  <span className="sr-only">{row.label}</span>
                  <MiddleTruncate value={row.label} aria-hidden />
                </span>
                <span className="flex min-w-0 shrink-0 flex-wrap items-baseline justify-end gap-x-2 text-right text-ink-2">
                  <span role="cell" className="whitespace-nowrap empty:hidden">
                    {row.app !== null ? m(APP_LABELS[row.app]) : null}
                    {row.app === "this-app"
                      ? gt(", restarts last", { $context: "follows 'This app'" })
                      : null}
                  </span>
                  {/* Provider names wrap between names, never inside one. */}
                  <span role="cell" className="empty:hidden">
                    {row.providers.map((provider, index) => (
                      <Fragment key={provider}>
                        <span className="whitespace-nowrap">{provider}</span>
                        {index < row.providers.length - 1 ? ", " : null}
                      </Fragment>
                    ))}
                  </span>
                  <span role="cell" className="empty:hidden">
                    {row.environmentId !== null && restarting.has(row.environmentId) ? (
                      <RunningThreads environmentId={row.environmentId} />
                    ) : null}
                  </span>
                </span>
              </div>
            ))}
          </div>
          {skipped.length > 0 ? (
            <>
              <div className="flex h-8 items-end px-2 pb-1 text-meta font-medium text-ink-2">
                <T>Skipped</T>
              </div>
              {skipped.map((row) => (
                <div
                  key={row.environmentId ?? "this-app"}
                  className="flex min-h-8 items-center gap-6 rounded-row px-2 text-body text-ink-2"
                >
                  <span className="min-w-0 flex-1">
                    <MiddleTruncate value={row.label} />
                  </span>
                  <span className="wrap-anywhere text-right">{row.skipped}</span>
                </div>
              ))}
            </>
          ) : null}
        </div>
      </ScrollArea>
      <AlertDialogFooter>
        {disabledReason !== null ? (
          <p className="self-center text-body max-sm:order-1 max-sm:text-center sm:mr-auto">
            {disabledReason}
          </p>
        ) : running > 0 ? (
          <p className="self-center text-ink-2 text-body max-sm:order-1 max-sm:text-center sm:mr-auto">
            {stopped === 0
              ? gt(
                  "{count, plural, one {{count} running thread will be interrupted and can resume after the restart.} other {{count} running threads will be interrupted and can resume after the restart.}}",
                  { count: running },
                )
              : continuing === 0
                ? gt(
                    "{count, plural, one {{count} running thread will be interrupted.} other {{count} running threads will be interrupted.}}",
                    { count: running },
                  )
                : `${gt(
                    "{count, plural, one {{count} running thread will be interrupted.} other {{count} running threads will be interrupted.}}",
                    { count: running },
                  )} ${gt(
                    "{count, plural, one {{count} can resume after the restart.} other {{count} can resume after the restart.}}",
                    { count: continuing },
                  )}`}
          </p>
        ) : null}
        <AlertDialogClose ref={cancelRef} render={<Button variant="outline" disabled={busy} />}>
          <T>Cancel</T>
        </AlertDialogClose>
        <Button disabled={disabledReason !== null || busy} onClick={onConfirm}>
          {confirmLabel ?? gt("Update", { $context: "verb, confirms the update" })}
        </Button>
      </AlertDialogFooter>
    </>
  );
}

function RunningThreads({ environmentId }: { readonly environmentId: EnvironmentId }) {
  const count = useAtomValue(runningThreadCountAtom(environmentId));
  const gt = useGT();
  return count > 0 ? (
    <span className="whitespace-nowrap text-warning">
      {gt("{count, plural, one {{count} running} other {{count} running}}", { count })}
    </span>
  ) : null;
}
