import { Autocomplete as AutocompletePrimitive } from "@base-ui/react/autocomplete";
import { ChevronsUpDownIcon, XIcon } from "lucide-react";

import { cn } from "~/lib/utils";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";

const Autocomplete = AutocompletePrimitive.Root;

function AutocompleteInput({
  className,
  showTrigger = false,
  showClear = false,
  startAddon,
  size,
  ...props
}: Omit<AutocompletePrimitive.Input.Props, "size"> & {
  showTrigger?: boolean;
  showClear?: boolean;
  startAddon?: React.ReactNode;
  size?: "sm" | "default" | "lg" | number;
  ref?: React.Ref<HTMLInputElement>;
}) {
  const sizeValue = (size ?? "default") as "sm" | "default" | "lg" | number;

  return (
    <div className="relative not-has-[>*.w-full]:w-fit w-full text-ink-1 has-disabled:opacity-64">
      {startAddon && (
        <div
          aria-hidden="true"
          className="pointer-events-none has-[button]:pointer-events-auto absolute inset-y-0 start-px z-10 flex items-center ps-3 opacity-80 has-[+[data-size=sm]]:ps-3 [&_svg:not([class*='size-'])]:size-4 sm:[&_svg:not([class*='size-'])]:size-4"
          data-slot="autocomplete-start-addon"
        >
          {startAddon}
        </div>
      )}
      <AutocompletePrimitive.Input
        className={cn(
          startAddon &&
            "data-[size=sm]:*:data-[slot=autocomplete-input]:ps-8 *:data-[slot=autocomplete-input]:ps-8 sm:data-[size=sm]:*:data-[slot=autocomplete-input]:ps-7 sm:*:data-[slot=autocomplete-input]:ps-8",
          sizeValue === "sm"
            ? "has-[+[data-slot=autocomplete-trigger],+[data-slot=autocomplete-clear]]:*:data-[slot=autocomplete-input]:pe-6"
            : "has-[+[data-slot=autocomplete-trigger],+[data-slot=autocomplete-clear]]:*:data-[slot=autocomplete-input]:pe-7",
          className,
        )}
        data-slot="autocomplete-input"
        render={<Input nativeInput size={sizeValue} />}
        {...props}
      />
      {showTrigger && (
        <AutocompleteTrigger
          className={cn(
            "-translate-y-1/2 absolute top-1/2 inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-row border border-transparent opacity-80 outline-none transition-colors pointer-coarse:after:absolute pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 hover:opacity-100 has-[+[data-slot=autocomplete-clear]]:hidden sm:size-7 [&_svg:not([class*='size-'])]:size-4 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
            sizeValue === "sm" ? "end-0" : "end-1",
          )}
        >
          <AutocompletePrimitive.Icon data-slot="autocomplete-icon">
            <ChevronsUpDownIcon />
          </AutocompletePrimitive.Icon>
        </AutocompleteTrigger>
      )}
      {showClear && (
        <AutocompleteClear
          className={cn(
            "-translate-y-1/2 absolute top-1/2 inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-row border border-transparent opacity-80 outline-none transition-colors pointer-coarse:after:absolute pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 hover:opacity-100 has-[+[data-slot=autocomplete-clear]]:hidden sm:size-7 [&_svg:not([class*='size-'])]:size-4 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
            sizeValue === "sm" ? "end-0" : "end-1",
          )}
        >
          <XIcon />
        </AutocompleteClear>
      )}
    </div>
  );
}

function AutocompletePopup({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  alignOffset,
  align = "start",
  anchor,
  ...props
}: AutocompletePrimitive.Popup.Props & {
  align?: AutocompletePrimitive.Positioner.Props["align"];
  sideOffset?: AutocompletePrimitive.Positioner.Props["sideOffset"];
  alignOffset?: AutocompletePrimitive.Positioner.Props["alignOffset"];
  side?: AutocompletePrimitive.Positioner.Props["side"];
  anchor?: AutocompletePrimitive.Positioner.Props["anchor"];
}) {
  return (
    <AutocompletePrimitive.Portal>
      <AutocompletePrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        className="z-130 select-none"
        data-slot="autocomplete-positioner"
        side={side}
        sideOffset={sideOffset}
      >
        <span
          className={cn(
            "relative flex max-h-(--available-height) min-w-(--anchor-width) max-w-(--available-width) origin-(--transform-origin) rounded-box dropdown-glass transition duration-150 ease-out before:pointer-events-none before:absolute before:inset-0 before:rounded-inherit before:shadow-edge-light dark:before:shadow-edge-dark",
            className,
          )}
        >
          <AutocompletePrimitive.Popup
            // Electron drag hit-testing ignores z-index; items over a drag region would swallow clicks.
            className="flex max-h-92 flex-1 flex-col text-ink-1 app-region-no-drag"
            data-slot="autocomplete-popup"
            {...props}
          >
            {children}
          </AutocompletePrimitive.Popup>
        </span>
      </AutocompletePrimitive.Positioner>
    </AutocompletePrimitive.Portal>
  );
}

function AutocompleteItem({ className, children, ...props }: AutocompletePrimitive.Item.Props) {
  return (
    <AutocompletePrimitive.Item
      className={cn(
        "nest-row flex min-h-6 items-center cursor-default select-none py-1 text-meta outline-none hover:bg-foreground/9 data-disabled:pointer-events-none data-selected:bg-foreground/8 data-selected:text-ink-1 data-highlighted:bg-foreground/9 data-highlighted:text-accent-foreground [&[data-highlighted][data-selected]]:bg-accent [&[data-highlighted][data-selected]]:text-accent-foreground data-disabled:opacity-64 [&_svg:not([class*='text-'])]:text-ink-2",
        className,
      )}
      data-slot="autocomplete-item"
      {...props}
    >
      {children}
    </AutocompletePrimitive.Item>
  );
}

function AutocompleteGroup({ className, ...props }: AutocompletePrimitive.Group.Props) {
  return (
    <AutocompletePrimitive.Group
      className={cn("[[role=group]+&]:mt-2", className)}
      data-slot="autocomplete-group"
      {...props}
    />
  );
}

const GROUP_LABEL_CLASS_NAME = "nest-text py-2 font-medium text-ink-2 text-meta";

function AutocompleteGroupLabel({ className, ...props }: AutocompletePrimitive.GroupLabel.Props) {
  return (
    <AutocompletePrimitive.GroupLabel
      className={cn(GROUP_LABEL_CLASS_NAME, className)}
      data-slot="autocomplete-group-label"
      {...props}
    />
  );
}

function AutocompleteListHeading({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(GROUP_LABEL_CLASS_NAME, className)}
      data-slot="autocomplete-group-label"
      role="presentation"
      {...props}
    />
  );
}

function AutocompleteListVirtualized({ className, ...props }: AutocompletePrimitive.List.Props) {
  return (
    <AutocompletePrimitive.List
      className={cn("size-full min-w-0", className)}
      data-slot="autocomplete-list"
      {...props}
    />
  );
}

function AutocompleteEmpty({ className, ...props }: AutocompletePrimitive.Empty.Props) {
  return (
    <AutocompletePrimitive.Empty
      className={cn("not-empty:nest-box text-center text-base text-ink-2 sm:text-body", className)}
      data-slot="autocomplete-empty"
      {...props}
    />
  );
}

function AutocompleteList({ className, ...props }: AutocompletePrimitive.List.Props) {
  return (
    // A flex column lets the viewport shrink with a height-capped parent instead of overflowing it.
    <ScrollArea className="flex flex-col" scrollbarGutter scrollFade>
      <AutocompletePrimitive.List
        className={cn("not-empty:scroll-py-2 not-empty:nest-box", className)}
        data-slot="autocomplete-list"
        {...props}
      />
    </ScrollArea>
  );
}

function AutocompleteClear({ className, ...props }: AutocompletePrimitive.Clear.Props) {
  return (
    <AutocompletePrimitive.Clear
      className={cn(
        "-translate-y-1/2 absolute end-1 top-1/2 inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-row border border-transparent opacity-80 outline-none transition pointer-coarse:after:absolute pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 hover:opacity-100 sm:size-7 [&_svg:not([class*='size-'])]:size-4 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      data-slot="autocomplete-clear"
      {...props}
    >
      <XIcon />
    </AutocompletePrimitive.Clear>
  );
}

function AutocompleteCollection({ ...props }: AutocompletePrimitive.Collection.Props) {
  return <AutocompletePrimitive.Collection data-slot="autocomplete-collection" {...props} />;
}

function AutocompleteTrigger({
  className,
  children,
  ...props
}: AutocompletePrimitive.Trigger.Props) {
  return (
    <AutocompletePrimitive.Trigger
      className={className}
      data-slot="autocomplete-trigger"
      {...props}
    >
      {children}
    </AutocompletePrimitive.Trigger>
  );
}

export {
  Autocomplete,
  AutocompleteInput,
  AutocompleteTrigger,
  AutocompletePopup,
  AutocompleteItem,
  AutocompleteGroup,
  AutocompleteGroupLabel,
  AutocompleteEmpty,
  AutocompleteList,
  AutocompleteListHeading,
  AutocompleteListVirtualized,
  AutocompleteClear,
  AutocompleteCollection,
};
