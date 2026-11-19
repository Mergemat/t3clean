import { createContext, useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Where a page puts its list: the frame lists, the window works (DESIGN.md, Levels). */
export const SidebarListSlotContext = createContext<HTMLElement | null>(null);

/** Renders a page's list into the sidebar, in place of the thread list. */
export function SidebarList({ children }: { children: ReactNode }) {
  const slot = useContext(SidebarListSlotContext);
  return slot ? createPortal(children, slot) : null;
}
