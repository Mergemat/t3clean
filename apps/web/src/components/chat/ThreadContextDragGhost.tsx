import { MessagesSquareIcon } from "lucide-react";
import { createPortal } from "react-dom";

import { useThreadContextDragGhost } from "./threadContextDrag";

export function ThreadContextDragGhost() {
  const ghost = useThreadContextDragGhost();
  if (ghost === null) return null;
  return createPortal(
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-100 flex max-w-72 items-center gap-2 rounded-row border bg-popover px-2 py-2 text-body shadow-lg"
      style={{ transform: `translate(${ghost.x + 12}px, ${ghost.y + 12}px)` }}
    >
      <MessagesSquareIcon className="size-4 shrink-0 text-ink-2" />
      <span className="truncate">{ghost.title}</span>
      {ghost.count > 1 ? (
        <span className="shrink-0 rounded-row bg-muted px-2 text-meta text-ink-2">
          +{ghost.count - 1}
        </span>
      ) : null}
    </div>,
    document.body,
  );
}
