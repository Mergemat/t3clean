import { SearchIcon } from "lucide-react";

import { Input, type InputProps } from "./input";
import { Spinner } from "./spinner";

/** A filter field drawn as a filled row of the list it filters: its edges where the rows' fills
 *  are, its icon on their icon column. Menus, comboboxes and settings lists share it. */
export function SearchField({
  busy = false,
  ...props
}: Omit<InputProps, "className" | "size" | "unstyled" | "nativeInput"> & {
  busy?: boolean;
}) {
  return (
    <div className="relative min-w-0 rounded-row bg-foreground/6 px-2 transition-colors focus-within:bg-foreground/9">
      {busy ? (
        <Spinner
          aria-hidden="true"
          size="md"
          tone="muted"
          className="pointer-events-none absolute top-2 left-2"
        />
      ) : (
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-2 left-2 size-4 shrink-0 text-ink-3"
        />
      )}
      <Input
        {...props}
        className="rounded-none bg-transparent text-body [&_input]:h-8 [&_input]:ps-6 [&_input]:font-sans [&_input]:leading-8"
        size="sm"
        unstyled
      />
    </div>
  );
}
