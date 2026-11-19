import { T } from "gt-react";
import { type ReactNode } from "react";

import { Sheet, SheetHeader, SheetPopup, SheetTitle } from "./ui/sheet";

export function RightPanelSheet(props: {
  animationDurationMs: number;
  children: ReactNode;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Sheet
      open={props.open}
      onOpenChange={(open) => {
        if (!open) {
          props.onClose();
        }
      }}
    >
      <SheetPopup
        transitionDurationMs={props.animationDurationMs}
        side="right"
        showCloseButton={false}
        keepMounted
        // Stretched by the sheet viewport, so the top margin alone shortens it under the titlebar.
        className="w-2/5 min-w-80 max-w-112 max-[760px]:w-96 max-[760px]:min-w-0 max-[760px]:max-w-(--viewport-inset) wco:mt-(--workspace-topbar-height)"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>
            <T>Workspace panel</T>
          </SheetTitle>
        </SheetHeader>
        {props.children}
      </SheetPopup>
    </Sheet>
  );
}
