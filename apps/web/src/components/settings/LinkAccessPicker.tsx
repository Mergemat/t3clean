import { AuthMcpClientAccess } from "@t3tools/contracts";
import { T, useMessages } from "gt-react";
import { useId } from "react";

import { accessConfig } from "../auth/ConnectAgentSurface";
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "../ui/select";

/** What agents here may do in an environment being linked, with what that does not allow. */
export function LinkAccessPicker({
  value,
  onChange,
  disabled = false,
}: {
  readonly value: AuthMcpClientAccess;
  readonly onChange: (access: AuthMcpClientAccess) => void;
  readonly disabled?: boolean;
}) {
  const labelId = useId();
  const m = useMessages();
  const selected = accessConfig[value];
  return (
    <div className="space-y-2">
      <span id={labelId} className="block text-meta font-medium">
        <T>What agents here may do there</T>
      </span>
      <Select
        value={value}
        disabled={disabled}
        onValueChange={(next) => {
          if (next !== null) onChange(next as AuthMcpClientAccess);
        }}
      >
        <SelectTrigger variant="ghost" aria-labelledby={labelId}>
          <SelectValue>
            <span className="flex items-center gap-2">
              <selected.icon aria-hidden className="size-4" />
              {m(selected.label)}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectPopup alignItemWithTrigger={false}>
          {AuthMcpClientAccess.literals.map((option) => {
            const { label, description, icon: Icon } = accessConfig[option];
            return (
              <SelectItem key={option} value={option} hideIndicator>
                <span className="grid min-w-0 py-1">
                  <span className="inline-flex items-center gap-2 font-medium text-ink-1">
                    <Icon aria-hidden className="size-4 shrink-0 text-ink-2" />
                    {m(label)}
                  </span>
                  <span className="text-meta leading-4 text-ink-2">{m(description)}</span>
                </span>
              </SelectItem>
            );
          })}
        </SelectPopup>
      </Select>
      <p className="text-meta text-ink-2">
        {m(selected.description)}{" "}
        <T>
          An agent never gets more access there than its own mode here. Below full access, it can
          change only threads this link started, not that machine's own threads, projects or
          settings.
        </T>
      </p>
    </div>
  );
}
