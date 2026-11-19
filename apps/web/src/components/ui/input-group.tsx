import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "~/lib/utils";
import { Input, type InputProps } from "~/components/ui/input";

const inputGroupVariants = cva(
  "relative inline-flex w-full min-w-0 items-center [&_[data-slot=input-control]>input]:-my-px text-base text-ink-1 ring-ring/24 transition-shadow has-[input:focus-visible,textarea:focus-visible]:has-[input[aria-invalid],textarea[aria-invalid]]:border-destructive/64 has-[input:focus-visible,textarea:focus-visible]:has-[input[aria-invalid],textarea[aria-invalid]]:ring-destructive/16 has-[textarea]:h-auto has-data-[align=block-end]:h-auto has-data-[align=block-start]:h-auto has-data-[align=block-end]:flex-col has-data-[align=block-start]:flex-col has-[input:focus-visible,textarea:focus-visible]:border-ring has-[input[aria-invalid],textarea[aria-invalid]]:border-destructive/36 has-[input:disabled,textarea:disabled]:opacity-64 has-[input:disabled,textarea:disabled,input:focus-visible,textarea:focus-visible,input[aria-invalid],textarea[aria-invalid]]:shadow-none has-[input:focus-visible,textarea:focus-visible]:ring-3 has-[input:focus-visible,textarea:focus-visible]:ring-inset sm:text-body dark:has-[input[aria-invalid],textarea[aria-invalid]]:ring-destructive/24 has-data-[align=inline-start]:**:[[data-size=sm]_input]:ps-2 has-data-[align=inline-end]:**:[[data-size=sm]_input]:pe-2 *:[[data-slot=input-control],[data-slot=textarea-control]]:contents *:[[data-slot=input-control],[data-slot=textarea-control]]:before:hidden has-[[data-align=block-start],[data-align=block-end]]:**:[input]:h-auto has-data-[align=inline-start]:**:[input]:ps-2 has-data-[align=inline-end]:**:[input]:pe-2 has-data-[align=block-end]:**:[input]:pt-2 has-data-[align=block-start]:**:[input]:pb-2 **:[textarea]:min-h-20 **:[textarea]:resize-none **:[textarea]:py-3 **:[textarea]:max-sm:min-h-24 **:[textarea_button]:rounded-inherit",
  {
    defaultVariants: {
      variant: "default",
      size: "default",
    },
    variants: {
      size: {
        default: null,
        lg: "h-9",
      },
      variant: {
        default:
          "rounded-row border border-transparent bg-tint-1 before:pointer-events-none before:absolute before:inset-0 before:rounded-inherit",
        popover:
          "level-float has-[input:focus-visible,textarea:focus-visible]:ring-0 has-[input:focus-visible,textarea:focus-visible]:border-foreground/18",
        ghost:
          "rounded-row border border-transparent bg-transparent hover:bg-tint-1 has-[input:focus-visible,textarea:focus-visible]:bg-tint-1",
      },
    },
  },
);

function InputGroup({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupVariants>) {
  return (
    <div
      className={cn(inputGroupVariants({ variant, size }), className)}
      data-slot="input-group"
      role="group"
      {...props}
    />
  );
}

const inputGroupAddonVariants = cva(
  "flex h-auto cursor-text select-none items-center justify-center gap-2 leading-none [&>kbd]:rounded-chip in-[[data-slot=input-group]:has([data-slot=input-control],[data-slot=textarea-control])]:[&_svg:not([class*='size-'])]:size-4 sm:in-[[data-slot=input-group]:has([data-slot=input-control],[data-slot=textarea-control])]:[&_svg:not([class*='size-'])]:size-4 not-has-[button]:**:[svg:not([class*='opacity-'])]:opacity-80",
  {
    defaultVariants: {
      align: "inline-start",
    },
    compoundVariants: [
      {
        align: "inline-end",
        inset: "pill",
        className: "has-[>button]:me-0 pe-1 [[data-size=sm]+&]:pe-1",
      },
      {
        align: "inline-start",
        inset: "pill",
        className: "has-[>button]:ms-0 ps-1 [[data-size=sm]+&]:ps-1",
      },
    ],
    variants: {
      inset: {
        default: null,
        pill: null,
      },
      align: {
        "block-end":
          "order-last w-full justify-start px-3 pb-3 [.border-t]:pt-3 [[data-size=sm]+&]:px-3",
        "block-start":
          "order-first w-full justify-start px-3 pt-3 [.border-b]:pb-3 [[data-size=sm]+&]:px-3",
        "inline-end":
          "has-[>:last-child[data-slot=badge]]:-me-2 has-[>button]:-me-2 order-last pe-3 has-[>kbd:last-child]:-me-2 [[data-size=sm]+&]:pe-3",
        "inline-start":
          "has-[>:last-child[data-slot=badge]]:-ms-2 has-[>button]:-ms-2 order-first ps-3 has-[>kbd:last-child]:-ms-2 [[data-size=sm]+&]:ps-3",
      },
    },
  },
);

function InputGroupAddon({
  className,
  align = "inline-start",
  inset,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      className={cn(inputGroupAddonVariants({ align, inset }), className)}
      data-align={align}
      data-slot="input-group-addon"
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        const target = e.target as HTMLElement;
        const isInteractive = target.closest(
          "button, a, input, select, textarea, [role='button'], [role='combobox'], [role='listbox'], [data-slot='select-trigger']",
        );
        if (isInteractive) return;
        e.preventDefault();
        const parent = e.currentTarget.parentElement;
        const input = parent?.querySelector<HTMLInputElement | HTMLTextAreaElement>(
          "input, textarea",
        );
        if (input && !parent?.querySelector("input:focus, textarea:focus")) {
          input.focus();
        }
      }}
      {...props}
    />
  );
}

function InputGroupInput({ className, ...props }: InputProps) {
  return <Input className={className} unstyled {...props} />;
}

export { InputGroup, InputGroupAddon, InputGroupInput };
