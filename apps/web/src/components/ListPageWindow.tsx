import { createContext, useState, type ReactNode } from "react";

import { isElectron } from "~/env";
import { ConversationBackdrop } from "./chat/ConversationBackdrop";
import { WorkspaceBreadcrumb, WorkspaceBreadcrumbItem } from "./WorkspaceBreadcrumb";
import { WorkspacePageHeader } from "./WorkspacePageHeader";

/** The frame header above the open item; the item puts its title and actions here, the way a
 *  thread's title and controls sit in the header rather than in the chat. */
export const WindowHeaderSlotContext = createContext<HTMLElement | null>(null);

/**
 * The window of a page whose list lives in the sidebar: the open item fills it like a thread,
 * and with nothing open it is the empty sky.
 */
export function ListPageWindow({
  title,
  breadcrumbLabel,
  emptyText,
  children,
}: {
  title: ReactNode;
  breadcrumbLabel: string;
  emptyText: ReactNode;
  /** The open item, or null. */
  children: ReactNode;
}) {
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null);
  const open = children !== null && children !== undefined && children !== false;
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <WorkspacePageHeader data-chat-header="" electron={isElectron}>
        {open ? (
          <div
            ref={setHeaderSlot}
            className="grid min-w-0 flex-1 grid-cols-(--grid-trail) items-center gap-x-2"
          />
        ) : (
          <WorkspaceBreadcrumb ariaLabel={breadcrumbLabel}>
            <WorkspaceBreadcrumbItem current>
              <h1 className="truncate">{title}</h1>
            </WorkspaceBreadcrumbItem>
          </WorkspaceBreadcrumb>
        )}
      </WorkspacePageHeader>
      {open ? (
        <WindowHeaderSlotContext value={headerSlot}>
          <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
        </WindowHeaderSlotContext>
      ) : (
        <div className="relative isolate flex min-h-0 flex-1 flex-col items-center justify-center">
          <ConversationBackdrop />
          <p className="text-body text-ink-2">{emptyText}</p>
        </div>
      )}
    </div>
  );
}
