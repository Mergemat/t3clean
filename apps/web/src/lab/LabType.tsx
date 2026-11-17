import { cn } from "../lib/utils";
import { px, useComputed } from "./labKit";

const ROLES = [
  { name: "title", cls: "text-title", sample: "Settle the thread" },
  { name: "heading", cls: "text-heading", sample: "Version control" },
  { name: "body", cls: "text-body", sample: "Moved the redirect into the auth guard." },
  { name: "meta", cls: "text-meta text-ink-2", sample: "feat/auth · 2m ago" },
] as const;

const INKS = [
  { name: "ink-1", cls: "text-ink-1", use: "what you read" },
  { name: "ink-2", cls: "text-ink-2", use: "what supports it" },
  { name: "ink-3", cls: "text-ink-3", use: "what you can ignore" },
] as const;

function Role({ role }: { role: (typeof ROLES)[number] }) {
  const [sizeRef, size] = useComputed<HTMLParagraphElement>("font-size");
  const [lineRef, line] = useComputed<HTMLParagraphElement>("line-height");
  return (
    <div className="grid grid-cols-(--grid-lead-trail) items-baseline gap-2">
      <span className="w-16 text-meta text-ink-2">{role.name}</span>
      <p
        ref={(node) => {
          sizeRef.current = node;
          lineRef.current = node;
        }}
        className={cn("truncate", role.cls)}
      >
        {role.sample}
      </p>
      <span className="text-meta tabular-nums text-ink-2">
        {px(size)} / {px(line)}
      </span>
    </div>
  );
}

export function LabType({ version }: { version: string }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        {ROLES.map((role) => (
          <Role key={`${role.name}:${version}`} role={role} />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {INKS.map((ink) => (
          <div key={ink.name} className="flex items-baseline gap-2">
            <span className="w-16 text-meta text-ink-2">{ink.name}</span>
            <span className={cn("text-body", ink.cls)}>{ink.use}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
