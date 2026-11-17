import {
  ArrowUpIcon,
  ChevronDownIcon,
  CopyIcon,
  GitBranchIcon,
  InboxIcon,
  PaperclipIcon,
  PencilIcon,
  SearchIcon,
  TrashIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../lib/utils";

// Screens built only from rings: nest-region, nest-box, nest-row and nest-text. No padding or radius
// is chosen here; with the grid shown, every inset is shaded by the ring that makes it.

function Row({
  icon: Icon,
  label,
  meta,
  active,
}: {
  icon?: LucideIcon;
  label: ReactNode;
  meta?: string;
  active?: boolean;
}) {
  return (
    <div className={cn("nest-row flex h-8 items-center text-body", active && "bg-foreground/8")}>
      {Icon ? <Icon className="size-4 shrink-0 text-ink-2" /> : null}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {meta ? <span className="shrink-0 text-meta text-ink-3">{meta}</span> : null}
    </div>
  );
}

function Label({ children }: { children: string }) {
  return <div className="nest-text flex h-6 items-center text-meta text-ink-3">{children}</div>;
}

function Sidebar() {
  return (
    <div className="nest-region flex w-72 shrink-0 flex-col gap-6 bg-(--surface-fill)">
      <Row icon={SearchIcon} label={<span className="text-ink-3">Search</span>} />
      <div className="flex flex-col">
        <Label>Working</Label>
        <Row icon={InboxIcon} label="Fix login redirect" meta="2m" active />
        <Row icon={InboxIcon} label="Darker poimandres theme" meta="1h" />
      </div>
      <div className="flex flex-col">
        <Label>Settled</Label>
        <Row icon={InboxIcon} label="Storybook build" meta="2d" />
        <Row icon={InboxIcon} label="Upgrade ESLint" meta="4d" />
      </div>
    </div>
  );
}

function Pane() {
  return (
    <div className="nest-region flex min-w-80 flex-1 flex-col gap-6 border border-(--level-line) bg-(--window-fill)">
      <div className="nest-text flex flex-col gap-1 pt-2">
        <h3 className="text-title">Fix login redirect</h3>
        <span className="text-meta text-ink-2">web · feat/auth · 2m ago</span>
      </div>
      <div className="nest-box ms-auto max-w-sm border border-(--level-line) bg-(--window-content-fill)">
        <p className="nest-text text-body">A stale session lands on a blank page.</p>
      </div>
      <div className="flex flex-col gap-2">
        <p className="nest-text text-body">
          Moved the redirect into the auth guard, so a stale session lands on sign in.
        </p>
        <div className="nest-box flex flex-col border border-(--level-line) bg-(--window-content-fill)">
          <Row label={<span className="text-heading">2 changed files</span>} />
          <Row label="src/auth/guard.ts" meta="+42 −9" />
          <Row label="src/routes/login.tsx" meta="+6 −2" />
        </div>
      </div>
      <div className="nest-box flex flex-col gap-2 border border-(--level-line) bg-(--window-content-fill)">
        <p className="nest-text pt-2 text-body text-ink-3">Ask anything</p>
        <div className="nest-row flex h-8 items-center">
          <PaperclipIcon className="size-4 text-ink-2" />
          <span className="ms-auto flex size-6 items-center justify-center rounded-full bg-message-action text-message-action-foreground">
            <ArrowUpIcon className="size-4" />
          </span>
        </div>
      </div>
    </div>
  );
}

function Setting({
  title,
  description,
  value,
}: {
  title: string;
  description: string;
  value: string;
}) {
  return (
    <div className="nest-row flex min-h-14 items-center justify-between py-2">
      <div className="flex min-w-0 flex-col">
        <span className="text-body">{title}</span>
        <span className="text-meta text-ink-2">{description}</span>
      </div>
      <span className="nest-row flex h-6 shrink-0 items-center border border-(--level-line) text-body">
        {value}
        <ChevronDownIcon className="size-4 text-ink-2" />
      </span>
    </div>
  );
}

function Settings() {
  return (
    <div className="flex min-w-80 flex-1 flex-col gap-2">
      {/* An unfilled ring: the heading nests like the card's rows, so their text shares a line. */}
      <div className="nest-box py-0">
        <h3 className="nest-text text-heading">Chat</h3>
      </div>
      <div className="nest-box flex flex-col border border-(--level-line) bg-card">
        <Setting title="Default model" description="New threads start on it." value="Opus 5.5" />
        <Setting title="Chat width" description="How wide the lane runs." value="Normal" />
      </div>
    </div>
  );
}

function Menu() {
  return (
    <div className="dropdown-glass nest-box flex w-60 shrink-0 flex-col">
      <Label>Thread</Label>
      <Row icon={PencilIcon} label="Rename" meta="⌘R" active />
      <Row icon={CopyIcon} label="Duplicate" />
      <Row icon={GitBranchIcon} label="Branch from here" />
      <Row icon={TrashIcon} label="Delete" />
    </div>
  );
}

export function LabScreens() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start gap-2">
        <Sidebar />
        <Pane />
      </div>
      <div className="flex flex-wrap items-start gap-2">
        <Settings />
        <Menu />
      </div>
    </div>
  );
}
