import { T, useGT, Var } from "gt-react";
import { type ComponentProps, type ReactNode, type RefObject } from "react";

import { Command, CommandFooter, CommandInput, CommandPanel } from "./ui/command";

/**
 * A view replacing another inside an open dialog mounts with focus on the body,
 * left there by the removed input. Claim it so typing cannot reach the composer
 * behind the modal. On first open the dialog's own initial focus handles it.
 */
function claimFocusInOpenDialog(input: HTMLInputElement) {
  const active = input.ownerDocument.activeElement;
  if (
    active === null ||
    active === input.ownerDocument.body ||
    input.closest('[role="dialog"]')?.contains(active)
  ) {
    input.focus();
  }
}

export interface PendingInputSelection {
  readonly value: string;
  readonly start: number | null;
  readonly end: number | null;
  readonly direction: "forward" | "backward" | "none" | null;
}

function restorePendingSelection(
  input: HTMLInputElement,
  pendingSelectionRef: RefObject<PendingInputSelection | null> | undefined,
) {
  const selection = pendingSelectionRef?.current;
  if (!pendingSelectionRef || !selection) return;
  pendingSelectionRef.current = null;
  if (input.value !== selection.value) return;
  input.setSelectionRange(selection.start, selection.end, selection.direction ?? undefined);
}

type CommandPaletteContentProps = Omit<ComponentProps<typeof Command>, "children"> & {
  readonly children: ReactNode;
  readonly footerActionLabel?: ReactNode;
  readonly footerTrailing?: ReactNode;
  readonly inputAccessory?: ReactNode;
  readonly inputProps: ComponentProps<typeof CommandInput>;
  readonly pendingSelectionRef?: RefObject<PendingInputSelection | null>;
  readonly panelSize?: "list" | "tall-list" | "fill";
  readonly testId?: string;
};

export function CommandPaletteContent({
  children,
  footerActionLabel,
  footerTrailing,
  inputAccessory,
  inputProps,
  pendingSelectionRef,
  panelSize = "list",
  testId,
  ...commandProps
}: CommandPaletteContentProps) {
  const gt = useGT();
  // Callers pass translated labels, so plain Select is matched in the viewer's language.
  const showsEnter = footerActionLabel !== undefined && footerActionLabel !== gt("Select");
  return (
    <div className="contents" data-testid={testId}>
      <Command {...commandProps}>
        <div className="relative">
          <CommandInput
            autoFocus={false}
            {...inputProps}
            ref={(input) => {
              if (!input) return;
              restorePendingSelection(input, pendingSelectionRef);
              claimFocusInOpenDialog(input);
            }}
          />
          {inputAccessory}
        </div>
        <CommandPanel
          className={
            panelSize === "fill"
              ? "flex min-h-0 flex-1 flex-col"
              : panelSize === "tall-list"
                ? "max-h-136"
                : "flex max-h-112 min-h-0 flex-col"
          }
        >
          {children}
        </CommandPanel>
        {/* Only what this step adds: navigating and closing work the same everywhere and the
            search field's arrow already says Back, so the footer names Enter's action when it
            isn't plain "Select", and any trailing action or status; with none, no footer. */}
        {showsEnter || footerTrailing ? (
          <CommandFooter className="max-sm:flex-col max-sm:items-start">
            <span className="flex min-w-0 flex-wrap items-center gap-x-4">
              {showsEnter ? (
                <span>
                  <T>
                    Enter to <Var>{footerActionLabel}</Var>
                  </T>
                </span>
              ) : null}
            </span>
            {footerTrailing}
          </CommandFooter>
        ) : null}
      </Command>
    </div>
  );
}
