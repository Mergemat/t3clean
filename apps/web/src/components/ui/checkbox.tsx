import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";

import { cn } from "~/lib/utils";

const rootClassName =
  "relative inline-flex size-4 shrink-0 items-center justify-center rounded-chip border border-transparent not-data-checked:dent outline-none transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-chip focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-ring aria-invalid:border-destructive/36 focus-visible:aria-invalid:border-destructive/64 focus-visible:aria-invalid:outline-destructive/48 data-disabled:opacity-64 sm:size-4 dark:focus-visible:aria-invalid:outline-destructive/24";

const indicatorClassName =
  "-inset-px absolute flex items-center justify-center rounded-chip text-primary-foreground data-unchecked:hidden data-checked:bg-primary data-indeterminate:text-ink-1 in-[[data-slot=checkbox]:focus-visible]:inset-ring-3 in-[[data-slot=checkbox]:focus-visible]:inset-ring-background in-[[data-slot=checkbox]:focus-visible]:outline-2 in-[[data-slot=checkbox]:focus-visible]:outline-solid in-[[data-slot=checkbox]:focus-visible]:-outline-offset-2 in-[[data-slot=checkbox]:focus-visible]:outline-inherit";

const variantClassNames = {
  default: "",
  contrast: "border-foreground/55",
};

type CheckboxVariant = keyof typeof variantClassNames;

function Checkbox({
  className,
  variant = "default",
  ...props
}: CheckboxPrimitive.Root.Props & { variant?: CheckboxVariant }) {
  return (
    <CheckboxPrimitive.Root
      className={cn(rootClassName, variantClassNames[variant], className)}
      data-slot="checkbox"
      {...props}
    >
      {/* Keep an inner gap in the focus outline. Explicit glyph colors resist row icon-muting rules. */}
      <CheckboxPrimitive.Indicator
        className={indicatorClassName}
        data-slot="checkbox-indicator"
        render={(props, state) => (
          <span {...props}>
            {state.indeterminate ? (
              <svg
                className="size-4 text-current sm:size-3"
                fill="none"
                height="24"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                viewBox="0 0 24 24"
                width="24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M5.252 12h13.496" />
              </svg>
            ) : (
              <svg
                className="size-4 text-current sm:size-3"
                fill="none"
                height="24"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                viewBox="0 0 24 24"
                width="24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M5.252 12.7 10.2 18.63 18.748 5.37" />
              </svg>
            )}
          </span>
        )}
      />
    </CheckboxPrimitive.Root>
  );
}

// Checkbox's look without its hidden input, for a row that is itself the button.
function CheckboxMark({
  checked,
  variant = "default",
}: {
  checked: boolean;
  variant?: CheckboxVariant;
}) {
  const state = checked ? { "data-checked": "" } : { "data-unchecked": "" };
  return (
    <span
      aria-hidden
      className={cn(rootClassName, variantClassNames[variant])}
      data-slot="checkbox"
      {...state}
    >
      <span className={indicatorClassName} data-slot="checkbox-indicator" {...state}>
        <svg
          className="size-4 text-current sm:size-3"
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M5.252 12.7 10.2 18.63 18.748 5.37" />
        </svg>
      </span>
    </span>
  );
}

export { Checkbox, CheckboxMark };
