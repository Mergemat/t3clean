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

import { LabRow, LabSection } from "./labKit";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "../components/ui/collapsible";
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
} from "../components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../components/ui/empty";
import { Group, GroupSeparator } from "../components/ui/group";
import { Input } from "../components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "../components/ui/input-group";
import { Kbd, KbdGroup } from "../components/ui/kbd";
import { Label } from "../components/ui/label";
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
} from "../components/ui/menu";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "../components/ui/number-field";
import { Popover, PopoverPopup, PopoverTitle, PopoverTrigger } from "../components/ui/popover";
import { PreviewCard, PreviewCardPopup, PreviewCardTrigger } from "../components/ui/preview-card";
import { Radio, RadioGroup } from "../components/ui/radio-group";
import {
  Select,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetPopup,
  SheetTitle,
} from "../components/ui/sheet";
import { Skeleton } from "../components/ui/skeleton";
import { Spinner } from "../components/ui/spinner";
import { Switch } from "../components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Textarea } from "../components/ui/textarea";
import { toastManager } from "../components/ui/toast";
import { Toggle } from "../components/ui/toggle";
import { Toggle as GroupToggle, ToggleGroup } from "../components/ui/toggle-group";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../components/ui/tooltip";

// Every shared control, so a theme can be judged in one place.

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

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = title.toLowerCase().replaceAll(" ", "-");
  return (
    <LabSection id={id} title={title}>
      {children}
    </LabSection>
  );
}

const Row = LabRow;

export function LabComponents() {
  const [model, setModel] = useState(MODELS[0]);
  const [compact, setCompact] = useState(true);
  const [sort, setSort] = useState("recent");
  const [effort, setEffort] = useState<number | null>(3);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [popupsPinned, setPopupsPinned] = useState(false);
  const [openPopup, setOpenPopup] = useState<string | null>(null);
  // Pinned popups ignore close requests, so clicking around the page doesn't dismiss them.
  const isPopupOpen = (key: string) => popupsPinned || openPopup === key;
  const onPopupOpenChange = (key: string) => (open: boolean) => {
    if (!popupsPinned) setOpenPopup(open ? key : null);
  };

  return (
    <>
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
          <Button size="icon-sm" variant="ghost" aria-label="Settings">
            <SettingsIcon />
          </Button>
          <Button size="icon-sm" variant="outline" aria-label="Copy">
            <CopyIcon />
          </Button>
          <Button size="icon-sm" aria-label="Add">
            <PlusIcon />
          </Button>
          <Button size="icon-sm" variant="ghost-destructive" aria-label="Delete">
            <TrashIcon />
          </Button>
          <Group>
            <Button variant="outline">Commit</Button>
            <GroupSeparator />
            <Button variant="outline" size="icon-sm" aria-label="More">
              <ChevronRightIcon />
            </Button>
          </Group>
          <Toggle size="icon-sm" aria-label="Bold">
            <BoldIcon />
          </Toggle>
          <Toggle size="icon-sm" aria-label="Italic" defaultPressed>
            <ItalicIcon />
          </Toggle>
          <Toggle size="icon-sm" aria-label="Underline">
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
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="lab-name">Label</Label>
            <Input id="lab-name" placeholder="Plain input" />
          </div>
          <div className="flex flex-col gap-2">
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
        <Row className="gap-2">
          <label className="flex items-center gap-2 text-body">
            <Switch checked={compact} onCheckedChange={setCompact} />
            Switch
          </label>
          <label className="flex items-center gap-2 text-body">
            <Switch disabled />
            Disabled
          </label>
          <label className="flex items-center gap-2 text-body">
            <Checkbox defaultChecked />
            Checkbox
          </label>
          <label className="flex items-center gap-2 text-body">
            <Checkbox />
            Unchecked
          </label>
        </Row>
        <RadioGroup defaultValue="comfortable" className="flex flex-row">
          {["compact", "comfortable", "wide"].map((value) => (
            <label key={value} className="flex items-center gap-2 text-body">
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
        <label className="flex items-center gap-2 text-body">
          <Switch checked={popupsPinned} onCheckedChange={setPopupsPinned} />
          Keep every popover open
        </label>
        {/* Each cell leaves room under its trigger, so the open popups don't overlap. */}
        <div className="grid gap-x-6 sm:grid-cols-2">
          <div className="h-96">
            <Menu open={isPopupOpen("menu")} onOpenChange={onPopupOpenChange("menu")} modal={false}>
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
            <Popover open={isPopupOpen("popover")} onOpenChange={onPopupOpenChange("popover")}>
              <PopoverTrigger render={<Button variant="outline" />}>Popover</PopoverTrigger>
              <PopoverPopup align="start" className="w-64">
                <PopoverTitle>Popover title</PopoverTitle>
                <p className="mt-1 text-ink-2 text-body">Panels share the composer's surface.</p>
              </PopoverPopup>
            </Popover>
          </div>
          <div className="h-48">
            <PreviewCard open={isPopupOpen("card")} onOpenChange={onPopupOpenChange("card")}>
              <PreviewCardTrigger render={<Button variant="outline" />}>
                Hover card
              </PreviewCardTrigger>
              <PreviewCardPopup align="start" className="w-72">
                <div className="p-4 text-body">
                  <div className="text-ink-2 text-meta">pingdotgg/t3code #36966</div>
                  <div className="mt-1">fix(mobile): color links in user messages</div>
                </div>
              </PreviewCardPopup>
            </PreviewCard>
          </div>
          <div className="h-24">
            <Tooltip open={isPopupOpen("tooltip")} onOpenChange={onPopupOpenChange("tooltip")}>
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
                <AlertDialogClose render={<Button variant="ghost" />}>Cancel</AlertDialogClose>
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
                <SheetDescription>Slides in from the edge on narrow windows.</SheetDescription>
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
          <CollapsibleTrigger className="flex items-center gap-2 text-body">
            <FolderIcon className="size-4 text-ink-2" />
            Collapsible section
          </CollapsibleTrigger>
          <CollapsiblePanel>
            <div className="flex flex-col gap-1 py-2 ps-6 text-ink-2 text-body">
              <span className="flex items-center gap-2">
                <GitBranchIcon className="size-4" />
                dither
              </span>
              <span className="flex items-center gap-2">
                <GitBranchIcon className="size-4" />
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
    </>
  );
}
