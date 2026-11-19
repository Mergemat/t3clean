import { Dialog as CommandDialogPrimitive } from "@base-ui/react/dialog";
import { SearchIcon } from "lucide-react";
import { useRef } from "react";
import type * as React from "react";
import { cn } from "~/lib/utils";
import { useNativeTitlebarHeight } from "~/lib/windowControlsOverlay";
import {
  Autocomplete,
  AutocompleteCollection,
  AutocompleteGroup,
  AutocompleteGroupLabel,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompleteListHeading,
  AutocompleteListVirtualized,
} from "~/components/ui/autocomplete";
import { DIALOG_BACKDROP_CLASS, DIALOG_POPUP_CLASS } from "~/components/ui/dialog-styles";
import { Button } from "~/components/ui/button";

const CommandDialog = CommandDialogPrimitive.Root;

const CommandDialogPortal = CommandDialogPrimitive.Portal;

function CommandDialogTrigger(props: CommandDialogPrimitive.Trigger.Props) {
  return <CommandDialogPrimitive.Trigger data-slot="command-dialog-trigger" {...props} />;
}

function CommandDialogBackdrop({ className, ...props }: CommandDialogPrimitive.Backdrop.Props) {
  return (
    <CommandDialogPrimitive.Backdrop
      // Opened from the keyboard many times a day, so it appears and leaves without a transition.
      className={cn(
        DIALOG_BACKDROP_CLASS,
        "transition-none data-ending-style:pointer-events-none",
        className,
      )}
      data-slot="command-dialog-backdrop"
      {...props}
    />
  );
}

function CommandDialogViewport({ className, ...props }: CommandDialogPrimitive.Viewport.Props) {
  // Short desktop windows would put the search field under the native window controls.
  const nativeTitlebarHeight = useNativeTitlebarHeight();
  const titlebarStyle = {
    "--command-titlebar-height": `${nativeTitlebarHeight}px`,
  } as React.CSSProperties;
  return (
    <CommandDialogPrimitive.Viewport
      className={cn(
        "pointer-events-none fixed inset-0 z-50 flex flex-col items-center px-4 app-region-no-drag pt-(--command-titlebar-height) pb-4 sm:py-6",
        className,
      )}
      data-slot="command-dialog-viewport"
      style={titlebarStyle}
      {...props}
    />
  );
}

function CommandDialogPopup({
  className,
  children,
  onBackdropPointerDown,
  ...props
}: CommandDialogPrimitive.Popup.Props & {
  onBackdropPointerDown?: React.PointerEventHandler<HTMLDivElement>;
}) {
  const popupRef = useRef<HTMLDivElement>(null);
  return (
    <CommandDialogPortal>
      <CommandDialogBackdrop onPointerDown={onBackdropPointerDown} />
      <CommandDialogViewport>
        <CommandDialogPrimitive.Popup
          // The first tabbable can be an input addon, such as a submenu's Back button.
          initialFocus={() => popupRef.current?.querySelector("input") ?? true}
          ref={popupRef}
          className={cn(
            DIALOG_POPUP_CLASS,
            "pointer-events-auto mt-2 max-h-104 max-w-xl text-ink-1 sm:mt-0 transition-none data-ending-style:pointer-events-none",
            className,
          )}
          data-slot="command-dialog-popup"
          {...props}
        >
          {children}
        </CommandDialogPrimitive.Popup>
      </CommandDialogViewport>
    </CommandDialogPortal>
  );
}

function Command({
  autoHighlight = "always",
  keepHighlight = true,
  ...props
}: React.ComponentProps<typeof Autocomplete>) {
  return (
    <Autocomplete
      autoHighlight={autoHighlight}
      inline
      keepHighlight={keepHighlight}
      open
      {...props}
    />
  );
}

function CommandInput({
  className,
  placeholder,
  ...props
}: React.ComponentProps<typeof AutocompleteInput>) {
  return (
    // The menus' search field: a filled row one step in from the float's corner.
    <div className="px-2 pt-2 pb-1">
      <AutocompleteInput
        autoFocus
        className={cn(
          "rounded-row border-transparent! transition-colors before:hidden has-focus-visible:ring-0 placeholder:text-ink-3 *:data-[slot=autocomplete-input]:ps-8! sm:*:data-[slot=autocomplete-input]:ps-8!",
          className,
        )}
        placeholder={placeholder}
        size="sm"
        startAddon={<SearchIcon className="text-ink-3" />}
        {...props}
      />
    </div>
  );
}

function CommandList({ className, ...props }: React.ComponentProps<typeof AutocompleteList>) {
  return (
    <AutocompleteList
      className={cn("not-empty:scroll-py-2 not-empty:nest-box", className)}
      data-slot="command-list"
      {...props}
    />
  );
}

function CommandListVirtualized({
  className,
  ...props
}: React.ComponentProps<typeof AutocompleteListVirtualized>) {
  return (
    <AutocompleteListVirtualized
      className={cn("flex max-h-inherit min-h-0 flex-col", className)}
      data-slot="command-list"
      {...props}
    />
  );
}

function CommandListHeading({
  className,
  ...props
}: React.ComponentProps<typeof AutocompleteListHeading>) {
  return (
    <AutocompleteListHeading className={className} data-slot="command-group-label" {...props} />
  );
}

function CommandPanel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "relative min-h-0 overflow-hidden rounded-t-box not-has-[+[data-slot=command-footer]]:rounded-b-box bg-transparent **:data-[slot=scroll-area-scrollbar]:mt-2 touch-pan-y",
        className,
      )}
      {...props}
    />
  );
}

function CommandGroup({ className, ...props }: React.ComponentProps<typeof AutocompleteGroup>) {
  return <AutocompleteGroup className={className} data-slot="command-group" {...props} />;
}

function CommandGroupLabel({
  className,
  ...props
}: React.ComponentProps<typeof AutocompleteGroupLabel>) {
  return (
    <AutocompleteGroupLabel className={className} data-slot="command-group-label" {...props} />
  );
}

function CommandCollection({ ...props }: React.ComponentProps<typeof AutocompleteCollection>) {
  return <AutocompleteCollection data-slot="command-collection" {...props} />;
}

// Pass active to override primitive hover/keyboard highlights when the palette tracks its own row.
function CommandItem({
  className,
  active,
  ...props
}: React.ComponentProps<typeof AutocompleteItem> & { active?: boolean }) {
  return (
    <AutocompleteItem
      className={cn(
        "py-2 data-selected:bg-tint-1 data-highlighted:bg-tint-2 data-highlighted:text-ink-1 [&[data-highlighted][data-selected]]:bg-tint-2 [&[data-highlighted][data-selected]]:text-ink-1",
        active !== undefined &&
          "cursor-pointer hover:bg-transparent hover:text-inherit data-highlighted:bg-transparent data-highlighted:text-inherit data-selected:bg-transparent data-selected:text-inherit [&[data-highlighted][data-selected]]:bg-transparent [&[data-highlighted][data-selected]]:text-inherit",
        active && "bg-tint-2! text-accent-foreground!",
        className,
      )}
      data-active={active || undefined}
      data-slot="command-item"
      {...props}
    />
  );
}

function CommandShortcut({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "ms-auto font-medium font-sans text-ink-2 text-meta tracking-widest",
        className,
      )}
      data-slot="command-shortcut"
      {...props}
    />
  );
}

function CommandFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        // No band and no line: a quiet line of meta text on the rows' text edge.
        "relative flex items-center justify-between gap-2 px-4 pt-1 pb-3 text-meta text-ink-2",
        className,
      )}
      data-slot="command-footer"
      {...props}
    />
  );
}

function CommandFooterAction({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size" | "variant">) {
  return (
    <Button
      {...props}
      variant="ghost-muted"
      size="xs"
      className={cn("h-auto px-2 text-meta hover:bg-transparent", className)}
    />
  );
}

export {
  Command,
  CommandCollection,
  CommandDialog,
  CommandDialogPopup,
  CommandDialogTrigger,
  CommandFooter,
  CommandFooterAction,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
  CommandListHeading,
  CommandListVirtualized,
  CommandPanel,
  CommandShortcut,
};
