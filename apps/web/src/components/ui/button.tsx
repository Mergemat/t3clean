import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "~/lib/utils";

const buttonVariants = cva(
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-row border font-medium text-base outline-none transition [&:not([aria-haspopup]):not(:disabled):not([aria-disabled=true])]:will-change-transform [&:active:not([aria-haspopup])]:scale-97 before:pointer-events-none before:absolute before:inset-0 before:rounded-inherit pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-64 aria-disabled:cursor-not-allowed aria-disabled:opacity-64 sm:text-body [&_svg:not([class*='text-'])]:text-(--control-icon-color) [&_svg:not([class*='size-'])]:size-4 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    compoundVariants: [
      { size: "sm", wrap: true, className: "min-h-8 py-1" },
      { size: "default", wrap: true, className: "min-h-9 py-2" },
      { size: "lg", wrap: true, className: "min-h-10 py-2" },
    ],
    variants: {
      size: {
        // shadcn's sizes, one ladder for text and icon buttons: 24, 32, 36, 40 (DESIGN.md).
        xs: "h-6 gap-1 px-2 text-meta [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-2 px-3",
        default: "h-9 gap-2 px-4",
        lg: "h-10 gap-2 px-6",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        icon: "size-9",
        "icon-lg": "size-10",
      },
      // Long labels wrap: the size's height becomes its minimum.
      wrap: {
        true: "h-auto whitespace-normal",
      },
      variant: {
        default:
          "border-primary bg-primary text-primary-foreground [:hover,[data-pressed]]:bg-primary/90",
        destructive:
          "border-destructive bg-destructive text-white [:hover,[data-pressed]]:bg-destructive/90",
        "destructive-outline": "raised border-transparent text-destructive-foreground",
        ghost: "border-0 text-ink-1 [:hover,[data-pressed]]:bg-tint-2",
        "ghost-muted":
          "border-0 text-ink-2 [:hover,[data-pressed]]:bg-tint-2 [:hover,[data-pressed]]:text-ink-1",
        "ghost-destructive":
          "border-0 text-ink-2 [:hover,[data-pressed]]:bg-tint-2 [:hover,[data-pressed]]:text-destructive",
        glass: "level-float text-ink-1",
        link: "border-0 underline-offset-4 [:hover,[data-pressed]]:underline",
        "media-close": "level-float text-ink-1",
        "media-navigation":
          "absolute top-1/2 z-20 -translate-y-1/2 border-0 text-white/90 [:hover,[data-pressed]]:bg-white/10 [:hover,[data-pressed]]:text-white focus-visible:ring-white focus-visible:ring-offset-transparent",
        outline: "raised border-transparent text-ink-1",
        overlay: "border-0 bg-black/70 text-white/65 [:hover,[data-pressed]]:bg-black/90",
        secondary:
          "border-0 bg-secondary text-secondary-foreground [:hover,[data-pressed]]:bg-secondary/90",
        "warning-outline":
          "border-warning/32 bg-warning-surface text-warning-foreground [:hover,[data-pressed]]:border-warning/40 [:hover,[data-pressed]]:bg-warning/16 dark:[:hover,[data-pressed]]:bg-warning/24",
      },
    },
  },
);

type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>;

interface ButtonProps extends useRender.ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  wrap?: boolean;
}

function Button({ className, variant, size, wrap, render, ...props }: ButtonProps) {
  const typeValue: React.ButtonHTMLAttributes<HTMLButtonElement>["type"] = render
    ? undefined
    : "button";

  const defaultProps = {
    className: cn(buttonVariants({ className, size, variant, wrap })),
    "data-slot": "button",
    "data-size": size ?? "default",
    "data-variant": variant ?? "default",
    type: typeValue,
  };

  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(defaultProps, props),
    render,
  });
}

export { Button, buttonVariants, type ButtonSize, type ButtonVariant };

const inlineButtonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center font-medium underline-offset-2 text-center whitespace-nowrap hover:underline focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-64",
  {
    defaultVariants: { tone: "default" },
    variants: {
      touchTarget: {
        padded: "pointer-coarse:min-h-11 pointer-coarse:px-2",
      },
      tone: {
        default: "text-ink-1",
        muted: "text-ink-2 hover:text-ink-1",
        destructive: "text-destructive/80 hover:text-destructive",
        picker:
          "gap-1 text-ink-1 decoration-from-font underline-offset-4 data-popup-open:underline",
      },
    },
  },
);

export function InlineButton({
  className,
  tone,
  touchTarget,
  render,
  ...props
}: useRender.ComponentProps<"button"> & VariantProps<typeof inlineButtonVariants>) {
  const defaultProps = {
    className: cn(inlineButtonVariants({ tone, touchTarget }), className),
    "data-slot": "inline-button",
    type: render ? undefined : ("button" as const),
  };
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(defaultProps, props),
    render,
  });
}
