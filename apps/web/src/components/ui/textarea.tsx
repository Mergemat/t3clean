import { Field as FieldPrimitive } from "@base-ui/react/field";
import { mergeProps } from "@base-ui/react/merge-props";
import type * as React from "react";

import { cn } from "~/lib/utils";

type TextareaProps = React.ComponentProps<"textarea"> & {
  size?: "sm" | "default" | "lg" | number;
  unstyled?: boolean;
};

function Textarea({
  className,
  size = "default",
  unstyled = false,
  rows,
  ...props
}: TextareaProps) {
  return (
    <span
      className={
        cn(
          !unstyled &&
            "relative inline-flex w-full rounded-row border border-transparent bg-foreground/6 text-base text-ink-1 ring-ring/24 transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-inherit has-focus-visible:has-aria-invalid:border-destructive/64 has-focus-visible:has-aria-invalid:ring-destructive/16 has-aria-invalid:border-destructive/36 has-focus-visible:border-ring has-disabled:opacity-64 has-[:disabled,:focus-visible,[aria-invalid]]:shadow-none has-focus-visible:ring-3 has-focus-visible:ring-inset sm:text-body dark:has-aria-invalid:ring-destructive/24",
          className,
        ) || undefined
      }
      data-size={size}
      data-slot="textarea-control"
    >
      <FieldPrimitive.Control
        render={(defaultProps) => (
          <textarea
            className={cn(
              // The control's border sits inside the field's height, so the whole control lands on the grid.
              "field-sizing-content -m-px max-h-64 w-full rounded-inherit px-3 py-2 outline-none wrap-anywhere",
              rows === undefined && "min-h-18 max-sm:min-h-20",
              size === "sm" && "px-3 py-1",
              size === "sm" && rows === undefined && "min-h-16 max-sm:min-h-20",
              size === "lg" && "py-2",
              size === "lg" && rows === undefined && "min-h-18 max-sm:min-h-22",
            )}
            // field-sizing: content ignores `rows`, so an explicit row count sets the minimum height.
            style={
              rows === undefined
                ? undefined
                : {
                    minHeight: `calc(${rows}lh + 2 * (var(--spacing) * ${size === "sm" ? 1 : size === "lg" ? 2 : 1.5} - 1px))`,
                  }
            }
            data-slot="textarea"
            rows={rows}
            {...mergeProps(defaultProps, props)}
          />
        )}
      />
    </span>
  );
}

export { Textarea, type TextareaProps };
