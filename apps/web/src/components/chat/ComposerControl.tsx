import { mergeProps } from "@base-ui/react/merge-props";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { useRender } from "@base-ui/react/use-render";
import type { ComponentType, SVGProps } from "react";

import { cn } from "~/lib/utils";

export type ComposerControlSize = "sm" | "xs";

function composerControlClassName(size: ComposerControlSize, className?: string) {
  return cn(
    "relative inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-row border border-transparent text-base outline-none hover:bg-tint-2 data-pressed:bg-tint-2 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-64 data-disabled:pointer-events-none data-disabled:opacity-64 pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-12 pointer-coarse:after:min-w-12 [&:active:not([aria-haspopup])]:scale-97 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg[data-composer-control-icon]]:mx-0",
    // A control holding only its icon is an icon button: the same 32 square (DESIGN.md).
    "has-[>[data-composer-control-icon]:only-child]:size-8 has-[>[data-composer-control-icon]:only-child]:px-0",
    "[&_:is([data-composer-control-label],[data-chat-provider-model-picker-label])]:text-box-trim supports-[text-box:trim-both_cap_alphabetic]:[&_:is([data-composer-control-label],[data-chat-provider-model-picker-label])]:py-2",
    size === "xs"
      ? "h-6 gap-1 has-[[data-composer-label]]:gap-2 px-2 font-normal text-ink-2 text-body hover:text-ink-1 dark:text-ink-2 sm:h-6 sm:text-meta [&_svg:not([class*='size-'])]:size-4 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:mx-0 [&_svg[data-composer-control-chevron]]:ms-0 [&_svg[data-composer-control-chevron]]:-me-1"
      : "h-8 gap-2 px-2 font-medium text-ink-2 [&_svg:not([class*='text-'])]:text-ink-2 hover:text-ink-1 sm:text-body [&_svg:not([class*='size-'])]:size-4 sm:[&_svg:not([class*='size-'])]:size-4",
    "aria-pressed:bg-tint-2 aria-pressed:text-accent-foreground",
    className,
  );
}

type ComposerControlProps = useRender.ComponentProps<"button"> & {
  size?: ComposerControlSize;
};

export function ComposerControl({
  className,
  size = "sm",
  render,
  ...props
}: ComposerControlProps) {
  const defaultProps = {
    className: composerControlClassName(size, className),
    type: render ? undefined : ("button" as const),
  };
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(defaultProps, props),
    render,
  });
}

export function ComposerControlIcon({
  icon: Icon,
  className,
  opticalSize = "default",
  size = "sm",
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  className?: string | undefined;
  opticalSize?: "default" | "large";
  size?: ComposerControlSize;
}) {
  return (
    <Icon
      aria-hidden="true"
      className={cn(
        "shrink-0",
        size === "xs" ? "size-3" : opticalSize === "large" ? "size-4" : "size-4",
        className,
      )}
      data-composer-control-icon
    />
  );
}

export function ComposerSelectControl({
  className,
  children,
  size = "sm",
  ...props
}: Omit<SelectPrimitive.Trigger.Props, "className"> & {
  className?: string | undefined;
  size?: ComposerControlSize;
}) {
  return (
    <SelectPrimitive.Trigger className={composerControlClassName(size, className)} {...props}>
      {children}
    </SelectPrimitive.Trigger>
  );
}
