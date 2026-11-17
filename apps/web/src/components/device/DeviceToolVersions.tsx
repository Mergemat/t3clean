import type { ReactNode } from "react";
import type { DeviceToolVersions as ToolVersions } from "@t3tools/contracts";
import { InlineButton } from "~/components/ui/button";
import { Popover, PopoverPopup, PopoverTitle, PopoverTrigger } from "~/components/ui/popover";

export function DeviceToolVersions({
  tools,
  action,
  kind,
  owner,
  error,
}: {
  tools: ToolVersions | undefined;
  action?: ReactNode;
  kind?: keyof ToolVersions;
  owner?: string | undefined;
  error?: string | undefined;
}) {
  const selected = kind ? tools?.[kind] : undefined;
  const version =
    selected?.runningVersion ??
    (selected?.installedVersions.includes(selected.requiredVersion)
      ? selected.requiredVersion
      : selected?.installedVersions
          .toSorted((a, b) => a.localeCompare(b, undefined, { numeric: true }))
          .at(-1));
  const label = kind === "hub" ? "Device hub" : "Agent device";
  return (
    <Popover>
      <PopoverTrigger
        aria-label={
          kind
            ? `${label}: ${version ? `version ${version}` : selected ? "not installed" : "version unknown"}. Show details`
            : undefined
        }
        render={<InlineButton tone="muted" />}
      >
        {kind
          ? version
            ? `v${version}`
            : selected
              ? "Not installed"
              : "Version unknown"
          : error
            ? "Versions unavailable"
            : "Versions"}
      </PopoverTrigger>
      <PopoverPopup align="end" width="md">
        <PopoverTitle>{kind ? label : "Device tools"}</PopoverTitle>
        {tools ? (
          <div className="mt-2 flex flex-col gap-6">
            {(
              [
                ["Device hub", tools.hub],
                ["Agent device", tools.agent],
              ] as const
            )
              .filter(([name]) => !kind || name === label)
              .map(([name, tool]) => (
                <div key={name} className="space-y-2">
                  {!kind ? <p className="text-meta font-medium">{name}</p> : null}
                  <dl className="grid grid-cols-(--grid-lead) gap-x-6 gap-y-1 text-meta">
                    <dt className="text-ink-2">Running</dt>
                    <dd className="text-right font-mono">{tool.runningVersion ?? "Not running"}</dd>
                    <dt className="text-ink-2">Required</dt>
                    <dd className="text-right font-mono">{tool.requiredVersion}</dd>
                    <dt className="text-ink-2">Installed</dt>
                    <dd className="text-right font-mono break-words">
                      {tool.installedVersions.join(", ") || "None"}
                    </dd>
                  </dl>
                </div>
              ))}
          </div>
        ) : (
          <p className="mt-2 text-meta text-ink-2">Versions have not been checked.</p>
        )}
        <p className="mt-6 text-meta text-ink-2">
          {owner ? `Managed by ${owner}. ` : ""}Tools update automatically on this host when needed.
        </p>
        {error ? (
          <p role="status" className="mt-2 text-meta text-destructive">
            {error}
          </p>
        ) : null}
        {action ? <div className="mt-2">{action}</div> : null}
      </PopoverPopup>
    </Popover>
  );
}
