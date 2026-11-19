import {
  buildTraitsTriggerDisplay,
  getDescriptorStringValue,
  isReasoningControl,
  selectableProviderOptionChoices,
} from "@t3tools/client-runtime/model-traits";
import type { ProviderOptionDescriptor, RuntimeMode } from "@t3tools/contracts";
import type { EffortDisplay } from "@t3tools/contracts/settings";
import { getProviderOptionCurrentLabel } from "@t3tools/shared/model";
import { msg, T, useGT, useMessages } from "gt-react";
import { ChevronRightIcon, ChevronUpIcon, WorkflowIcon } from "lucide-react";
import { type KeyboardEvent, type ReactNode, useRef, useState } from "react";

import { m, type MessageResolver } from "~/i18n/messages";
import { cn } from "~/lib/utils";
import { Menu, MenuPopup, MenuRadioGroup, MenuRadioItem, MenuTrigger } from "../ui/menu";
import { Switch } from "../ui/switch";
import { Toggle, ToggleGroup } from "../ui/toggle-group";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../ui/tooltip";
import type { ComposerControlSize } from "./ComposerControl";
import { ComposerPermissionsSection, type RuntimeModeOption } from "./ComposerFooterControls";
import { composerFloatingLayerProps, focusCheckedPermission } from "./composerEventScope";
import { EffortGlyph, FastBolt, resolveEffortGlyph } from "./EffortGlyph";
import {
  getTraitsSectionVisibility,
  type TraitsSelectionInput,
  ULTRATHINK_IN_BODY_NOTE,
  useTraitsSelection,
} from "./TraitsPicker";

type SelectDescriptor = Extract<ProviderOptionDescriptor, { type: "select" }>;
type BooleanDescriptor = Extract<ProviderOptionDescriptor, { type: "boolean" }>;

/** Service tiers, Claude's Fast mode, and Ultracode sit in the footer, not the column. */
function splitSpeed(
  selects: ReadonlyArray<SelectDescriptor>,
  toggles: ReadonlyArray<BooleanDescriptor>,
) {
  const speedSelect = selects.find((descriptor) => descriptor.id === "serviceTier") ?? null;
  const fastToggle = toggles.find((descriptor) => descriptor.id === "fastMode") ?? null;
  const ultracodeToggle = toggles.find((descriptor) => descriptor.id === "ultracode") ?? null;
  return {
    speedSelect,
    fastToggle,
    ultracodeToggle,
    columnSelects: selects.filter((descriptor) => descriptor !== speedSelect),
    columnToggles: toggles.filter(
      (descriptor) => descriptor !== fastToggle && descriptor !== ultracodeToggle,
    ),
  };
}

type ColumnControl =
  | { kind: "select"; descriptor: SelectDescriptor }
  | { kind: "boolean"; descriptor: BooleanDescriptor };

/**
 * The column lists the model's reasoning levels under the header that names it. Other options,
 * such as an agent's session mode, sit below as one row each.
 */
function columnControls(
  selects: ReadonlyArray<SelectDescriptor>,
  toggles: ReadonlyArray<BooleanDescriptor>,
) {
  const { columnSelects, columnToggles } = splitSpeed(selects, toggles);
  const controls: ReadonlyArray<ColumnControl> = [
    ...columnSelects.map((descriptor) => ({ kind: "select" as const, descriptor })),
    ...columnToggles.map((descriptor) => ({ kind: "boolean" as const, descriptor })),
  ];
  const effort = controls.find((control) => isReasoningControl(control.descriptor)) ?? null;
  return { effort, others: controls.filter((control) => control !== effort) };
}

/**
 * What the model trigger shows after the model name: the effort word (or bars, per the
 * Appearance setting), a bolt for Fast, a workflow icon for Ultracode, and other traits such as a
 * context window.
 */
export function describeComposerEffort(
  traits: TraitsSelectionInput | null,
  effortDisplay: EffortDisplay,
  size: ComposerControlSize,
  resolve: MessageResolver = m,
): { suffix: ReactNode; detail: string | null } {
  if (!traits) return { suffix: null, detail: null };
  const visibility = getTraitsSectionVisibility({ ...traits, resolve });
  if (!visibility.hasAnyControls) return { suffix: null, detail: null };
  const modelSelection =
    traits.instanceId && traits.model
      ? { instanceId: traits.instanceId, model: traits.model, options: traits.modelOptions ?? [] }
      : null;
  const primary = visibility.primarySelectDescriptor;
  const display = buildTraitsTriggerDisplay(
    {
      descriptors: visibility.descriptors,
      primarySelectDescriptorId: primary?.id ?? null,
      ultrathinkPromptControlled: visibility.ultrathinkPromptControlled,
      modelSelection,
      reportedModelSelection: traits.reportedModelSelection,
    },
    resolve,
  );
  // The same reasoning control the column lists, wherever the agent put it among its options.
  const reasoning =
    columnControls(visibility.selectDescriptors, visibility.booleanDescriptors).effort
      ?.descriptor ?? null;
  const ultrathink = visibility.ultrathinkPromptControlled && reasoning === primary;
  const glyph =
    reasoning?.type === "select"
      ? resolveEffortGlyph(
          reasoning,
          ultrathink
            ? "ultrathink"
            : getDescriptorStringValue(reasoning, modelSelection, traits.reportedModelSelection),
        )
      : null;
  // Workflow levels such as Ultracode always show their name; the setting names every level.
  const word = glyph
    ? (glyph.special ?? (effortDisplay === "label" ? glyph.label : null))
    : !reasoning
      ? null
      : reasoning.type === "boolean"
        ? reasoning.currentValue === true
          ? resolve(msg("{option} On", { option: reasoning.label }))
          : resolve(msg("{option} Off", { option: reasoning.label }))
        : ultrathink
          ? "Ultrathink"
          : (getProviderOptionCurrentLabel(
              reasoning,
              modelSelection,
              traits.reportedModelSelection,
            ) ?? (reasoning.id === "thinking" ? reasoning.label : null));
  const fast = display.speedLabel === "Fast" || display.speedLabel === "Ultrafast";
  // Agent options such as modes live in the picker; the trigger adds only the context window.
  const contextWindow =
    visibility.contextWindowDescriptor &&
    getProviderOptionCurrentLabel(
      visibility.contextWindowDescriptor,
      modelSelection,
      traits.reportedModelSelection,
    );
  if (!word && !glyph && !fast && !display.ultracode && !contextWindow)
    return { suffix: null, detail: display.label };
  return {
    detail: display.label,
    suffix: (
      <span
        className={cn(
          "flex shrink-0 items-center gap-2 text-ink-2 group-hover/model-trigger:text-ink-1 group-data-pressed/model-trigger:text-ink-1 group-data-popup-open/model-trigger:text-ink-1",
          // A word space after the model name: the regular trigger's gap is wider than one.
          size === "sm" && "",
        )}
      >
        {word ? (
          <span data-composer-control-label className="max-w-24 truncate">
            {word}
          </span>
        ) : glyph ? (
          <EffortGlyph count={glyph.count} filled={glyph.filled} size={size} />
        ) : null}
        {fast ? <FastBolt ultra={display.speedLabel === "Ultrafast"} /> : null}
        {display.ultracode ? (
          <WorkflowIcon aria-hidden="true" data-composer-control-icon className="size-3" />
        ) : null}
        {contextWindow ? (
          <span
            // A label, so icon-only footers drop it; compacted rows drop it before the model.
            data-composer-control-label
            data-composer-secondary-trait
            className="max-w-24 truncate text-meta"
          >
            {contextWindow}
          </span>
        ) : null}
      </span>
    ),
  };
}

const COLUMN_ROW =
  "nest-row flex h-8 w-full shrink-0 cursor-pointer items-center text-left text-body text-ink-1 outline-none hover:bg-tint-2 focus-visible:bg-tint-2 disabled:cursor-not-allowed disabled:opacity-64";
const COLUMN_LABEL = "nest-text pt-2 pb-1 font-medium text-ink-2 text-meta";

function ColumnRow(props: {
  label: string;
  /** Shown on hover; the column is too narrow to print it under the label. */
  description?: string | undefined;
  selected: boolean;
  /** The column's one tab stop: the selected level, else the first when none shows as selected. */
  tabStop: boolean;
  isDefault?: boolean | undefined;
  disabled?: boolean;
  onPick: () => void;
}) {
  const gt = useGT();
  const rowProps = {
    type: "button",
    role: "radio",
    "aria-checked": props.selected,
    disabled: props.disabled,
    "data-effort-row": true,
    // Focus lands on a level after a model pick.
    "data-effort-level": true,
    // Up and Down move between rows.
    tabIndex: props.tabStop ? 0 : -1,
    className: cn(COLUMN_ROW, "group/level aria-checked:bg-tint-1"),
    onClick: props.onPick,
  } as const;
  const content = (
    <>
      <span className="min-w-0 flex-1 truncate">{props.label}</span>
      {props.selected ? (
        props.isDefault ? (
          <span className="sr-only">{gt("Default", { $context: "marks the default option" })}</span>
        ) : null
      ) : props.isDefault ? (
        // Shown on the row you point at; the column stays as narrow as its levels.
        <span className="text-ink-2 text-meta opacity-0 group-hover/level:opacity-100 group-focus-visible/level:opacity-100">
          {gt("Default", { $context: "marks the default option" })}
        </span>
      ) : null}
    </>
  );
  if (!props.description) return <button {...rowProps}>{content}</button>;
  return (
    <Tooltip>
      <TooltipTrigger render={<button {...rowProps} />}>{content}</TooltipTrigger>
      <TooltipPopup side="right" className="max-w-56">
        {props.description}
      </TooltipPopup>
    </Tooltip>
  );
}

function moveBetweenRows(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
  // An option's side menu is a React child here, but it moves through its own items.
  if (!event.currentTarget.contains(event.target as Node)) return;
  const rows = Array.from(
    event.currentTarget.querySelectorAll<HTMLButtonElement>("[data-effort-row]:not(:disabled)"),
  );
  const index = rows.findIndex((row) => row === document.activeElement);
  const next =
    rows[Math.min(rows.length - 1, Math.max(0, index + (event.key === "ArrowDown" ? 1 : -1)))];
  if (!next) return;
  event.preventDefault();
  event.stopPropagation();
  next.focus();
  next.scrollIntoView({ block: "nearest" });
}

function EffortLevels(props: { traits: TraitsSelectionInput }) {
  const traits = useTraitsSelection(props.traits);
  const { effort, others } = columnControls(traits.selectDescriptors, traits.booleanDescriptors);
  if (traits.modelIsUnavailable) {
    return (
      <>
        {traits.descriptors.map((descriptor) => {
          const value = traits.currentLabel(descriptor);
          return value ? (
            <div key={descriptor.id}>
              <div className={COLUMN_LABEL}>{descriptor.label}</div>
              <div className="nest-text pb-2 text-ink-2 text-meta">{value}</div>
            </div>
          ) : null;
        })}
      </>
    );
  }
  if (!effort && others.length === 0) return <NoEffortRow />;
  // Ultrathink in the prompt locks the levels; the first option then holds the tab stop.
  const locked =
    effort?.descriptor.id === traits.primarySelectDescriptor?.id && traits.ultrathinkInBodyText;
  return (
    <>
      {effort ? <EffortRows control={effort} traits={traits} locked={locked} /> : null}
      {others.length > 0 ? (
        <div className={cn("flex flex-col gap-1", effort && "pt-2")}>
          {others.map((control, index) =>
            control.kind === "boolean" ? (
              <OptionSwitchRow
                key={control.descriptor.id}
                descriptor={control.descriptor}
                traits={traits}
                tabStop={(!effort || locked) && index === 0}
              />
            ) : (
              <OptionMenuRow
                key={control.descriptor.id}
                descriptor={control.descriptor}
                traits={traits}
                tabStop={(!effort || locked) && index === 0}
              />
            ),
          )}
        </div>
      ) : null}
    </>
  );
}

type TraitsSelection = ReturnType<typeof useTraitsSelection>;

function EffortRows(props: { control: ColumnControl; traits: TraitsSelection; locked: boolean }) {
  const gt = useGT();
  const messages = useMessages();
  const { control, traits } = props;
  const { descriptor } = control;
  if (control.kind === "boolean") {
    return (
      <div role="radiogroup" aria-label={descriptor.label} className="flex flex-col gap-1">
        {([true, false] as const).map((value) => (
          <ColumnRow
            key={String(value)}
            label={
              value
                ? gt("On", { $context: "option state" })
                : gt("Off", { $context: "option state" })
            }
            selected={(control.descriptor.currentValue === true) === value}
            tabStop={(control.descriptor.currentValue === true) === value}
            onPick={() => traits.changeBoolean(descriptor.id, value)}
          />
        ))}
      </div>
    );
  }
  const { locked } = props;
  const value = traits.selectValue(control.descriptor);
  const choices = selectableProviderOptionChoices(control.descriptor);
  // An "Ultrathink:" prefix selects a level the column does not offer.
  const shown = choices.some((option) => option.id === value);
  return (
    <div role="radiogroup" aria-label={descriptor.label} className="flex flex-col gap-1">
      {locked ? (
        <div className="nest-text pb-2 text-ink-2 text-meta">
          {messages(ULTRATHINK_IN_BODY_NOTE)}
        </div>
      ) : null}
      {choices.map((option, index) => (
        <ColumnRow
          key={option.id}
          label={option.label}
          selected={option.id === value}
          tabStop={shown ? option.id === value : index === 0}
          description={option.description}
          isDefault={option.isDefault}
          disabled={locked}
          onPick={() => traits.changeSelect(control.descriptor, option.id)}
        />
      ))}
    </div>
  );
}

const OPTION_ROW = cn(COLUMN_ROW, "h-auto py-1");

/** An option's name over its current value. */
function OptionRowText(props: { label: string; value: string }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="truncate text-ink-2 text-meta">{props.label}</span>
      <span className="truncate">{props.value}</span>
    </span>
  );
}

/**
 * One select besides reasoning, such as an agent's session mode. It names the current choice and
 * opens the rest beside the column, so any number of options leaves the levels in place.
 */
function OptionMenuRow(props: {
  descriptor: SelectDescriptor;
  traits: TraitsSelection;
  /** Holds the column's tab stop when the model has no levels. */
  tabStop: boolean;
}) {
  const gt = useGT();
  const { descriptor, traits } = props;
  const [open, setOpen] = useState(false);

  const popupRef = useRef<HTMLDivElement>(null);
  const choices = selectableProviderOptionChoices(descriptor);
  const value = traits.selectValue(descriptor);
  const current = choices.find((choice) => choice.id === value)?.label ?? "";
  return (
    <Menu
      open={open}
      // A modal menu would cover the picker, so the next click there would only close it.
      modal={false}
      onOpenChange={setOpen}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) return;
        const checked = popupRef.current?.querySelector<HTMLElement>(
          '[role="menuitemradio"][aria-checked="true"]',
        );
        checked?.focus({ preventScroll: true });
        checked?.scrollIntoView({ block: "nearest" });
      }}
    >
      {/* No hover opening: an opened menu takes focus, which would steal typing from search. */}
      <MenuTrigger
        render={
          <button
            type="button"
            data-effort-row
            tabIndex={props.tabStop ? 0 : -1}
            aria-label={`${descriptor.label}: ${current}`}
            className={cn(OPTION_ROW, "data-popup-open:bg-tint-2")}
            onKeyDown={(event) => {
              if (event.key !== "ArrowRight") return;
              event.preventDefault();
              event.stopPropagation();
              setOpen(true);
            }}
          />
        }
      >
        <OptionRowText label={descriptor.label} value={current} />
        <ChevronRightIcon aria-hidden="true" className="-me-1 size-4 shrink-0 text-ink-2" />
      </MenuTrigger>
      <MenuPopup
        ref={popupRef}
        side="right"
        align="start"
        sideOffset={6}
        // A full-width column on phones leaves no room beside it, so fall below or above.
        collisionAvoidance={{ fallbackAxisSide: "end" }}
        className="max-w-72"
        data-model-picker-option-menu
        {...composerFloatingLayerProps}
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft") return;
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
        }}
      >
        <MenuRadioGroup
          aria-label={descriptor.label}
          value={value}
          onValueChange={(next: string) => {
            if (next !== value) traits.changeSelect(descriptor, next);
          }}
        >
          {choices.map((choice) => (
            <MenuRadioItem key={choice.id} value={choice.id} closeOnClick>
              <span className="flex items-center gap-2">
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate">{choice.label}</span>
                  {choice.description ? (
                    <span className="line-clamp-2 text-ink-2 text-meta">{choice.description}</span>
                  ) : null}
                </span>
                {choice.isDefault ? (
                  <span className="text-ink-2 text-meta">
                    {gt("Default", { $context: "marks the default option" })}
                  </span>
                ) : null}
              </span>
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuPopup>
    </Menu>
  );
}

/** A two-state option toggles in place; a menu would add a click for nothing. */
function OptionSwitchRow(props: {
  descriptor: BooleanDescriptor;
  traits: TraitsSelection;
  tabStop: boolean;
}) {
  const gt = useGT();
  const { descriptor, traits } = props;
  const checked = descriptor.currentValue === true;
  return (
    <label className={cn(OPTION_ROW, "has-focus-visible:bg-tint-2")}>
      <OptionRowText
        label={descriptor.label}
        value={
          checked ? gt("On", { $context: "option state" }) : gt("Off", { $context: "option state" })
        }
      />
      <Switch
        size="sm"
        checked={checked}
        onCheckedChange={(next) => traits.changeBoolean(descriptor.id, next)}
        aria-label={descriptor.label}
        data-effort-row
        tabIndex={props.tabStop ? 0 : -1}
      />
    </label>
  );
}

function NoEffortRow() {
  return (
    <div className="nest-row flex h-8 items-center text-ink-2 text-body">
      <T>No effort levels</T>
    </div>
  );
}

/** The model picker's effort column: the selected model's levels and its other options. */
export function ComposerEffortColumn(props: { traits: TraitsSelectionInput | null }) {
  const gt = useGT();
  const messages = useMessages();
  const visibility = props.traits
    ? getTraitsSectionVisibility({ ...props.traits, resolve: messages })
    : null;
  const controls =
    props.traits && visibility
      ? columnControls(visibility.selectDescriptors, visibility.booleanDescriptors)
      : null;
  return (
    <>
      {/* Sits in the search row's slot, so the first level lines up with the first model. */}
      <div className="shrink-0 px-2 pt-2">
        <div className="nest-text flex h-8 items-center font-medium text-ink-2 text-meta">
          {controls?.effort?.descriptor.label ??
            (controls?.others.length
              ? gt("Options", { $context: "heading for model options" })
              : gt("Effort", { $context: "heading for reasoning effort levels" }))}
        </div>
      </div>
      {/* pt-item puts the first level on the same line as the first model. */}
      <div
        className="nest-box flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain"
        // Capture, so Up and Down on an option row move rows instead of opening its menu.
        onKeyDownCapture={moveBetweenRows}
      >
        {props.traits ? <EffortLevels traits={props.traits} /> : <NoEffortRow />}
      </div>
    </>
  );
}

// The footer's choices are the app's segmented toggle group: 32 tall with an 8 corner, so it is
// concentric in the popup's corner, and one choice's options read as one shape.
function SpeedControl(props: { traits: TraitsSelectionInput }) {
  const gt = useGT();
  const traits = useTraitsSelection(props.traits);
  const { speedSelect, fastToggle } = splitSpeed(
    traits.selectDescriptors,
    traits.booleanDescriptors,
  );
  if (traits.modelIsUnavailable || (!speedSelect && !fastToggle)) return null;
  const options: ReadonlyArray<{
    id: string;
    label: string;
    /** The untranslated speed name that picks the bolt, when `label` is translated. */
    speed?: string;
    description?: string | undefined;
  }> = speedSelect
    ? selectableProviderOptionChoices(speedSelect)
    : [
        {
          id: "standard",
          speed: "Standard",
          label: gt("Standard", { $context: "response speed" }),
        },
        { id: "fast", speed: "Fast", label: gt("Fast", { $context: "response speed" }) },
      ];
  const value = speedSelect
    ? traits.selectValue(speedSelect)
    : fastToggle?.currentValue === true
      ? "fast"
      : "standard";
  return (
    <ToggleGroup
      aria-label={speedSelect?.label ?? fastToggle?.label}
      value={value === undefined ? [] : [value]}
      onValueChange={(next) => {
        const id = next[0];
        // A speed is always chosen, so pressing the current one again keeps it.
        if (id === undefined) return;
        if (speedSelect) traits.changeSelect(speedSelect, id);
        else if (fastToggle) traits.changeBoolean(fastToggle.id, id === "fast");
      }}
    >
      {options.map((option) => {
        const speed = option.speed ?? option.label;
        const content = (
          <>
            {speed === "Fast" || speed === "Ultrafast" ? (
              <FastBolt ultra={speed === "Ultrafast"} />
            ) : null}
            {option.label}
          </>
        );
        if (!option.description)
          return (
            <Toggle key={option.id} value={option.id}>
              {content}
            </Toggle>
          );
        return (
          <Tooltip key={option.id}>
            <TooltipTrigger render={<Toggle value={option.id} />}>{content}</TooltipTrigger>
            <TooltipPopup side="top">{option.description}</TooltipPopup>
          </Tooltip>
        );
      })}
    </ToggleGroup>
  );
}

function UltracodeControl(props: { traits: TraitsSelectionInput }) {
  const traits = useTraitsSelection(props.traits);
  const { ultracodeToggle } = splitSpeed(traits.selectDescriptors, traits.booleanDescriptors);
  if (traits.modelIsUnavailable || !ultracodeToggle) return null;
  return (
    <ToggleGroup
      aria-label={ultracodeToggle.label}
      value={ultracodeToggle.currentValue === true ? ["on"] : []}
      onValueChange={(next) => traits.changeBoolean(ultracodeToggle.id, next.includes("on"))}
    >
      <Toggle value="on">
        <WorkflowIcon aria-hidden="true" className="size-3" />
        {ultracodeToggle.label}
      </Toggle>
    </ToggleGroup>
  );
}

/** Permissions change rarely, so the footer names the mode and nests the choice in a menu. */
function PermissionsMenu(props: {
  runtimeMode: RuntimeMode;
  options: ReadonlyArray<RuntimeModeOption>;
  onChange: (mode: RuntimeMode) => void;
}) {
  const gt = useGT();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const current = props.options.find((option) => option.mode === props.runtimeMode);
  if (!current) return null;
  const CurrentIcon = current.icon;
  return (
    <Menu
      onOpenChangeComplete={(open) => {
        if (open) focusCheckedPermission(triggerRef.current);
      }}
    >
      <MenuTrigger
        render={
          <button
            ref={triggerRef}
            type="button"
            data-composer-permissions-trigger
            aria-label={gt("Permissions: {mode}", { mode: current.label })}

            className="ms-auto flex h-8 cursor-pointer items-center gap-2 rounded-row px-2 text-ink-2 text-body outline-none hover:bg-tint-2 hover:text-ink-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset data-popup-open:bg-tint-2 data-popup-open:text-ink-1"
          />
        }
      >
        <CurrentIcon aria-hidden="true" className="size-4" />
        {current.label}
        <ChevronUpIcon aria-hidden="true" className="size-4" />
      </MenuTrigger>
      <MenuPopup side="top" align="end" {...composerFloatingLayerProps}>
        <ComposerPermissionsSection
          runtimeMode={props.runtimeMode}
          runtimeModeOptions={props.options}
          onRuntimeModeChange={props.onChange}
        />
      </MenuPopup>
    </Menu>
  );
}

/** The model picker's footer: speed stays one click away, permissions sit one menu deeper. */
export function ComposerPickerFooter(props: {
  traits: TraitsSelectionInput | null;
  runtimeMode: RuntimeMode;
  runtimeModeOptions: ReadonlyArray<RuntimeModeOption>;
  onRuntimeModeChange: (mode: RuntimeMode) => void;
}) {
  return (
    // The float's inset on the sides and bottom keeps its corners concentric; a step more on top
    // parts these settings from the list they apply to.
    <div className="flex flex-wrap items-center gap-2 p-2 pt-4">
      {props.traits ? <SpeedControl traits={props.traits} /> : null}
      {props.traits ? <UltracodeControl traits={props.traits} /> : null}
      <PermissionsMenu
        runtimeMode={props.runtimeMode}
        options={props.runtimeModeOptions}
        onChange={props.onRuntimeModeChange}
      />
    </div>
  );
}
