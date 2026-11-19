import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { ChevronsUpDownIcon, SearchIcon, XIcon } from "lucide-react";
import * as React from "react";

import { cn } from "~/lib/utils";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";

const ComboboxContext = React.createContext<{
  chipsRef: React.RefObject<Element | null> | null;
  multiple: boolean;
}>({
  chipsRef: null,
  multiple: false,
});

function Combobox<Value, Multiple extends boolean | undefined = false>(
  props: ComboboxPrimitive.Root.Props<Value, Multiple>,
) {
  const chipsRef = React.useRef<Element | null>(null);
  const value = { chipsRef, multiple: !!props.multiple };
  return (
    <ComboboxContext value={value}>
      <ComboboxPrimitive.Root {...props} />
    </ComboboxContext>
  );
}

function ComboboxInput({
  className,
  showTrigger = true,
  showClear = false,
  startAddon,
  size,
  unstyled = false,
  ...props
}: Omit<ComboboxPrimitive.Input.Props, "size"> & {
  showTrigger?: boolean;
  showClear?: boolean;
  startAddon?: React.ReactNode;
  size?: "sm" | "default" | "lg" | number;
  unstyled?: boolean;
  ref?: React.Ref<HTMLInputElement>;
}) {
  const sizeValue = (size ?? "default") as "sm" | "default" | "lg" | number;

  return (
    <div className="relative not-has-[>*.w-full]:w-fit w-full text-ink-1 has-disabled:opacity-64">
      {startAddon && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 start-px z-10 flex items-center ps-3 opacity-80 has-[+[data-size=sm]]:ps-3 [&_svg:not([class*='size-'])]:size-4 sm:[&_svg:not([class*='size-'])]:size-4"
          data-slot="combobox-start-addon"
        >
          {startAddon}
        </div>
      )}
      <ComboboxPrimitive.Input
        className={cn(
          startAddon &&
            "data-[size=sm]:*:data-[slot=combobox-input]:ps-8 *:data-[slot=combobox-input]:ps-8 sm:data-[size=sm]:*:data-[slot=combobox-input]:ps-7 sm:*:data-[slot=combobox-input]:ps-8",
          sizeValue === "sm"
            ? "has-[+[data-slot=combobox-trigger],+[data-slot=combobox-clear]]:*:data-[slot=combobox-input]:pe-6"
            : "has-[+[data-slot=combobox-trigger],+[data-slot=combobox-clear]]:*:data-[slot=combobox-input]:pe-7",
          className,
        )}
        data-slot="combobox-input"
        render={
          <Input
            className={cn(
              "has-disabled:opacity-100",
              unstyled && "rounded-none bg-transparent text-body",
            )}
            nativeInput
            size={sizeValue}
            unstyled={unstyled}
          />
        }
        {...props}
      />
      {showTrigger && (
        <ComboboxTrigger
          className={cn(
            "-translate-y-1/2 absolute top-1/2 inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-row border border-transparent opacity-80 outline-none transition-opacity pointer-coarse:after:absolute pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 hover:opacity-100 has-[+[data-slot=combobox-clear]]:hidden sm:size-7 [&_svg:not([class*='size-'])]:size-4 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
            sizeValue === "sm" ? "end-0" : "end-1",
          )}
        >
          <ComboboxPrimitive.Icon data-slot="combobox-icon">
            <ChevronsUpDownIcon />
          </ComboboxPrimitive.Icon>
        </ComboboxTrigger>
      )}
      {showClear && (
        <ComboboxClear
          className={cn(
            "-translate-y-1/2 absolute top-1/2 inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-row border border-transparent opacity-80 outline-none transition-opacity pointer-coarse:after:absolute pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 hover:opacity-100 has-[+[data-slot=combobox-clear]]:hidden sm:size-7 [&_svg:not([class*='size-'])]:size-4 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
            sizeValue === "sm" ? "end-0" : "end-1",
          )}
        >
          <XIcon />
        </ComboboxClear>
      )}
    </div>
  );
}

function ComboboxSearchInput(props: React.ComponentProps<typeof ComboboxInput>) {
  return (
    // The field is a row of the list: its edges where the items' fills are, its icon on theirs.
    <div className="min-w-0 shrink-0 px-2 pt-2">
      <div className="relative rounded-row bg-tint-1 px-2 transition-colors focus-within:bg-tint-2">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-2 left-2 size-4 shrink-0 text-ink-3"
        />
        <ComboboxInput
          {...props}
          className="flex w-full [&_input]:h-8 [&_input]:ps-6 [&_input]:font-sans [&_input]:leading-8"
          showTrigger={false}
          size="sm"
          unstyled
        />
      </div>
    </div>
  );
}

function ComboboxTrigger({ className, children, ...props }: ComboboxPrimitive.Trigger.Props) {
  return (
    <ComboboxPrimitive.Trigger className={className} data-slot="combobox-trigger" {...props}>
      {children}
    </ComboboxPrimitive.Trigger>
  );
}

function ComboboxPopup({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  alignOffset,
  align = "start",
  collisionAvoidance,
  anchor: anchorProp,
  ...props
}: ComboboxPrimitive.Popup.Props & {
  align?: ComboboxPrimitive.Positioner.Props["align"];
  sideOffset?: ComboboxPrimitive.Positioner.Props["sideOffset"];
  alignOffset?: ComboboxPrimitive.Positioner.Props["alignOffset"];
  side?: ComboboxPrimitive.Positioner.Props["side"];
  anchor?: ComboboxPrimitive.Positioner.Props["anchor"];
  collisionAvoidance?: ComboboxPrimitive.Positioner.Props["collisionAvoidance"];
}) {
  const { chipsRef, multiple } = React.use(ComboboxContext);
  const anchor = anchorProp ?? (multiple ? chipsRef : undefined);

  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        collisionAvoidance={collisionAvoidance}
        className="z-130 select-none"
        data-slot="combobox-positioner"
        side={side}
        sideOffset={sideOffset}
      >
        <span
          className={cn(
            "level-float relative flex max-h-(--available-height) min-w-(--anchor-width) max-w-(--available-width) origin-(--transform-origin) transition duration-150 ease-out",
            className,
          )}
        >
          <ComboboxPrimitive.Popup
            // Electron drag hit-testing ignores z-index; items over a drag region would swallow clicks.
            className="flex min-w-0 max-h-92 flex-1 flex-col overflow-hidden text-ink-1 app-region-no-drag"
            data-slot="combobox-popup"
            {...props}
          >
            {children}
          </ComboboxPrimitive.Popup>
        </span>
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

function ComboboxItem({
  className,
  children,
  hideIndicator: _hideIndicator = false,
  selectedFill = true,
  ...props
}: ComboboxPrimitive.Item.Props & {
  hideIndicator?: boolean;
  /** Off for rows that mark selection themselves, so a fill only means hover or highlight. */
  selectedFill?: boolean;
}) {
  return (
    <ComboboxPrimitive.Item
      className={cn(
        "nest-row flex min-h-8 in-data-[side=none]:min-w-(--anchor-width) items-center cursor-pointer py-1 text-body outline-none not-data-disabled:hover:bg-tint-2 data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-selected:text-ink-1 data-highlighted:bg-tint-2 data-highlighted:text-accent-foreground [&[data-highlighted][data-selected]]:bg-tint-2 [&[data-highlighted][data-selected]]:text-accent-foreground data-disabled:opacity-64 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        selectedFill && "data-selected:bg-tint-1",
        className,
      )}
      data-slot="combobox-item"
      {...props}
    >
      <div
        className="flex min-w-0 flex-1 items-center gap-2 [&_svg:not([class*='text-'])]:text-ink-2"
        data-slot="combobox-item-content"
      >
        {children}
      </div>
    </ComboboxPrimitive.Item>
  );
}

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      className={cn("not-empty:nest-box text-center text-base text-ink-2 sm:text-body", className)}
      data-slot="combobox-empty"
      {...props}
    />
  );
}

function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props) {
  return (
    <ScrollArea scrollbarGutter scrollFade>
      <ComboboxPrimitive.List
        className={cn("not-empty:scroll-py-2 not-empty:nest-box", className)}
        data-slot="combobox-list"
        {...props}
      />
    </ScrollArea>
  );
}

/** Omits ScrollArea when an external virtualizer owns scrolling. */
function ComboboxListVirtualized({ className, ...props }: ComboboxPrimitive.List.Props) {
  return (
    <ComboboxPrimitive.List
      className={cn("size-full min-w-0 not-empty:nest-box", className)}
      data-slot="combobox-list"
      {...props}
    />
  );
}

function ComboboxClear({ className, ...props }: ComboboxPrimitive.Clear.Props) {
  return <ComboboxPrimitive.Clear className={className} data-slot="combobox-clear" {...props} />;
}

function ComboboxStatus({ className, ...props }: ComboboxPrimitive.Status.Props) {
  return (
    <ComboboxPrimitive.Status
      className={cn("px-2 py-2 font-medium text-ink-2 text-meta empty:m-0 empty:p-0", className)}
      data-slot="combobox-status"
      {...props}
    />
  );
}

const useComboboxFilter = ComboboxPrimitive.useFilter;

export {
  Combobox,
  ComboboxInput,
  ComboboxSearchInput,
  ComboboxTrigger,
  ComboboxPopup,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxList,
  ComboboxListVirtualized,
  ComboboxClear,
  ComboboxStatus,
  useComboboxFilter,
};
