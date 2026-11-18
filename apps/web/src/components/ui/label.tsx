import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";

import { cn } from "~/lib/utils";

function Label({
  className,
  render,
  variant = "default",
  ...props
}: useRender.ComponentProps<"label"> & {
  /** `row`: a field's name in a settings-style row, in the row's own type. */
  variant?: "default" | "row";
}) {
  const defaultProps = {
    className: cn(
      "inline-flex items-center gap-2 text-ink-1",
      variant === "row" ? "text-body" : "text-base/4.5 font-medium sm:text-body",
      className,
    ),
    "data-slot": "label",
  };

  return useRender({
    defaultTagName: "label",
    props: mergeProps<"label">(defaultProps, props),
    render,
  });
}

export { Label };
