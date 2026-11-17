import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";

import { cn } from "~/lib/utils";

/** Marks the edges a virtualized list can scroll toward, for its `virtualized-scroll-fade` class. */
function virtualizedScrollFadeProps({ top, bottom }: { top: boolean; bottom: boolean }) {
  return {
    "data-overflow-y-start": top ? "" : undefined,
    "data-overflow-y-end": bottom ? "" : undefined,
  };
}

function ScrollArea({
  className,
  children,
  scrollFade = false,
  scrollFadePadding = true,
  scrollbarGutter = false,
  hideScrollbars = false,
  chainVerticalScroll = false,
  radius = "inherit",
  viewportTabIndex,
  ...props
}: ScrollAreaPrimitive.Root.Props & {
  scrollFade?: boolean;
  scrollFadePadding?: boolean;
  scrollbarGutter?: boolean;
  hideScrollbars?: boolean;
  chainVerticalScroll?: boolean;
  radius?: "inherit" | "none";
  viewportTabIndex?: number;
}) {
  return (
    <ScrollAreaPrimitive.Root
      className={cn(
        "relative size-full min-h-0 overflow-hidden",
        radius === "none" ? "rounded-none" : "rounded-inherit",
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        {...(viewportTabIndex === undefined ? {} : { tabIndex: viewportTabIndex })}
        className={cn(
          "h-full max-h-inherit overflow-auto overscroll-contain rounded-inherit outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background data-has-overflow-x:overscroll-x-contain",
          chainVerticalScroll && "overscroll-y-auto",
          scrollFade && "focus-visible:mask-none",
          scrollFade && scrollFadePadding && "scroll-p-(--fade-size)",
          scrollFade && !scrollFadePadding && "has-focus-visible:mask-none",
          scrollbarGutter && "scrollbar-gutter-stable",
          hideScrollbars && "scrollbar-none [&::-webkit-scrollbar]:hidden",
        )}
        data-scroll-fade={scrollFade || undefined}
        data-slot="scroll-area-viewport"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      {!hideScrollbars && (
        <>
          <ScrollBar orientation="vertical" />
          <ScrollBar orientation="horizontal" />
          <ScrollAreaPrimitive.Corner data-slot="scroll-area-corner" />
        </>
      )}
    </ScrollAreaPrimitive.Root>
  );
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      className={cn(
        "flex opacity-0 transition-opacity delay-300 data-[orientation=horizontal]:mx-1 data-[orientation=horizontal]:mb-px data-[orientation=horizontal]:h-2 data-[orientation=vertical]:my-1 data-[orientation=vertical]:mr-px data-[orientation=vertical]:w-2 data-[orientation=horizontal]:flex-col data-hovering:opacity-100 data-scrolling:opacity-100 data-hovering:delay-0 data-scrolling:delay-0 data-hovering:duration-100 data-scrolling:duration-100",
        className,
      )}
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        className="relative flex-1 rounded-full bg-(--app-scrollbar-thumb) transition-colors hover:bg-(--app-scrollbar-thumb-hover)"
        data-slot="scroll-area-thumb"
      />
    </ScrollAreaPrimitive.Scrollbar>
  );
}

export { ScrollArea, ScrollBar, virtualizedScrollFadeProps };
