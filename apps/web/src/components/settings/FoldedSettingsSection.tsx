import { SettingsGroup } from "./SettingsGroup";
import { ChevronRightIcon } from "lucide-react";
import { type ReactNode, useState } from "react";

import { cn } from "~/lib/utils";
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "../ui/collapsible";
import { useSettingsSearchTarget, useSettingsSearchTargetId } from "./settingsLayout";

/** A section label that opens: the label's type and place, its chevron after it. Every settings
 *  fold uses it, so folded rows read as one more section. */
export function SettingsFoldTrigger({ children }: { readonly children: ReactNode }) {
  return (
    <CollapsibleTrigger className="group/fold flex min-h-6 items-center gap-1 rounded-chip text-meta font-medium text-ink-2 outline-none hover:text-ink-1 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
      {children}
      <ChevronRightIcon
        aria-hidden
        className="size-3 shrink-0 transition-transform duration-150 group-data-panel-open/fold:rotate-90 motion-reduce:transition-none"
      />
    </CollapsibleTrigger>
  );
}

export function FoldedSettingsSection({
  id,
  title,
  summary,
  control,
  headerPlacement = "inside",
  collapsedContent,
  children,
}: {
  readonly id: string;
  readonly title: ReactNode;
  readonly summary?: string | null;
  readonly control?: ReactNode;
  readonly headerPlacement?: "inside" | "outside";
  /** Shown under the header only while folded. */
  readonly collapsedContent?: ReactNode;
  readonly children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const searchTargetId = useSettingsSearchTargetId();
  const targetRef = useSettingsSearchTarget<HTMLElement>(id);
  // A search jump lands inside the fold, so open it before the scroll runs.
  const [openedForTarget, setOpenedForTarget] = useState<string | null>(null);
  if (searchTargetId === id && openedForTarget !== id) {
    setOpenedForTarget(id);
    if (!open) setOpen(true);
  }

  if (headerPlacement === "outside") {
    return (
      <section id={id} ref={targetRef} tabIndex={-1} className="outline-none">
        <Collapsible open={open} onOpenChange={setOpen}>
          <div className="flex flex-col gap-6">
            {/* A section label that opens: same place and type as SettingsSection's. */}
            <div
              data-settings-scroll-target
              className="flex min-h-8 items-center justify-between gap-2 px-2"
            >
              <h2>
                <SettingsFoldTrigger>{title}</SettingsFoldTrigger>
              </h2>
              {control}
            </div>
            <CollapsiblePanel>
              <div className="flex flex-col gap-6">{children}</div>
            </CollapsiblePanel>
          </div>
        </Collapsible>
      </section>
    );
  }

  return (
    <section id={id} ref={targetRef} tabIndex={-1} className="outline-none">
      <Collapsible open={open} onOpenChange={setOpen} render={<SettingsGroup />}>
        {/* On a narrow screen the controls drop below the title instead of covering it. */}
        <div className="flex flex-wrap items-center gap-x-2 px-4">
          <CollapsibleTrigger className="flex min-h-12 min-w-0 flex-1 basis-40 items-center gap-2 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring rounded-row">
            <ChevronRightIcon
              aria-hidden
              className={cn(
                "size-4 shrink-0 text-ink-2 transition-transform duration-150 motion-reduce:transition-none",
                open && "rotate-90",
              )}
            />
            <span className="shrink-0 text-body font-medium">{title}</span>
            {summary ? (
              <span className="min-w-0 truncate text-meta text-ink-2">{summary}</span>
            ) : null}
          </CollapsibleTrigger>
          {control ? (
            <div className="ms-auto flex max-w-full items-center py-2">{control}</div>
          ) : null}
        </div>
        {!open && collapsedContent ? <div className="empty:hidden">{collapsedContent}</div> : null}
        <CollapsiblePanel>{children}</CollapsiblePanel>
      </Collapsible>
    </section>
  );
}
