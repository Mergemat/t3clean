import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";
import { useRender } from "@base-ui/react/use-render";

import { cn } from "~/lib/utils";
import {
  DIALOG_BACKDROP_CLASS,
  DIALOG_MOBILE_SHEET_CLASS,
  DIALOG_POPUP_CLASS,
  DIALOG_SIZE_CLASS,
  DIALOG_HEADER_CLASS,
  DIALOG_FOOTER_CLASS,
  DIALOG_TITLE_CLASS,
  type DialogSize,
} from "~/components/ui/dialog-styles";
import {
  ControlledOpenContext,
  DialogAction,
  renderRetainedPopup,
  useDialogActionInitialFocus,
} from "~/components/ui/dialog";

function AlertDialog<Payload>(props: AlertDialogPrimitive.Root.Props<Payload>) {
  return (
    <ControlledOpenContext value={props.open}>
      <AlertDialogPrimitive.Root {...props} />
    </ControlledOpenContext>
  );
}

const AlertDialogPortal = AlertDialogPrimitive.Portal;

function AlertDialogBackdrop({ className, ...props }: AlertDialogPrimitive.Backdrop.Props) {
  return (
    <AlertDialogPrimitive.Backdrop
      forceRender
      className={cn(DIALOG_BACKDROP_CLASS, className)}
      data-slot="alert-dialog-backdrop"
      {...props}
    />
  );
}

function AlertDialogViewport({ className, ...props }: AlertDialogPrimitive.Viewport.Props) {
  return (
    <AlertDialogPrimitive.Viewport
      className={cn(
        "fixed inset-0 z-50 grid content-center-safe justify-items-center p-4",
        className,
      )}
      data-slot="alert-dialog-viewport"
      {...props}
    />
  );
}

function AlertDialogPopup({
  className,
  bottomStickOnMobile = true,
  portalContainer,
  size = "sm",
  ...props
}: AlertDialogPrimitive.Popup.Props & {
  size?: DialogSize;
  bottomStickOnMobile?: boolean;
  portalContainer?: AlertDialogPrimitive.Portal.Props["container"];
}) {
  const { popupRef, initialFocus } = useDialogActionInitialFocus();
  const popup = useRender({
    ref: popupRef,
    render: (
      <AlertDialogPrimitive.Popup
        className={cn(
          DIALOG_POPUP_CLASS,
          "row-start-2 max-h-full text-popover-foreground",
          DIALOG_SIZE_CLASS[size],
          bottomStickOnMobile && DIALOG_MOBILE_SHEET_CLASS,
          className,
        )}
        data-slot="alert-dialog-popup"
        initialFocus={initialFocus}
        render={renderRetainedPopup}
        {...props}
      />
    ),
  });
  return (
    <AlertDialogPortal container={portalContainer}>
      <AlertDialogBackdrop />
      <AlertDialogViewport
        className={cn(
          bottomStickOnMobile && "max-sm:grid-rows-(--grid-trail) max-sm:p-0 max-sm:pt-6",
        )}
      >
        {popup}
      </AlertDialogViewport>
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("min-h-0", DIALOG_HEADER_CLASS, className)}
      data-slot="alert-dialog-header"
      {...props}
    />
  );
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(DIALOG_FOOTER_CLASS, className)}
      data-slot="alert-dialog-footer"
      {...props}
    />
  );
}

function AlertDialogTitle({ className, ...props }: AlertDialogPrimitive.Title.Props) {
  return (
    <AlertDialogPrimitive.Title
      className={cn("shrink-0", DIALOG_TITLE_CLASS, className)}
      data-slot="alert-dialog-title"
      {...props}
    />
  );
}

function AlertDialogDescription({ className, ...props }: AlertDialogPrimitive.Description.Props) {
  return (
    <AlertDialogPrimitive.Description
      className={cn(
        "wrap-anywhere max-h-96 min-h-0 overflow-y-auto overscroll-contain text-ink-2 text-body select-text",
        className,
      )}
      data-slot="alert-dialog-description"
      {...props}
    />
  );
}

function AlertDialogClose(props: AlertDialogPrimitive.Close.Props) {
  return <AlertDialogPrimitive.Close data-slot="alert-dialog-close" {...props} />;
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogBackdrop,
  AlertDialogBackdrop as AlertDialogOverlay,
  AlertDialogPopup,
  AlertDialogPopup as AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
  DialogAction as AlertDialogAction,
  AlertDialogViewport,
};
