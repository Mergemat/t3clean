import type { ReactNode } from "react";

import { Label } from "./label";

/** A field is a settings row: its name (and what it means) on the left, its control on the
 *  right. A control that needs the width (the prompt) sits under its name instead. */
export function Field({
  label,
  hint,
  htmlFor,
  stacked = false,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  htmlFor?: string;
  stacked?: boolean;
  children: ReactNode;
}) {
  if (stacked) {
    return (
      <div className="flex flex-col gap-1">
        <div className="px-2">
          <Label htmlFor={htmlFor} variant="row">
            {label}
          </Label>
        </div>
        {children}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 px-2 py-1 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <Label htmlFor={htmlFor} variant="row">
          {label}
        </Label>
        {hint ? <div className="text-meta text-ink-2">{hint}</div> : null}
      </div>
      <div className="flex min-w-0 shrink-0 items-center gap-2 sm:max-w-64 sm:justify-end">
        {children}
      </div>
    </div>
  );
}

/** A group of fields under a section label, like a settings section. */
export function FieldGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex h-8 items-end px-2 pb-1 text-meta font-medium text-ink-2">{label}</div>
      {children}
    </div>
  );
}
