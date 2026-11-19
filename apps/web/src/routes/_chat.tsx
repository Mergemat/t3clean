import { Outlet, createFileRoute, redirect, useMatches } from "@tanstack/react-router";
import { useState } from "react";

import { ThreadRouteView } from "../components/ThreadRouteView";
import { GlobalVoiceInputIndicator } from "../components/chat/GlobalVoiceInputIndicator";
import { isAppModalPage, isSettingsPage } from "../components/sidebar/mainAppLocation";
import { SidebarInset } from "../components/ui/sidebar";
import { resolveThreadRouteTarget } from "../threadRoutes";
import { retainThreadFindForRoute } from "../components/chat/threadFindStore";
import { ThreadLinkPrompt } from "../components/promptLinks/ThreadLinkPrompt";
import {
  threadRouteTargetKey,
  useShownThreadRouteTarget,
} from "../hooks/useShownThreadRouteTarget";

function ChatRouteLayout() {
  // Render both routes here so draft promotion keeps the same ChatView mounted.
  const { shownTarget, modalOpen } = useShownThreadRouteTarget();
  const settingsOpen = useMatches({
    select: (matches) => matches.some((match) => isSettingsPage(match.pathname)),
  });
  // Settings is a page, but the thread it replaced stays mounted behind it, off screen: rebuilding
  // the chat is the slow part of leaving Settings, and it comes back as it was.
  const [keptTarget, setKeptTarget] = useState(shownTarget);
  if (!settingsOpen && threadRouteTargetKey(keptTarget) !== threadRouteTargetKey(shownTarget)) {
    setKeptTarget(shownTarget);
  }
  const threadTarget = settingsOpen ? keptTarget : shownTarget;
  return (
    <>
      {shownTarget?.kind === "server" && !modalOpen && !settingsOpen ? (
        <ThreadLinkPrompt threadRef={shownTarget.threadRef} />
      ) : null}
      {threadTarget ? (
        // Not <Activity>: hiding it tears down effects, and the composer's editor can't survive
        // that. Background mode keeps the thread running and inert; this only takes it off screen.
        <div className={settingsOpen ? "hidden" : "contents"}>
          <ThreadRouteView target={threadTarget} background={modalOpen || settingsOpen} />
        </div>
      ) : modalOpen ? (
        <SidebarInset className="h-dvh" />
      ) : settingsOpen ? null : (
        <Outlet />
      )}
      {modalOpen || settingsOpen ? <Outlet /> : null}
      <GlobalVoiceInputIndicator hidden={modalOpen} />
    </>
  );
}

export const Route = createFileRoute("/_chat")({
  beforeLoad: async ({ context, location }) => {
    if (
      context.authGateState.status !== "authenticated" &&
      context.authGateState.status !== "hosted-static"
    ) {
      throw redirect({ to: "/pair", replace: true });
    }
    return { appModalPage: isAppModalPage(location.pathname) };
  },
  component: ChatRouteLayout,
  // Every match carries the whole location's params, so this layout sees the thread route's too.
  onEnter: ({ context, params }) => retainThreadFindForRouteMatch(context.appModalPage, params),
  onStay: ({ context, params }) => retainThreadFindForRouteMatch(context.appModalPage, params),
  onLeave: () => retainThreadFindForRoute({ modalPage: false, threadRef: null }),
});

function retainThreadFindForRouteMatch(
  modalPage: boolean,
  params: Partial<Record<"environmentId" | "threadId", string>>,
) {
  const target = resolveThreadRouteTarget(params);
  retainThreadFindForRoute({
    modalPage,
    threadRef: target?.kind === "server" ? target.threadRef : null,
  });
}
