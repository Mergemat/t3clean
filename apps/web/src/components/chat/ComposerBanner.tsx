import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { ChevronDownIcon, XIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";

export type ComposerBannerVariant = "default" | "error" | "info" | "success" | "warning";

/**
 * A drawer: an attached surface stands on the composer's top edge, behind the composer, so it is a
 * shade darker and has no bottom edge of its own. A detached one is a whole float of its own, for
 * a notice that sits apart from the composer.
 */
function Surface({
  variant = "default",
  detached = false,
  className,
  ...props
}: ComponentProps<"div"> & {
  variant?: ComposerBannerVariant;
  detached?: boolean;
}) {
  return (
    <div
      data-composer-banner-surface={detached ? "detached" : "attached"}
      data-variant={variant}
      className={cn(
        "relative isolate",
        detached
          ? "level-chat"
          : // oxlint-disable-next-line t3code/one-look-per-level -- the drawer's bottom joins the composer's top edge, so it drops its bottom corners and edge
            "level-chat rounded-b-none border-b-0",
        className,
      )}
      {...props}
    />
  );
}

function Attachment({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="composer-banner-attachment"
      className={cn(
        "mx-(--chat-composer-drawer-inset)",
        "[&+[data-slot=composer-banner-attachment]_[data-composer-banner-surface=attached]]:before:rounded-none [&+[data-slot=composer-banner-attachment]_[data-composer-banner-surface=attached]]:before:border-t-0",
        className,
      )}
      {...props}
    />
  );
}

function Dock({ className, ...props }: ComponentProps<"div">) {
  return (
    <Attachment
      className={cn(
        "flex items-end gap-1 not-has-data-[composer-banner-surface=attached]:hidden",
        className,
      )}
      {...props}
    />
  );
}

function Column({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col empty:hidden",
        "[&>[data-slot=composer-banner-attachment]]:mx-0 [&>[data-slot=composer-banner-attachment]:last-child]:mb-0",
        className,
      )}
      {...props}
    />
  );
}

function Root({
  className,
  density = "default",
  variant = "default",
  width = "fill",
  ...props
}: ComponentProps<typeof Surface> & {
  density?: "default" | "comfortable" | "spacious";
  width?: "fill" | "content";
}) {
  return (
    <Surface
      className={cn(
        "min-w-0 px-1 py-1 text-meta",
        density === "comfortable" && "py-2",
        density === "spacious" && "px-2 py-2",
        width === "content" ? "w-fit max-w-full flex-none" : "@container",
        className,
      )}
      data-slot="composer-banner"
      data-composer-banner-width={width}
      variant={variant}
      {...props}
    />
  );
}

function Row({
  className,
  render,
  layout = "inline",
  ...props
}: useRender.ComponentProps<"div"> & {
  layout?: "inline" | "wrap-actions" | "approval";
}) {
  // A button row is its drawer's handle: the drawer is the thing you press, so hover lights the
  // label instead of drawing a box inside it.
  const rowProps = {
    className: cn(
      "group/banner-row grid min-h-(--composer-banner-icon-column) w-full min-w-0 grid-cols-(--grid-lead-trail) items-center gap-x-1 text-start",
      "not-has-[>[data-slot=composer-banner-actions]]:grid-cols-(--grid-lead)",
      "[&:is(button)]:cursor-pointer [&:is(button)]:rounded-box [&:is(button):hover_:is([data-slot=composer-banner-icon],[data-slot=composer-banner-content],[data-slot=composer-banner-content]_*)]:text-ink-1 [&:is(button)]:focus-visible:outline-2 [&:is(button)]:focus-visible:-outline-offset-2 [&:is(button)]:focus-visible:outline-ring",
      layout === "wrap-actions" && "flex flex-wrap *:data-[slot=composer-banner-content]:grow",
      layout === "approval" && "items-start gap-x-2 gap-y-2",
      className,
    ),
    "data-composer-banner-row": "true",
    "data-composer-banner-layout": layout,
  };
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(rowProps, props),
  });
}

function Icon({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="composer-banner-icon"
      className={cn(
        "col-start-1 row-start-1 flex w-(--composer-banner-icon-column) min-w-0 flex-none items-center justify-center text-ink-2 [&>svg]:size-3",
        "group-data-[composer-banner-layout=approval]/banner-row:pt-1 group-data-[composer-banner-layout=approval]/banner-row:text-warning group-data-[composer-banner-layout=approval]/banner-row:[&>svg]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function Content({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="composer-banner-content"
      className={cn(
        "col-start-2 row-start-1 flex min-w-0 items-center gap-1 *:data-[slot=composer-banner-separator]:mx-0",
        "@max-[560px]:group-data-[composer-banner-layout=approval]/banner-row:col-end-4",
        "group-not-has-[>[data-slot=composer-banner-icon]]/banner-row:col-start-1 group-not-has-[>[data-slot=composer-banner-icon]]/banner-row:col-end-3 group-not-has-[>[data-slot=composer-banner-icon]]/banner-row:ps-2 sm:group-not-has-[>[data-slot=composer-banner-icon]]/banner-row:ps-2",
        "group-not-has-[>[data-slot=composer-banner-icon],>[data-slot=composer-banner-actions]]/banner-row:pe-2 sm:group-not-has-[>[data-slot=composer-banner-icon],>[data-slot=composer-banner-actions]]/banner-row:pe-2",
        className,
      )}
      {...props}
    />
  );
}

function Separator() {
  return (
    <span
      aria-hidden
      data-slot="composer-banner-separator"
      className="mx-1 inline-block flex-none text-ink-3"
    >
      ·
    </span>
  );
}

function Actions({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="composer-banner-actions"
      className={cn(
        "col-start-3 row-start-1 flex flex-wrap items-center justify-end gap-1",
        "group-data-[composer-banner-layout=approval]/banner-row:self-center group-data-[composer-banner-layout=approval]/banner-row:gap-2 @max-[560px]:group-data-[composer-banner-layout=approval]/banner-row:col-start-2 @max-[560px]:group-data-[composer-banner-layout=approval]/banner-row:col-end-4 @max-[560px]:group-data-[composer-banner-layout=approval]/banner-row:row-start-2",
        "group-data-[composer-banner-layout=wrap-actions]/banner-row:ms-auto",
        className,
      )}
      {...props}
    />
  );
}

function Children({ className, render, ...props }: useRender.ComponentProps<"div">) {
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(
      { className: cn("grid gap-px [&_[data-composer-banner-row]]:min-h-5", className) },
      props,
    ),
  });
}

function Scroll({ className, children, ...props }: ComponentProps<typeof ScrollArea>) {
  return (
    <ScrollArea radius="none" scrollFade className={cn("h-auto max-h-96", className)} {...props}>
      {}
      <div className="[[data-has-overflow-y]>&]:pe-2">{children}</div>
    </ScrollArea>
  );
}

function Count({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex min-w-(--composer-banner-icon-column,1em) flex-none justify-center font-medium text-ink-2 tabular-nums",
        className,
      )}
      {...props}
    />
  );
}

function Body({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("min-w-0 ps-8 sm:ps-8", className)} {...props} />;
}

function Dot({ className, ...props }: ComponentProps<"span">) {
  return <span className={cn("size-2 flex-none rounded-full bg-current", className)} {...props} />;
}

function ToggleIcon({ expanded }: { expanded: boolean }) {
  return (
    <Button
      render={<span aria-hidden />}
      size="icon-xs"
      variant="ghost"
      tabIndex={-1}
      className="pointer-events-none"
    >
      <ChevronDownIcon className={cn("size-4", !expanded && "rotate-180")} />
    </Button>
  );
}

function Dismiss({ className, children, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button size="icon-xs" variant="ghost" className={className} {...props}>
      {children ?? <XIcon className="size-4" />}
    </Button>
  );
}

export const ComposerBanner = {
  Surface,
  Attachment,
  Dock,
  Column,
  Root,
  Row,
  Icon,
  Content,
  Separator,
  Actions,
  Children,
  Scroll,
  Count,
  Body,
  Dot,
  ToggleIcon,
  Dismiss,
};
