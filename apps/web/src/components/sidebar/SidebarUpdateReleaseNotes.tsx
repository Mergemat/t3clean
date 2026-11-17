import type { DesktopBridge, DesktopUpdateState } from "@t3tools/contracts";
import { ExternalLinkIcon } from "lucide-react";

import {
  getDesktopUpdateReleaseHistoryUrl,
  getDesktopUpdateReleaseUrl,
} from "../desktopUpdate.logic";
import { formatRelativeTimeLabel } from "../../timestampFormat";
import { openDesktopUpdateReleaseNotes } from "../desktopUpdate.toast";

type DesktopUpdateShell = Pick<DesktopBridge, "openExternal">;

function keyReleaseNoteItems(items: ReadonlyArray<string>) {
  const occurrences = new Map<string, number>();
  return items.map((item) => {
    const occurrence = occurrences.get(item) ?? 0;
    occurrences.set(item, occurrence + 1);
    return { item, key: JSON.stringify([item, occurrence]) };
  });
}

/** Feed times read "3h ago"; build days from a prerelease version read "today" or "2d ago". */
function formatReleaseAge(releasedAt: string): string {
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(releasedAt);
  if (!day) return formatRelativeTimeLabel(releasedAt);
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const days = Math.round(
    (today - Date.UTC(Number(day[1]), Number(day[2]) - 1, Number(day[3]))) / 86_400_000,
  );
  return days <= 0 ? "today" : `${days}d ago`;
}

function ReleaseLink({
  children,
  releaseUrl,
  shell,
}: {
  readonly children: string;
  readonly releaseUrl: string;
  readonly shell: DesktopUpdateShell | undefined;
}) {
  return (
    <a
      className="mt-1 inline-flex items-center gap-1 rounded-row text-meta leading-5 text-ink-2 underline-offset-2 outline-none transition-colors hover:text-ink-1 hover:underline focus-visible:text-ink-1 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      href={releaseUrl}
      onClick={(event) => {
        event.preventDefault();
        void openDesktopUpdateReleaseNotes(shell, releaseUrl);
      }}
    >
      {children}
      <ExternalLinkIcon aria-hidden className="size-3 shrink-0" strokeWidth={2} />
    </a>
  );
}

export function SidebarUpdateReleaseNotes({
  shell,
  state,
  tooltip,
}: {
  readonly shell: DesktopUpdateShell | undefined;
  readonly state: DesktopUpdateState;
  readonly tooltip: string;
}) {
  if (state.releaseNotes.length === 0) {
    return <>{tooltip}</>;
  }
  const releasedAt = state.releaseNotes.find(
    (releaseNote) => releaseNote.version === state.availableVersion,
  )?.releasedAt;

  return (
    <div className="flex max-h-(--available-height) min-h-0 w-fit max-w-96 flex-col text-left text-pretty">
      <div className="shrink-0 px-1">
        {state.status === "available" ? (
          <div>
            <div className="whitespace-nowrap text-body leading-5 font-medium">
              Update ready to download
            </div>
            {state.availableVersion ? (
              <div className="text-meta leading-4 text-ink-2">
                {releasedAt
                  ? `${state.availableVersion} · ${formatReleaseAge(releasedAt)}`
                  : state.availableVersion}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="text-body leading-5 font-medium">{tooltip}</div>
        )}
      </div>
      <div className="min-h-0 max-h-112 overflow-y-auto px-1 pt-2 pb-1">
        {state.releaseNotes.map((releaseNote, index) => {
          const releaseUrl = getDesktopUpdateReleaseUrl(releaseNote.version);
          const omittedItemCount = Math.max(0, releaseNote.totalItems - releaseNote.items.length);
          const linkLabel =
            releaseNote.stats ??
            (omittedItemCount === 0
              ? "View release on GitHub"
              : `${omittedItemCount} more ${omittedItemCount === 1 ? "change" : "changes"} on GitHub`);

          const generated = releaseNote.stats !== undefined || releaseNote.intro !== undefined;
          return (
            <section className={index > 0 ? "mt-2" : undefined} key={releaseNote.version}>
              {generated ? (
                releaseNote.version !== state.availableVersion && (
                  <h3 className="mb-1 text-meta leading-4 font-medium text-ink-2">
                    {releaseNote.releasedAt
                      ? `${releaseNote.version} · ${formatReleaseAge(releaseNote.releasedAt)}`
                      : releaseNote.version}
                  </h3>
                )
              ) : (
                <h3 className="mb-2 text-ink-1 text-meta leading-4 font-semibold">
                  {index === 0 ? "What's changed" : `Changes in ${releaseNote.version}`}
                </h3>
              )}
              {releaseNote.intro ? (
                <p className="break-words text-meta leading-5 text-popover-foreground">
                  {releaseNote.intro}
                </p>
              ) : releaseNote.items.length > 0 ? (
                <ul className="space-y-2 pl-4 text-meta leading-5 text-popover-foreground/90">
                  {keyReleaseNoteItems(releaseNote.items).map(({ item, key }) => {
                    const highlight = /^\*\*([^*]+)\*\* (.+)$/.exec(item);
                    return (
                      <li className="list-disc break-words" key={key}>
                        {highlight ? (
                          <>
                            <strong>{highlight[1]}</strong> {highlight[2]}
                          </>
                        ) : (
                          item
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : null}
              {releaseNote.footer && (
                <p className="mt-2 text-meta leading-5 font-semibold">{releaseNote.footer}</p>
              )}
              {releaseUrl && (
                <ReleaseLink releaseUrl={releaseUrl} shell={shell}>
                  {linkLabel}
                </ReleaseLink>
              )}
            </section>
          );
        })}
        {state.omittedReleaseCount > 0 ? (
          <div className="mt-2">
            <ReleaseLink releaseUrl={getDesktopUpdateReleaseHistoryUrl()} shell={shell}>
              {`${state.omittedReleaseCount} older ${state.omittedReleaseCount === 1 ? "release" : "releases"} on GitHub`}
            </ReleaseLink>
          </div>
        ) : null}
      </div>
    </div>
  );
}
