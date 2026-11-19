import { useState } from "react";
import {
  DEFAULT_SNOOZE_PRESETS,
  MAX_SNOOZE_PRESET_MINUTES,
  MAX_SNOOZE_PRESETS,
  SnoozePresetDay,
  type SnoozePresetSetting,
} from "@t3tools/contracts/settings";
import { resolveSnoozePreset, snoozePresetId } from "@t3tools/client-runtime/state/thread-settled";
import * as Equal from "effect/Equal";
import * as Schema from "effect/Schema";
import { msg, T, useGT, useLocale, useMessages } from "gt-react";
import { PlusIcon, XIcon } from "lucide-react";

import { useNowMinute } from "../../hooks/useNowMinute";
import { reconcileSnoozeDraft, sortSnoozeRows } from "./SnoozePresetsSettings.logic";
import { formatShortTimestamp } from "../../timestampFormat";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Popover, PopoverPopup, PopoverTrigger } from "../ui/popover";
import { cn } from "~/lib/utils";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "../ui/number-field";
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "../ui/select";
import { Toggle, ToggleGroup } from "../ui/toggle-group";
import { SettingResetButton, SettingsRow } from "./settingsLayout";
import { useSearchableSetting } from "./settingsSearch";
import {
  useScopedSettings,
  useScopedSettingsMixed,
  useUpdateScopedSettings,
} from "./useScopedSettings";

const UNIT_MINUTES = { minutes: 1, hours: 60, days: 24 * 60 } as const;
type DurationUnit = keyof typeof UNIT_MINUTES;
const UNIT_LABELS: Record<DurationUnit, string> = {
  minutes: msg("{count, plural, one {minute} other {minutes}}"),
  hours: msg("{count, plural, one {hour} other {hours}}"),
  days: msg("{count, plural, one {day} other {days}}"),
};

const WHEN_LABELS: Record<"after" | "today" | "tomorrow", string> = {
  after: msg("In", { $context: "snooze for a duration, as in: In 2 hours" }),
  today: msg("Today"),
  tomorrow: msg("Tomorrow"),
};
// 2024-01-01 was a Monday.
const WEEKDAY_DATES: Record<Exclude<SnoozePresetDay, "today" | "tomorrow">, Date> = {
  monday: new Date(Date.UTC(2024, 0, 1)),
  tuesday: new Date(Date.UTC(2024, 0, 2)),
  wednesday: new Date(Date.UTC(2024, 0, 3)),
  thursday: new Date(Date.UTC(2024, 0, 4)),
  friday: new Date(Date.UTC(2024, 0, 5)),
  saturday: new Date(Date.UTC(2024, 0, 6)),
  sunday: new Date(Date.UTC(2024, 0, 7)),
};

function whenLabel(
  value: "after" | SnoozePresetDay,
  resolve: (message: string) => string,
  locale: string,
): string {
  if (value === "after" || value === "today" || value === "tomorrow") {
    return resolve(WHEN_LABELS[value]);
  }
  const name = new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(
    WEEKDAY_DATES[value],
  );
  return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
}

// Offered in order when adding, skipping any already in the list.
const ADD_CANDIDATES: ReadonlyArray<SnoozePresetSetting> = [
  ...DEFAULT_SNOOZE_PRESETS,
  { kind: "after", minutes: 30 },
  { kind: "at", day: "saturday", time: "09:00" },
  { kind: "after", minutes: 24 * 60 },
];

function splitMinutes(minutes: number): { amount: number; unit: DurationUnit } {
  if (minutes % UNIT_MINUTES.days === 0)
    return { amount: minutes / UNIT_MINUTES.days, unit: "days" };
  if (minutes % UNIT_MINUTES.hours === 0) {
    return { amount: minutes / UNIT_MINUTES.hours, unit: "hours" };
  }
  return { amount: minutes, unit: "minutes" };
}

function nextCandidate(presets: ReadonlyArray<SnoozePresetSetting>): SnoozePresetSetting {
  const used = new Set(presets.map(snoozePresetId));
  return (
    ADD_CANDIDATES.find((candidate) => !used.has(snoozePresetId(candidate))) ?? {
      kind: "after",
      minutes: 60,
    }
  );
}

// Row order is only display order, so it does not make a list differ from the defaults.
function sameSnoozePresets(
  left: ReadonlyArray<SnoozePresetSetting>,
  right: ReadonlyArray<SnoozePresetSetting>,
) {
  const ids = (presets: ReadonlyArray<SnoozePresetSetting>) =>
    presets.map(snoozePresetId).toSorted();
  return Equal.equals(ids(left), ids(right));
}

const isSnoozePresetDay = Schema.is(SnoozePresetDay);

interface KindMemory {
  readonly minutes: number;
  readonly time: string;
  readonly day: SnoozePresetDay;
}

function withWhen(
  preset: SnoozePresetSetting,
  when: string,
  memory: KindMemory,
): SnoozePresetSetting | null {
  if (when === "after") {
    return preset.kind === "after" ? preset : { kind: "after", minutes: memory.minutes };
  }
  if (!isSnoozePresetDay(when)) return null;
  return { kind: "at", day: when, time: preset.kind === "at" ? preset.time : memory.time };
}

/**
 * Edits the snooze menu's options. Rows sort by wake time like the menu, but only when focus
 * leaves the list, so a row never moves under the pointer mid-edit.
 */
export function SnoozePresetsRow() {
  const gt = useGT();
  const searchableSetting = useSearchableSetting();
  const settings = useScopedSettings();
  const updateSettings = useUpdateScopedSettings();
  const saved = settings.snoozePresets;
  const nowMinute = useNowMinute();
  const now = new Date(`${nowMinute}Z`);
  // Edits build on a local draft, so a second edit before the first save echoes back
  // does not restore what the first one changed. Echoes of our own writes keep the draft.
  // Row keys survive removals and sorts, so a row's in-progress field state stays with it.
  // One state, so a sort queued in the same event as an edit applies on top of it.
  const [rows, setRows] = useState(() =>
    sortSnoozeRows(
      saved,
      saved.map((_, index) => index),
      now,
    ),
  );
  const { presets, keys } = rows;
  const [nextKey, setNextKey] = useState(saved.length);
  // Null forces the next render to adopt the saved value, as after a failed write.
  const [savedSource, setSavedSource] = useState<ReadonlyArray<SnoozePresetSetting> | null>(saved);
  // Environments disagree, so equal-looking edits and Reset must still write to all of them.
  const mixed = useScopedSettingsMixed(["snoozePresets"]);
  const [written, setWritten] = useState<ReadonlyArray<ReadonlyArray<SnoozePresetSetting>>>([]);
  const freshKeys = (count: number) => {
    setNextKey(nextKey + count);
    return Array.from({ length: count }, (_, index) => nextKey + index);
  };
  if (!Equal.equals(savedSource, saved)) {
    setSavedSource(saved);
    const reconciled = reconcileSnoozeDraft(written, saved);
    if (reconciled.adopt) {
      setWritten([]);
      setRows(sortSnoozeRows(saved, freshKeys(saved.length), now));
    } else {
      setWritten(reconciled.pending);
    }
  }
  const save = (
    snoozePresets: ReadonlyArray<SnoozePresetSetting>,
    nextKeys: ReadonlyArray<number> = keys,
  ) => {
    if (!mixed && Equal.equals(snoozePresets, presets)) return;
    setRows({ presets: snoozePresets, keys: nextKeys });
    setWritten((previous) => [...previous, snoozePresets]);
    updateSettings(
      { snoozePresets },
      {
        onFailed: () => {
          setWritten([]);
          setSavedSource(null);
        },
      },
    );
  };
  const replaceAt = (index: number, next: SnoozePresetSetting) =>
    save(presets.map((preset, candidate) => (candidate === index ? next : preset)));

  return (
    <SettingsRow
      serverScoped
      settingKeys={["snoozePresets"]}
      {...searchableSetting("snooze-options")}
      control={
        <Button
          variant="ghost-muted"
          size="xs"
          disabled={presets.length >= MAX_SNOOZE_PRESETS}
          onClick={() => save([...presets, nextCandidate(presets)], [...keys, ...freshKeys(1)])}
        >
          <PlusIcon />
          <T>Add option</T>
        </Button>
      }
      resetAction={
        !mixed && sameSnoozePresets(presets, DEFAULT_SNOOZE_PRESETS) ? null : (
          <SettingResetButton
            ariaLabel={gt("Reset snooze options to default")}
            onClick={() => {
              const sorted = sortSnoozeRows(
                DEFAULT_SNOOZE_PRESETS,
                freshKeys(DEFAULT_SNOOZE_PRESETS.length),
                now,
              );
              save(sorted.presets, sorted.keys);
            }}
          />
        )
      }
    >
      <SnoozePresetList
        presets={presets}
        keys={keys}
        timestampFormat={settings.timestampFormat}
        onChange={replaceAt}
        onRemove={(index) =>
          save(
            presets.filter((_, candidate) => candidate !== index),
            keys.filter((_, candidate) => candidate !== index),
          )
        }
        onSettle={() => setRows((current) => sortSnoozeRows(current.presets, current.keys, now))}
      />
    </SettingsRow>
  );
}

function SnoozePresetList(props: {
  presets: ReadonlyArray<SnoozePresetSetting>;
  keys: ReadonlyArray<number>;
  timestampFormat: Parameters<typeof formatShortTimestamp>[1];
  onChange: (index: number, preset: SnoozePresetSetting) => void;
  onRemove: (index: number) => void;
  onSettle: () => void;
}) {
  const gt = useGT();
  const m = useMessages();
  const locale = useLocale();
  const nowMinute = useNowMinute();
  const now = new Date(`${nowMinute}Z`);
  const formatTime = (date: Date) =>
    formatShortTimestamp(date.toISOString(), props.timestampFormat);
  const seenIds = new Set<string>();
  const seenWakes = new Set<string>();
  const previews = props.presets.map((preset) => {
    const resolved = resolveSnoozePreset(preset, now, formatTime, m);
    if (resolved === null) return { tone: "muted", text: gt("Passed for today") } as const;
    if (seenIds.has(resolved.id)) {
      return { tone: "muted", text: gt("Duplicate of an option above") } as const;
    }
    if (seenWakes.has(resolved.snoozedUntil)) {
      return { tone: "muted", text: gt("Same time as an option above") } as const;
    }
    seenIds.add(resolved.id);
    seenWakes.add(resolved.snoozedUntil);
    return { tone: "menu", label: resolved.label, when: resolved.whenLabel } as const;
  });

  // The rows are the snooze menu as it reads now: its label and when it wakes. Each opens its
  // fields in a float, and the list re-sorts once that closes, never under the pointer.
  return (
    <div className="flex flex-col gap-1 pt-1">
      {props.presets.length === 0 ? (
        <p className="px-2 text-meta text-ink-2">
          <T>Menus offer only Custom…</T>
        </p>
      ) : null}
      {props.presets.map((preset, index) => {
        const preview = previews[index]!;
        const label =
          preview.tone === "menu" ? preview.label : describeSnoozePreset(preset, gt, m, locale);
        return (
          <div
            key={props.keys[index]}
            className="group/snooze relative flex h-8 items-center gap-2 rounded-row px-2 transition-colors hover:bg-foreground/4 has-data-popup-open:bg-foreground/8"
          >
            <Popover
              onOpenChange={(open) => {
                // Waits for the amount field's blur commit before the list moves.
                if (!open) queueMicrotask(props.onSettle);
              }}
            >
              <PopoverTrigger
                aria-label={gt("Edit snooze option {label}", { label })}
                render={
                  <button
                    type="button"
                    className="absolute inset-0 rounded-inherit outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  />
                }
              />
              <PopoverPopup side="bottom" align="start" padding="none">
                <SnoozePresetFields
                  preset={preset}
                  onChange={(next) => props.onChange(index, next)}
                />
              </PopoverPopup>
            </Popover>
            <span
              className={cn(
                "pointer-events-none truncate text-body",
                preview.tone === "menu" ? "text-ink-1" : "text-ink-3",
              )}
            >
              {label}
            </span>
            <span className="pointer-events-none ms-auto shrink-0 text-meta text-ink-2 tabular-nums">
              {preview.tone === "menu" ? preview.when : preview.text}
            </span>
            <span className="relative flex opacity-0 transition-opacity group-hover/snooze:opacity-100 has-focus-visible:opacity-100">
              <Button
                variant="ghost-muted"
                size="icon-xs"
                aria-label={gt("Remove snooze option {number}", { number: index + 1 })}
                onClick={() => props.onRemove(index)}
              >
                <XIcon />
              </Button>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function describeSnoozePreset(
  preset: SnoozePresetSetting,
  gt: ReturnType<typeof useGT>,
  m: ReturnType<typeof useMessages>,
  locale: string,
): string {
  if (preset.kind === "at") {
    return gt("{day} at {time}", { day: whenLabel(preset.day, m, locale), time: preset.time });
  }
  const { amount, unit } = splitMinutes(preset.minutes);
  if (unit === "days") {
    return gt("{count, plural, one {In {count} day} other {In {count} days}}", { count: amount });
  }
  if (unit === "hours") {
    return gt("{count, plural, one {In {count} hour} other {In {count} hours}}", { count: amount });
  }
  return gt("{count, plural, one {In {count} minute} other {In {count} minutes}}", {
    count: amount,
  });
}

const DAY_VALUES = SnoozePresetDay.literals;

/** One option's float: In or At, then its amount or its day and time. The row it edits stays in
 *  view above it and says when it wakes. */
function SnoozePresetFields(props: {
  preset: SnoozePresetSetting;
  onChange: (preset: SnoozePresetSetting) => void;
}) {
  const gt = useGT();
  const m = useMessages();
  const locale = useLocale();
  const { preset, onChange } = props;
  // Switching between In and At keeps the other kind's last value, so a misclick can be undone
  // without retyping it.
  const [memory, setMemory] = useState<KindMemory>({ minutes: 60, time: "09:00", day: "tomorrow" });
  const switchKind = (kind: "after" | "at") => {
    if (kind === preset.kind) return;
    const next = withWhen(preset, kind === "after" ? "after" : memory.day, memory);
    if (!next) return;
    setMemory(
      preset.kind === "after"
        ? { ...memory, minutes: preset.minutes }
        : { ...memory, time: preset.time, day: preset.day },
    );
    onChange(next);
  };
  return (
    <div className="flex w-72 flex-col gap-2 p-2">
      <ToggleGroup
        aria-label={gt("When")}
        // Every line of the float runs edge to edge, so its controls share one right edge.
        className="w-full *:flex-1"
        value={[preset.kind]}
        onValueChange={(next) => {
          const kind = next[0];
          if (kind === "after" || kind === "at") switchKind(kind);
        }}
      >
        <Toggle value="after">{m(WHEN_LABELS.after)}</Toggle>
        <Toggle value="at">
          {gt("At", { $context: "snooze until a time of day, as in: At 09:00" })}
        </Toggle>
      </ToggleGroup>
      {preset.kind === "after" ? (
        <DurationFields
          minutes={preset.minutes}
          onChange={(minutes) => onChange({ ...preset, minutes })}
        />
      ) : (
        <div className="flex items-center gap-2">
          <Select
            value={preset.day}
            items={Object.fromEntries(
              DAY_VALUES.map((value) => [value, whenLabel(value, m, locale)]),
            )}
            onValueChange={(value) => {
              if (isSnoozePresetDay(value)) onChange({ ...preset, day: value });
            }}
          >
            <SelectTrigger size="sm" aria-label={gt("Day")}>
              <SelectValue />
            </SelectTrigger>
            <SelectPopup>
              {DAY_VALUES.map((value) => (
                <SelectItem hideIndicator key={value} value={value}>
                  {whenLabel(value, m, locale)}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
          <Input
            nativeInput
            size="sm"
            type="time"
            className="w-28 shrink-0"
            aria-label={gt("Time", { $context: "time of day" })}
            value={preset.time}
            onChange={(event) => {
              if (/^\d{2}:\d{2}$/.test(event.target.value)) {
                onChange({ ...preset, time: event.target.value });
              }
            }}
          />
        </div>
      )}
    </div>
  );
}

function DurationFields(props: { minutes: number; onChange: (minutes: number) => void }) {
  const gt = useGT();
  const m = useMessages();
  // The chosen unit stays put while stepping, so 59 → 60 minutes does not jump to hours.
  const [chosenUnit, setChosenUnit] = useState(() => splitMinutes(props.minutes).unit);
  const unit =
    props.minutes % UNIT_MINUTES[chosenUnit] === 0 ? chosenUnit : splitMinutes(props.minutes).unit;
  const amount = props.minutes / UNIT_MINUTES[unit];
  const maxAmount = Math.floor(MAX_SNOOZE_PRESET_MINUTES / UNIT_MINUTES[unit]);
  // Typing stays local until the field commits (blur, Enter, or a step), so half-typed
  // values never reach the server.
  const [draft, setDraft] = useState<number | null>(amount);
  const [draftSource, setDraftSource] = useState(`${props.minutes}:${unit}`);
  if (draftSource !== `${props.minutes}:${unit}`) {
    setDraftSource(`${props.minutes}:${unit}`);
    setDraft(amount);
  }
  return (
    <div className="flex items-center gap-2">
      <NumberField
        size="sm"
        className="w-28"
        min={1}
        max={maxAmount}
        step={1}
        value={draft}
        onValueChange={setDraft}
        onValueCommitted={(value) => {
          if (value === null) {
            setDraft(amount);
            return;
          }
          const next = Math.min(maxAmount, Math.max(1, Math.round(value)));
          setDraft(next);
          if (next !== amount) props.onChange(next * UNIT_MINUTES[unit]);
        }}
      >
        <NumberFieldGroup>
          <NumberFieldDecrement aria-label={gt("Decrease")} />
          <NumberFieldInput
            aria-label={gt("Amount")}
            // Base UI commits on blur but not on Enter; refocus so keyboard users stay put.
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              const input = event.currentTarget;
              input.blur();
              input.focus();
            }}
          />
          <NumberFieldIncrement aria-label={gt("Increase")} />
        </NumberFieldGroup>
      </NumberField>
      <ToggleGroup
        aria-label={gt("Unit", { $context: "unit of time" })}
        className="flex-1 *:flex-1"
        value={[unit]}
        onValueChange={(next) => {
          const value = next[0];
          if (value === "minutes" || value === "hours" || value === "days") {
            setChosenUnit(value);
            props.onChange(Math.min(amount * UNIT_MINUTES[value], MAX_SNOOZE_PRESET_MINUTES));
          }
        }}
      >
        <Toggle value="minutes">{gt("min", { $context: "minutes, abbreviated" })}</Toggle>
        <Toggle value="hours">{m(UNIT_LABELS.hours, { count: amount })}</Toggle>
        <Toggle value="days">{m(UNIT_LABELS.days, { count: amount })}</Toggle>
      </ToggleGroup>
    </div>
  );
}
