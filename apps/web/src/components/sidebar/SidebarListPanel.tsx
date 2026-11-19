import { useEffect, type ReactNode, type RefObject } from "react";

import { Button } from "../ui/button";
import { RefreshIcon } from "../ui/refresh-icon";
import { workspaceAreaProps } from "../../lib/workspaceFocus";

/**
 * A list the sidebar shows in place of threads (pull requests, issues): the thread list's header
 * row (search, then the list's controls as icons), then the cards.
 */
export function SidebarListPanel({
  area,
  label,
  search,
  controls,
  refreshLabel,
  refreshing,
  onRefresh,
  children,
  scrollRef,
}: {
  /** The workspace area name keyboard focus moves by. */
  area: string;
  label: string;
  search: ReactNode;
  controls: ReactNode;
  refreshLabel: string;
  refreshing: boolean;
  onRefresh: () => void;
  children: ReactNode;
  scrollRef?: RefObject<HTMLDivElement | null>;
}) {
  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- window keydown listener focuses the list's search on Cmd/Ctrl+F
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key.toLowerCase() !== "f" || !(event.metaKey || event.ctrlKey)) return;
      if (event.altKey || event.shiftKey) return;
      const input = document.querySelector<HTMLInputElement>("[data-sidebar-list-search] input");
      if (!input) return;
      event.preventDefault();
      input.focus();
      input.select();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div {...workspaceAreaProps(area, 0, label)} className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-1 p-(--sidebar-content-inset)">
        <div data-sidebar-list-search className="flex min-w-0 flex-1">
          {search}
        </div>
        <div className="flex shrink-0 items-center">
          {controls}
          <Button
            size="icon-sm"
            variant="ghost-muted"
            aria-label={refreshLabel}
            onClick={onRefresh}
            disabled={refreshing}
          >
            <RefreshIcon size="md" refreshing={refreshing} />
          </Button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-(--sidebar-content-inset) pb-(--sidebar-content-inset)"
      >
        {children}
      </div>
    </div>
  );
}
