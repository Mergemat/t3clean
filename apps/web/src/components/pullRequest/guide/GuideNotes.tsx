import type { PullRequestReviewGuideNote } from "@t3tools/contracts";

import { cn } from "~/lib/utils";

import { GuideProse } from "./GuideProse";

export function GuideNoteMarker({ marker }: { marker: string }) {
  return (
    <span
      aria-hidden
      className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-info/16 font-medium text-meta text-info-foreground tabular-nums"
    >
      {marker}
    </span>
  );
}

export function GuideNotes({
  notes,
  className,
}: {
  notes: ReadonlyArray<{ readonly marker: string; readonly note: PullRequestReviewGuideNote }>;
  className?: string;
}) {
  if (notes.length === 0) return null;
  return (
    <section className={cn("flex min-w-0 flex-col gap-2", className)}>
      <h4 className="flex items-baseline justify-between gap-2 text-meta font-medium text-ink-1">
        Notes on this stop
        <span className="font-normal text-ink-2 tabular-nums">
          {notes.length === 1 ? "1 note" : `${notes.length} notes`}
        </span>
      </h4>
      <ol className="flex flex-col gap-2">
        {notes.map(({ marker, note }) => (
          <li key={marker} className="flex min-w-0 gap-2">
            <GuideNoteMarker marker={marker} />
            <div className="flex min-w-0 flex-col">
              <p className="flex flex-wrap items-baseline gap-x-2 text-meta">
                <span className="font-medium text-ink-1">{note.title}</span>
                <span className="truncate font-mono text-meta text-ink-2">
                  {note.path.split("/").at(-1)}:{note.line}
                </span>
              </p>
              {note.body.trim() !== "" ? (
                <div className="text-meta text-ink-2">
                  <GuideProse text={note.body} />
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
