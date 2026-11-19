import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import type { CSSProperties } from "react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { ControlledOpenContext, renderRetainedPopup } from "~/components/ui/dialog";

function Sheet<Payload>(props: SheetPrimitive.Root.Props<Payload>) {
  return (
    <ControlledOpenContext value={props.open}>
      <SheetPrimitive.Root {...props} />
    </ControlledOpenContext>
  );
}

const SheetPortal = SheetPrimitive.Portal;

function SheetBackdrop({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      className={cn(
        "dialog-backdrop fixed inset-0 z-(--z-sheet) transition-opacity duration-200 ease-out data-ending-style:opacity-0 data-starting-style:opacity-0",
        className,
      )}
      data-slot="sheet-backdrop"
      {...props}
    />
  );
}

function SheetViewport({
  className,
  side,
  variant = "default",
  ...props
}: SheetPrimitive.Viewport.Props & {
  side?: "right" | "left" | "top" | "bottom";
  variant?: "default" | "inset";
}) {
  return (
    <SheetPrimitive.Viewport
      className={cn(
        "fixed inset-0 z-(--z-sheet) grid app-region-no-drag",
        side === "bottom" && "grid grid-rows-(--grid-trail) pt-6",
        side === "top" && "grid grid-rows-(--grid-lead) pb-6",
        side === "left" && "flex justify-start pe-6",
        side === "right" && "flex justify-end ps-6",
        variant === "inset" && "sm:p-4",
        className,
      )}
      data-slot="sheet-viewport"
      {...props}
    />
  );
}

function SheetPopup({
  className,
  children,
  showCloseButton = true,
  keepMounted = false,
  transitionDurationMs,
  side = "right",
  variant = "default",
  style,
  ...props
}: SheetPrimitive.Popup.Props & {
  showCloseButton?: boolean;
  keepMounted?: boolean;
  transitionDurationMs?: number;
  side?: "right" | "left" | "top" | "bottom";
  variant?: "default" | "inset";
}) {
  const transitionStyle =
    transitionDurationMs === undefined
      ? undefined
      : ({ transitionDuration: `${transitionDurationMs}ms` } satisfies CSSProperties);
  const instant = transitionDurationMs === 0;

  return (
    <SheetPortal keepMounted={keepMounted}>
      <SheetBackdrop
        className={
          instant
            ? "transition-none! data-ending-style:opacity-100! data-starting-style:opacity-100!"
            : undefined
        }
        style={transitionStyle}
      />
      <SheetViewport side={side} variant={variant}>
        <SheetPrimitive.Popup
          className={cn(
            "level-float relative flex max-h-full min-h-0 w-full min-w-0 flex-col text-popover-foreground transition duration-200 ease-drawer will-change-transform data-ending-style:opacity-0 data-starting-style:opacity-0",
            // A sheet against the screen edge is cut square there; the inset sheet floats clear of it.
            variant === "inset" ? "max-sm:rounded-none" : "rounded-none",
            side === "bottom" &&
              "row-start-2 data-ending-style:translate-y-8 data-starting-style:translate-y-8",
            side === "top" && "data-ending-style:-translate-y-8 data-starting-style:-translate-y-8",
            side === "left" &&
              "data-ending-style:-translate-x-8 data-starting-style:-translate-x-8 max-w-md",
            side === "right" &&
              "col-start-2 max-w-md data-ending-style:translate-x-8 data-starting-style:translate-x-8",
            variant === "inset" && "sm:**:data-[slot=sheet-footer]:rounded-b-inherit",
            instant &&
              "transition-none! will-change-auto! data-ending-style:translate-x-0! data-starting-style:translate-x-0! data-ending-style:translate-y-0! data-starting-style:translate-y-0! data-ending-style:opacity-100! data-starting-style:opacity-100!",
            className,
          )}
          data-slot="sheet-popup"
          render={keepMounted ? undefined : renderRetainedPopup}
          style={{ ...transitionStyle, ...style }}
          {...props}
        >
          {children}
          {showCloseButton && (
            <SheetPrimitive.Close
              aria-label="Close"
              className="absolute end-2 top-2"
              render={<Button size="icon-sm" variant="ghost" />}
            >
              <XIcon />
            </SheetPrimitive.Close>
          )}
        </SheetPrimitive.Popup>
      </SheetViewport>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 p-4 in-[[data-slot=sheet-popup]:has([data-slot=sheet-panel])]:pb-4",
        className,
      )}
      data-slot="sheet-header"
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      className={cn("font-semibold text-title leading-snug", className)}
      data-slot="sheet-title"
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      className={cn("text-ink-2 text-body", className)}
      data-slot="sheet-description"
      {...props}
    />
  );
}

export {
  Sheet,
  SheetPortal,
  SheetBackdrop,
  SheetBackdrop as SheetOverlay,
  SheetPopup,
  SheetPopup as SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
};
