import { useState, type ReactNode } from "react";
import {
  BellIcon,
  BoldIcon,
  ChevronRightIcon,
  CopyIcon,
  FolderIcon,
  GitBranchIcon,
  InboxIcon,
  InfoIcon,
  ItalicIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  TrashIcon,
  UnderlineIcon,
} from "lucide-react";

import { isElectron } from "../env";
import { cn } from "../lib/utils";
import ChatMarkdown from "./ChatMarkdown";
import { ConversationBackdrop } from "./chat/ConversationBackdrop";
import { SettingsGroup } from "./settings/SettingsGroup";
import { SettingsRow } from "./settings/settingsLayout";
import { WorkspaceBreadcrumb, WorkspaceBreadcrumbItem } from "./WorkspaceBreadcrumb";
import { WorkspacePageHeader } from "./WorkspacePageHeader";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "./ui/collapsible";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "./ui/empty";
import { Group, GroupSeparator } from "./ui/group";
import { Input } from "./ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";
import { Kbd, KbdGroup } from "./ui/kbd";
import { Label } from "./ui/label";
import {
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuShortcut,
  MenuSub,
  MenuSubPopup,
  MenuSubTrigger,
  MenuTrigger,
} from "./ui/menu";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "./ui/number-field";
import { Popover, PopoverPopup, PopoverTitle, PopoverTrigger } from "./ui/popover";
import { PreviewCard, PreviewCardPopup, PreviewCardTrigger } from "./ui/preview-card";
import { Radio, RadioGroup } from "./ui/radio-group";
import {
  Select,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import { Sheet, SheetDescription, SheetHeader, SheetPopup, SheetTitle } from "./ui/sheet";
import { Skeleton } from "./ui/skeleton";
import { Spinner } from "./ui/spinner";
import { Switch } from "./ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Textarea } from "./ui/textarea";
import { toastManager } from "./ui/toast";
import { Toggle } from "./ui/toggle";
import { Toggle as GroupToggle, ToggleGroup } from "./ui/toggle-group";
import { Tooltip, TooltipPopup, TooltipTrigger } from "./ui/tooltip";

// Every shared control on one page, so a theme can be judged in one place. Reach it at /ui-lab.

const BUTTON_VARIANTS = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "ghost-muted",
  "destructive",
  "destructive-outline",
  "ghost-destructive",
  "warning-outline",
  "link",
] as const;

const BADGE_VARIANTS = [
  "default",
  "secondary",
  "outline",
  "info",
  "success",
  "error",
  "destructive",
] as const;

const ALERT_VARIANTS = ["default", "info", "success", "warning", "error"] as const;

const TOAST_TYPES = ["success", "error", "info", "warning", "loading"] as const;

const MODELS = ["Opus 5.5", "Sonnet 5.5", "Haiku 5.5"];

const THREADS = [
  { title: "Fix login redirect", project: "web", status: "Working", age: "2m" },
  { title: "Darker poimandres theme", project: "t3code", status: "Settled", age: "1h" },
  { title: "Storybook build", project: "workspace", status: "Snoozed", age: "2d" },
];

const MARKDOWN = `## Markdown

Body text with **bold**, _italic_, \`inline code\` and a [link](https://example.com).

- A list item
- Another one with \`code\`
  - A nested item

1. First
2. Second

- [x] A done task
- [ ] An open task

> A blockquote, for when the agent quotes something.

| Column | Value |
| --- | --- |
| Theme | Poimandres |
| Radius | 18px |

\`\`\`ts
export function greet(name: string) {
  return \`Hello, \${name}\`;
}
\`\`\`
`;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-mono text-muted-foreground text-xs uppercase tracking-wider">{title}</h2>
      {children}
    </section>
  );
}

function Row({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center gap-2", className)}>{children}</div>;
}

export function UiLabPage() {
  const [model, setModel] = useState(MODELS[0]);
  const [compact, setCompact] = useState(true);
  const [sort, setSort] = useState("recent");
  const [effort, setEffort] = useState<number | null>(3);
  const [notes, setNotes] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [popupsPinned, setPopupsPinned] = useState(true);
  const [openPopup, setOpenPopup] = useState<string | null>(null);
  // Pinned popups ignore close requests, so clicking around the page doesn't dismiss them.
  const isPopupOpen = (key: string) => popupsPinned || openPopup === key;
  const onPopupOpenChange = (key: string) => (open: boolean) => {
    if (!popupsPinned) setOpenPopup(open ? key : null);
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <WorkspacePageHeader electron={isElectron} data-chat-header="">
        <WorkspaceBreadcrumb ariaLabel="UI lab breadcrumb">
          <WorkspaceBreadcrumbItem current>
            <h1 className="truncate">UI lab</h1>
          </WorkspaceBreadcrumbItem>
        </WorkspaceBreadcrumb>
      </WorkspacePageHeader>
      <div className="relative isolate flex min-h-0 min-w-0 flex-1">
        <ConversationBackdrop />
        <div className="scrollbar-gutter-both min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-8">
            <Section title="Buttons">
              <Row>
                {BUTTON_VARIANTS.map((variant) => (
                  <Button key={variant} variant={variant}>
                    {variant}
                  </Button>
                ))}
              </Row>
              <Row>
                <Button size="xs">Extra small</Button>
                <Button size="sm">Small</Button>
                <Button>Default</Button>
                <Button size="lg">Large</Button>
                <Button disabled>Disabled</Button>
                <Button variant="outline" disabled>
                  Disabled outline
                </Button>
                <Button variant="outline">
                  <PlusIcon />
                  With icon
                </Button>
              </Row>
              <Row>
                <Button size="icon" variant="ghost" aria-label="Settings">
                  <SettingsIcon />
                </Button>
                <Button size="icon" variant="outline" aria-label="Copy">
                  <CopyIcon />
                </Button>
                <Button size="icon-sm-pill" aria-label="Add">
                  <PlusIcon />
                </Button>
                <Button size="icon" variant="ghost-destructive" aria-label="Delete">
                  <TrashIcon />
                </Button>
                <Group>
                  <Button variant="outline">Commit</Button>
                  <GroupSeparator />
                  <Button variant="outline" size="icon" aria-label="More">
                    <ChevronRightIcon />
                  </Button>
                </Group>
                <Toggle aria-label="Bold">
                  <BoldIcon />
                </Toggle>
                <Toggle aria-label="Italic" defaultPressed>
                  <ItalicIcon />
                </Toggle>
                <Toggle aria-label="Underline">
                  <UnderlineIcon />
                </Toggle>
              </Row>
            </Section>

            <Section title="Badges and keys">
              <Row>
                {BADGE_VARIANTS.map((variant) => (
                  <Badge key={variant} variant={variant}>
                    {variant}
                  </Badge>
                ))}
              </Row>
              <Row>
                <KbdGroup>
                  <Kbd>⌘</Kbd>
                  <Kbd>K</Kbd>
                </KbdGroup>
                <Kbd>Esc</Kbd>
                <KbdGroup>
                  <Kbd>⇧</Kbd>
                  <Kbd>⌘</Kbd>
                  <Kbd>D</Kbd>
                </KbdGroup>
              </Row>
            </Section>

            <Section title="Fields">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="lab-name">Label</Label>
                  <Input id="lab-name" placeholder="Plain input" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="lab-disabled">Disabled</Label>
                  <Input id="lab-disabled" placeholder="Disabled input" disabled />
                </div>
                <InputGroup>
                  <InputGroupAddon>
                    <SearchIcon aria-hidden />
                  </InputGroupAddon>
                  <InputGroupInput aria-label="Search" placeholder="Input group with an icon" />
                </InputGroup>
                <InputGroup>
                  <InputGroupAddon>
                    <Spinner aria-hidden />
                  </InputGroupAddon>
                  <InputGroupInput aria-label="Loading search" placeholder="Searching…" />
                </InputGroup>
                <Select value={model} onValueChange={(next) => next && setModel(next)}>
                  <SelectTrigger aria-label="Model">
                    <SelectValue>{model}</SelectValue>
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectGroup>
                      <SelectGroupLabel>Claude</SelectGroupLabel>
                      {MODELS.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectPopup>
                </Select>
                <NumberField value={effort} min={0} max={10} onValueChange={setEffort}>
                  <NumberFieldGroup>
                    <NumberFieldDecrement aria-label="Decrease" />
                    <NumberFieldInput aria-label="Effort" />
                    <NumberFieldIncrement aria-label="Increase" />
                  </NumberFieldGroup>
                </NumberField>
              </div>
              <Textarea placeholder="Textarea, the caret should be fully visible here" />
            </Section>

            <Section title="Choices">
              <Row className="gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={compact} onCheckedChange={setCompact} />
                  Switch
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch disabled />
                  Disabled
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox defaultChecked />
                  Checkbox
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox />
                  Unchecked
                </label>
              </Row>
              <RadioGroup defaultValue="comfortable" className="flex flex-row">
                {["compact", "comfortable", "wide"].map((value) => (
                  <label key={value} className="flex items-center gap-2 text-sm">
                    <Radio value={value} />
                    {value}
                  </label>
                ))}
              </RadioGroup>
              <ToggleGroup defaultValue={["chat"]}>
                <GroupToggle value="chat">Chat</GroupToggle>
                <GroupToggle value="plan">Plan</GroupToggle>
                <GroupToggle value="review">Review</GroupToggle>
              </ToggleGroup>
            </Section>

            <Section title="Popovers">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={popupsPinned} onCheckedChange={setPopupsPinned} />
                Keep every popover open
              </label>
              {/* Each cell leaves room under its trigger, so the open popups don't overlap. */}
              <div className="grid gap-x-6 sm:grid-cols-2">
                <div className="h-96">
                  <Menu
                    open={isPopupOpen("menu")}
                    onOpenChange={onPopupOpenChange("menu")}
                    modal={false}
                  >
                    <MenuTrigger render={<Button variant="outline" />}>Menu</MenuTrigger>
                    <MenuPopup align="start">
                      <MenuGroup>
                        <MenuGroupLabel>Thread</MenuGroupLabel>
                        <MenuItem>
                          Rename
                          <MenuShortcut>⌘R</MenuShortcut>
                        </MenuItem>
                        <MenuItem>Duplicate</MenuItem>
                        <MenuCheckboxItem checked={compact} onCheckedChange={setCompact}>
                          Compact
                        </MenuCheckboxItem>
                      </MenuGroup>
                      <MenuSeparator />
                      <MenuGroup>
                        <MenuGroupLabel>Sort</MenuGroupLabel>
                        <MenuRadioGroup value={sort} onValueChange={setSort}>
                          <MenuRadioItem value="recent">Recent</MenuRadioItem>
                          <MenuRadioItem value="name">Name</MenuRadioItem>
                        </MenuRadioGroup>
                      </MenuGroup>
                      <MenuSeparator />
                      <MenuSub>
                        <MenuSubTrigger>Move to</MenuSubTrigger>
                        <MenuSubPopup>
                          <MenuItem>web</MenuItem>
                          <MenuItem>t3code</MenuItem>
                        </MenuSubPopup>
                      </MenuSub>
                      <MenuItem variant="destructive">Delete</MenuItem>
                    </MenuPopup>
                  </Menu>
                </div>
                <div className="h-96">
                  <Select
                    value={model}
                    onValueChange={(next) => next && setModel(next)}
                    open={isPopupOpen("select")}
                    onOpenChange={onPopupOpenChange("select")}
                    modal={false}
                  >
                    <SelectTrigger className="w-48" aria-label="Model list">
                      <SelectValue>{model}</SelectValue>
                    </SelectTrigger>
                    <SelectPopup align="start" alignItemWithTrigger={false}>
                      <SelectGroup>
                        <SelectGroupLabel>Claude</SelectGroupLabel>
                        {MODELS.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectPopup>
                  </Select>
                </div>
                <div className="h-48">
                  <Popover
                    open={isPopupOpen("popover")}
                    onOpenChange={onPopupOpenChange("popover")}
                  >
                    <PopoverTrigger render={<Button variant="outline" />}>Popover</PopoverTrigger>
                    <PopoverPopup align="start" className="w-64">
                      <PopoverTitle>Popover title</PopoverTitle>
                      <p className="mt-1 text-muted-foreground text-sm">
                        Panels share the composer's surface.
                      </p>
                    </PopoverPopup>
                  </Popover>
                </div>
                <div className="h-48">
                  <PreviewCard open={isPopupOpen("card")} onOpenChange={onPopupOpenChange("card")}>
                    <PreviewCardTrigger render={<Button variant="outline" />}>
                      Hover card
                    </PreviewCardTrigger>
                    <PreviewCardPopup align="start" className="w-72">
                      <div className="p-3 text-sm">
                        <div className="text-muted-foreground text-xs">pingdotgg/t3code #36966</div>
                        <div className="mt-1">fix(mobile): color links in user messages</div>
                      </div>
                    </PreviewCardPopup>
                  </PreviewCard>
                </div>
                <div className="h-24">
                  <Tooltip
                    open={isPopupOpen("tooltip")}
                    onOpenChange={onPopupOpenChange("tooltip")}
                  >
                    <TooltipTrigger render={<Button variant="outline" />}>Tooltip</TooltipTrigger>
                    <TooltipPopup side="bottom">A pill tooltip</TooltipPopup>
                  </Tooltip>
                </div>
              </div>
            </Section>

            <Section title="Overlays">
              <Row>
                <Dialog>
                  <DialogTrigger render={<Button variant="outline" />}>Dialog</DialogTrigger>
                  <DialogPopup className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Dialog title</DialogTitle>
                      <DialogDescription>Dialogs float above every card.</DialogDescription>
                    </DialogHeader>
                    <DialogPanel>
                      <Input placeholder="Something to type" />
                    </DialogPanel>
                    <DialogFooter>
                      <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
                      <DialogClose render={<Button />}>Confirm</DialogClose>
                    </DialogFooter>
                  </DialogPopup>
                </Dialog>
                <Button variant="destructive-outline" onClick={() => setConfirmOpen(true)}>
                  Confirm dialog
                </Button>
                <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                  <AlertDialogPopup>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this thread?</AlertDialogTitle>
                      <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogClose render={<Button variant="ghost" />}>
                        Cancel
                      </AlertDialogClose>
                      <AlertDialogClose render={<Button variant="destructive" />}>
                        Delete
                      </AlertDialogClose>
                    </AlertDialogFooter>
                  </AlertDialogPopup>
                </AlertDialog>
                <Button variant="outline" onClick={() => setSheetOpen(true)}>
                  Sheet
                </Button>
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                  <SheetPopup side="right">
                    <SheetHeader>
                      <SheetTitle>Sheet</SheetTitle>
                      <SheetDescription>
                        Slides in from the edge on narrow windows.
                      </SheetDescription>
                    </SheetHeader>
                  </SheetPopup>
                </Sheet>
              </Row>
              <Row>
                {TOAST_TYPES.map((type) => (
                  <Button
                    key={type}
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      toastManager.add({
                        type,
                        title: `${type} toast`,
                        description: "Toasts stack in the corner.",
                      })
                    }
                  >
                    <BellIcon />
                    {type}
                  </Button>
                ))}
              </Row>
            </Section>

            <Section title="Settings rows">
              <SettingsGroup>
                <SettingsRow
                  title="Notes"
                  description="A settings row with a switch, like the ones in Settings."
                  control={<Switch checked={notes} onCheckedChange={setNotes} />}
                />
                <SettingsRow
                  title="Default model"
                  description="A row with a select."
                  control={
                    <Select value={model} onValueChange={(next) => next && setModel(next)}>
                      <SelectTrigger size="sm" className="w-36" aria-label="Default model">
                        <SelectValue>{model}</SelectValue>
                      </SelectTrigger>
                      <SelectPopup align="end" alignItemWithTrigger={false}>
                        {MODELS.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectPopup>
                    </Select>
                  }
                />
                <SettingsRow
                  title="Danger"
                  description="A row with a button."
                  control={
                    <Button size="sm" variant="destructive-outline">
                      Reset
                    </Button>
                  }
                />
              </SettingsGroup>
            </Section>

            <Section title="Lists">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thread</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Age</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {THREADS.map((thread) => (
                    <TableRow key={thread.title}>
                      <TableCell>{thread.title}</TableCell>
                      <TableCell>{thread.project}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{thread.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{thread.age}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm">
                  <FolderIcon className="size-4 text-muted-foreground" />
                  Collapsible section
                </CollapsibleTrigger>
                <CollapsiblePanel>
                  <div className="flex flex-col gap-1 py-2 ps-6 text-muted-foreground text-sm">
                    <span className="flex items-center gap-2">
                      <GitBranchIcon className="size-3.5" />
                      dither
                    </span>
                    <span className="flex items-center gap-2">
                      <GitBranchIcon className="size-3.5" />
                      main
                    </span>
                  </div>
                </CollapsiblePanel>
              </Collapsible>
              <Separator />
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <InboxIcon />
                  </EmptyMedia>
                  <EmptyTitle>Nothing here yet</EmptyTitle>
                  <EmptyDescription>An empty state, for lists with no items.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </Section>

            <Section title="Feedback">
              {ALERT_VARIANTS.map((variant) => (
                <Alert key={variant} variant={variant}>
                  <InfoIcon />
                  <AlertTitle>{variant} alert</AlertTitle>
                  <AlertDescription>Alerts sit inside cards, not on the frame.</AlertDescription>
                </Alert>
              ))}
              <Row>
                <Spinner />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
              </Row>
            </Section>

            <Section title="Chat surfaces">
              <div
                className="ml-auto max-w-sm rounded-2xl border px-4 py-3 text-sm"
                data-user-message-bubble=""
              >
                A user message bubble.
              </div>
              <ChatMarkdown text={MARKDOWN} cwd={undefined} />
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
