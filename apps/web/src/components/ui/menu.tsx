import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { ChevronRightIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "~/lib/utils";
import { buttonVariants } from "./button";
import { renderClosingPositioner } from "./closing-positioner";
import type { InputProps } from "./input";
import { SearchField } from "./search-field";

const Menu = MenuPrimitive.Root;

function MenuTrigger({ className, children, ...props }: MenuPrimitive.Trigger.Props) {
  return (
    <MenuPrimitive.Trigger className={className} data-slot="menu-trigger" {...props}>
      {children}
    </MenuPrimitive.Trigger>
  );
}

function MenuPopup({
  children,
  className,
  sideOffset = 4,
  align = "center",
  alignOffset,
  side = "bottom",
  collisionAvoidance,
  anchor,
  keepMounted = false,
  width = "default",
  ...props
}: MenuPrimitive.Popup.Props & {
  align?: MenuPrimitive.Positioner.Props["align"];
  sideOffset?: MenuPrimitive.Positioner.Props["sideOffset"];
  alignOffset?: MenuPrimitive.Positioner.Props["alignOffset"];
  side?: MenuPrimitive.Positioner.Props["side"];
  collisionAvoidance?: MenuPrimitive.Positioner.Props["collisionAvoidance"];
  anchor?: MenuPrimitive.Positioner.Props["anchor"];
  keepMounted?: boolean;
  width?: "default" | "content";
}) {
  return (
    <MenuPrimitive.Portal keepMounted={keepMounted}>
      <MenuPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        collisionAvoidance={collisionAvoidance}
        className="z-130"
        data-slot="menu-positioner"
        render={renderClosingPositioner}
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          className={cn(
            "level-float relative flex origin-(--transform-origin) outline-none focus:outline-none",
            // Electron drag hit-testing ignores z-index; opt portaled menus out to keep overlapping rows
            // hoverable.
            "app-region-no-drag",
            "max-w-(--viewport-inset)",
            width === "content" ? "w-max min-w-0" : "min-w-40",
            className,
          )}
          data-slot="menu-popup"
          {...props}
        >
          <div className="max-h-(--available-height) w-full overflow-y-auto nest-box">
            {children}
          </div>
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

/** A menu's filter field, drawn like `ComboboxSearchInput` so every searchable popup matches. */
function MenuSearchInput({
  busy = false,
  onKeyDown,
  ...props
}: Omit<InputProps, "className" | "size" | "unstyled" | "nativeInput"> & { busy?: boolean }) {
  return (
    <div className="min-w-0 shrink-0 pt-2 pb-1">
      <SearchField
        {...props}
        busy={busy}
        onKeyDown={(event) => {
          // Menu typeahead would otherwise take the letters; arrows still reach the items.
          if (event.key !== "ArrowDown" && event.key !== "Escape") event.stopPropagation();
          onKeyDown?.(event);
        }}
      />
    </div>
  );
}

function MenuGroup(props: MenuPrimitive.Group.Props) {
  return <MenuPrimitive.Group data-slot="menu-group" {...props} />;
}

function MenuItem({
  className,
  inset,
  density = "default",
  variant = "default",
  ...props
}: MenuPrimitive.Item.Props & {
  inset?: boolean;
  density?: "default" | "touch";
  variant?: "default" | "destructive" | "ghost";
}) {
  return (
    <MenuPrimitive.Item
      className={cn(
        "nest-row flex min-h-8 items-center cursor-pointer select-none py-1 text-body text-ink-1 outline-none data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-highlighted:bg-tint-2 data-inset:ps-8 data-[variant=destructive]:text-destructive-foreground data-highlighted:text-accent-foreground data-disabled:opacity-64 [&>svg:not([class*='opacity-'])]:opacity-80 [&>svg:not([class*='size-'])]:size-4 [&>svg:not([class*='text-'])]:text-ink-2 data-[variant=destructive]:[&>svg:not([class*='text-'])]:text-current [&>svg]:pointer-events-none [&>svg]:shrink-0",
        variant === "ghost" &&
          buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "h-auto min-h-7 w-full sm:text-meta",
          }),
        density === "touch" && "min-h-10 sm:min-h-10",
        className,
      )}
      data-density={density}
      data-inset={inset}
      data-slot="menu-item"
      data-variant={variant}
      {...props}
    />
  );
}

function MenuItemLabel({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="menu-item-label"
      className={cn(
        "min-w-0 truncate in-data-[density=touch]:text-box-trim supports-[text-box:trim-both_cap_alphabetic]:in-data-[density=touch]:py-2",
        className,
      )}
      {...props}
    />
  );
}

function MenuCheckboxItem({
  className,
  children,
  checked,
  variant = "default",
  ...props
}: MenuPrimitive.CheckboxItem.Props & {
  variant?: "default" | "icon" | "switch";
}) {
  return (
    <MenuPrimitive.CheckboxItem
      checked={checked}
      className={cn(
        "nest-row grid min-h-8 in-data-[side=none]:min-w-(--anchor-width) cursor-pointer items-center py-1 text-body text-ink-1 outline-none data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-highlighted:bg-tint-2 data-highlighted:text-accent-foreground data-disabled:opacity-64 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        variant === "switch" ? "grid-cols-(--grid-trail)" : "grid-cols-(--grid-lead)",
        className,
      )}
      data-slot="menu-checkbox-item"
      {...props}
    >
      {variant === "switch" ? (
        <>
          <span className="col-start-1">{children}</span>
          <MenuPrimitive.CheckboxItemIndicator
            className="inline-flex shrink-0 items-center rounded-full p-1 outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background data-checked:bg-primary data-unchecked:bg-tint-2 data-disabled:opacity-64"
            data-slot="menu-checkbox-item-switch"
            keepMounted
          >
            <span
              className="pointer-events-none block in-[[data-slot=menu-checkbox-item]:active]:not-data-disabled:scale-x-110 bg-white shadow-knob dark:in-data-unchecked:bg-foreground/80"
              data-slot="menu-checkbox-item-switch-thumb"
            />
          </MenuPrimitive.CheckboxItemIndicator>
        </>
      ) : (
        <>
          {/* Always mounted, hidden when unchecked: the check keeps its column, so checked and
              unchecked labels share one edge, as in shadcn's fixed indicator column. */}
          <MenuPrimitive.CheckboxItemIndicator
            keepMounted
            className="col-start-1 flex size-4 items-center justify-center data-unchecked:invisible"
          >
            <svg
              className="size-4"
              fill="none"
              height="24"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.75"
              viewBox="0 0 24 24"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M5.252 12.7 10.2 18.63 18.748 5.37" />
            </svg>
          </MenuPrimitive.CheckboxItemIndicator>
          <span className="col-start-2">{children}</span>
        </>
      )}
    </MenuPrimitive.CheckboxItem>
  );
}

function MenuRadioGroup(props: MenuPrimitive.RadioGroup.Props) {
  return <MenuPrimitive.RadioGroup data-slot="menu-radio-group" {...props} />;
}

function MenuRadioItem({
  className,
  children,
  hideIndicator: _hideIndicator = false,
  ...props
}: MenuPrimitive.RadioItem.Props & {
  hideIndicator?: boolean;
}) {
  return (
    <MenuPrimitive.RadioItem
      className={cn(
        "nest-row flex min-h-8 in-data-[side=none]:min-w-(--anchor-width) items-center cursor-pointer py-1 text-body text-ink-1 outline-none data-checked:bg-tint-1 data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-highlighted:bg-tint-2 data-highlighted:text-accent-foreground data-disabled:opacity-64 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      data-slot="menu-radio-item"
      {...props}
    >
      <span className="min-w-0 flex-1">{children}</span>
    </MenuPrimitive.RadioItem>
  );
}

function MenuGroupLabel({
  className,
  inset,
  ...props
}: MenuPrimitive.GroupLabel.Props & {
  inset?: boolean;
}) {
  return (
    <MenuPrimitive.GroupLabel
      className={cn("nest-text py-2 font-medium text-ink-2 text-meta data-inset:ps-8", className)}
      data-inset={inset}
      data-slot="menu-label"
      {...props}
    />
  );
}

function MenuSeparator({ className, ...props }: MenuPrimitive.Separator.Props) {
  return (
    <MenuPrimitive.Separator
      // Groups are separated by space, one step, not lines (DESIGN.md).
      className={cn("h-2", className)}
      data-slot="menu-separator"
      {...props}
    />
  );
}

function MenuShortcut({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "ms-auto font-medium font-sans text-ink-2 text-meta tracking-widest",
        className,
      )}
      data-slot="menu-shortcut"
      {...props}
    />
  );
}

// Trailing value on a menu row, such as the time a snooze preset wakes at.
// Reads as text at the row's size; MenuShortcut is only for key chords.
function MenuItemDetail({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn("ms-auto shrink-0 ps-4 text-ink-2 tabular-nums", className)}
      data-slot="menu-item-detail"
      {...props}
    />
  );
}

function MenuSub(props: MenuPrimitive.SubmenuRoot.Props) {
  return <MenuPrimitive.SubmenuRoot data-slot="menu-sub" {...props} />;
}

function MenuSubTrigger({
  className,
  inset,
  density = "default",
  children,
  ...props
}: MenuPrimitive.SubmenuTrigger.Props & {
  inset?: boolean;
  density?: "default" | "touch";
}) {
  return (
    <MenuPrimitive.SubmenuTrigger
      className={cn(
        "nest-row flex min-h-8 items-center cursor-pointer py-1 text-body text-ink-1 outline-none data-disabled:cursor-not-allowed data-disabled:pointer-events-none data-highlighted:bg-tint-2 data-popup-open:bg-tint-2 data-inset:ps-8 data-highlighted:text-accent-foreground data-popup-open:text-accent-foreground data-disabled:opacity-64 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-ink-2 [&>svg:not(:last-child):not([class*='opacity-'])]:opacity-80 [&_svg]:pointer-events-none [&>svg]:shrink-0",
        density === "touch" && "min-h-10 sm:min-h-10",
        className,
      )}
      data-density={density}
      data-inset={inset}
      data-slot="menu-sub-trigger"
      {...props}
    >
      {children}
      <ChevronRightIcon className="ms-auto opacity-80" />
    </MenuPrimitive.SubmenuTrigger>
  );
}

function MenuSubPopup({
  className,
  sideOffset = 0,
  alignOffset,
  align = "start",
  ...props
}: MenuPrimitive.Popup.Props & {
  align?: MenuPrimitive.Positioner.Props["align"];
  sideOffset?: MenuPrimitive.Positioner.Props["sideOffset"];
  alignOffset?: MenuPrimitive.Positioner.Props["alignOffset"];
}) {
  const defaultAlignOffset = align !== "center" ? -5 : undefined;

  return (
    <MenuPopup
      align={align}
      alignOffset={alignOffset ?? defaultAlignOffset}
      className={className}
      data-slot="menu-sub-content"
      side="inline-end"
      sideOffset={sideOffset}
      {...props}
    />
  );
}

export {
  Menu,
  Menu as DropdownMenu,
  MenuTrigger,
  MenuTrigger as DropdownMenuTrigger,
  MenuPopup,
  MenuPopup as DropdownMenuContent,
  MenuSearchInput,
  MenuGroup,
  MenuGroup as DropdownMenuGroup,
  MenuItem,
  MenuItemLabel,
  MenuItem as DropdownMenuItem,
  MenuCheckboxItem,
  MenuCheckboxItem as DropdownMenuCheckboxItem,
  MenuRadioGroup,
  MenuRadioGroup as DropdownMenuRadioGroup,
  MenuRadioItem,
  MenuRadioItem as DropdownMenuRadioItem,
  MenuGroupLabel,
  MenuGroupLabel as DropdownMenuLabel,
  MenuSeparator,
  MenuSeparator as DropdownMenuSeparator,
  MenuItemDetail,
  MenuShortcut,
  MenuShortcut as DropdownMenuShortcut,
  MenuSub,
  MenuSub as DropdownMenuSub,
  MenuSubTrigger,
  MenuSubTrigger as DropdownMenuSubTrigger,
  MenuSubPopup,
  MenuSubPopup as DropdownMenuSubContent,
};
