import { T } from "gt-react";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "./ui/empty";
import { SidebarInset } from "./ui/sidebar";
import { isElectron } from "../env";
import { WorkspacePageHeader } from "./WorkspacePageHeader";

export function NoActiveThreadState() {
  return (
    <SidebarInset className="h-dvh min-h-0 overflow-hidden overscroll-y-none">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden bg-background">
        <WorkspacePageHeader electron={isElectron} className="border-b border-border">
          {isElectron ? (
            <span className="text-meta text-ink-3">
              <T>No active thread</T>
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-body font-medium text-ink-1 md:text-ink-3">
                <T>No active thread</T>
              </span>
            </div>
          )}
        </WorkspacePageHeader>

        <Empty className="flex-1">
          <div className="w-full max-w-lg px-6 py-6">
            <EmptyHeader className="max-w-none">
              <EmptyTitle>
                <T>Pick a thread to continue</T>
              </EmptyTitle>
              <EmptyDescription>
                <T>Select an existing thread or create a new one to get started.</T>
              </EmptyDescription>
            </EmptyHeader>
          </div>
        </Empty>
      </div>
    </SidebarInset>
  );
}
