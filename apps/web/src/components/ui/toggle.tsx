import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const toggleVariants = cva(
  "relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-row border font-medium text-base text-ink-1 outline-none transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-inherit pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 hover:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-64 aria-disabled:opacity-64 data-pressed:bg-input/64 data-pressed:text-accent-foreground sm:text-body [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-4 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        // The same ladder as Button: 32, 36, 40, and the matching squares.
        xs: "h-6 min-w-6 px-2 text-meta",
        sm: "h-8 min-w-8 px-3",
        default: "h-9 min-w-9 px-4",
        lg: "h-10 min-w-10 px-6",
        "icon-xs": "size-6",
        "icon-sm": "size-8",
        icon: "size-9",
        "icon-lg": "size-10",
        // A segment sits half a step inside its row-cornered track, so its corner is a chip.
        segmented: "h-6 min-w-0 rounded-chip px-3 text-meta before:rounded-inherit",
        "segmented-icon": "size-6 rounded-chip before:rounded-inherit",
      },
      variant: {
        default: "border-0",
        pill: "border-0 px-3 font-normal text-ink-2 data-pressed:text-ink-1",
        ghost:
          "border-0 text-ink-1 shadow-none [:disabled,:active,[data-pressed]]:shadow-none before:shadow-none data-pressed:bg-accent data-pressed:text-accent-foreground disabled:opacity-100 disabled:text-ink-2 disabled:[&_svg]:opacity-100",
        outline:
          "bg-foreground/6 border-transparent [:disabled,:active,[data-pressed]]:shadow-none",
        segmented:
          "border-0 text-ink-2 shadow-none transition-colors before:shadow-none hover:bg-background/55 hover:text-ink-1 not-data-pressed:data-highlighted:bg-background/55 data-highlighted:text-ink-1 data-pressed:bg-background data-pressed:text-ink-1 data-pressed:shadow-xs/10 dark:hover:bg-input/32 dark:not-data-pressed:data-highlighted:bg-input/32 dark:data-pressed:bg-input/72",
      },
    },
  },
);

function Toggle({
  className,
  variant,
  size,
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive
      className={cn(toggleVariants({ className, size, variant }))}
      data-slot="toggle"
      data-size={size ?? "default"}
      data-variant={variant ?? "default"}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
