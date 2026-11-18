import { Spinner } from "~/components/ui/spinner";

import {
  AlertTriangleIcon,
  CheckIcon,
  ArrowUpCircleIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  LayersIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
  LockIcon,
  LockOpenIcon,
} from "lucide-react";
import * as Arr from "effect/Array";
import * as Result from "effect/Result";
import { Fragment, useState, type ReactElement, type ReactNode } from "react";
import {
  isProviderDriverKind,
  resolveProviderInstanceEnabled,
  type ProviderInstanceConfig,
  type ProviderInstanceEnvironmentVariable,
  type ProviderInstanceId,
  type AcpRegistryUrlAuthAction,
  type EnvironmentId,
  type ProjectId,
  type ProviderDriverKind,
  type SecretReference,
  type ServerProvider,
  type ServerProviderModel,
} from "@t3tools/contracts";

import {
  type CustomModelDefinition,
  readCustomModelEntries,
  toCustomModelSetting,
} from "@t3tools/shared/model";
import { cn } from "../../lib/utils";
import { useCopyToClipboard } from "../../hooks/useCopyToClipboard";
import { useStableCallback } from "../../hooks/useStableCallback";
import { normalizeProviderAccentColor } from "../../providerInstances";
import { Button } from "../ui/button";
import { DraftInput } from "../ui/draft-input";
import { SecretSourceInput, type SecretSource } from "./SecretSourceInput";
import { Popover, PopoverPopup, PopoverTrigger } from "../ui/popover";
import { Switch } from "../ui/switch";
import { ManagedControl, ManagedNotice } from "../ManagedPolicy";
import { managedInstanceLocks, useManagedPolicy } from "../../state/managedPolicy";
import { disallowedProviderMessage, isManagedDriverAllowed } from "@t3tools/contracts";
import { stackedThreadToast, toastManager } from "../ui/toast";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../ui/tooltip";
import type {
  ProviderClientDefinition,
  ProviderEnvironmentField,
} from "@t3tools/provider-core/client";
import {
  deriveProviderSettingsFields,
  ProviderSettingsForm,
  reconcileRowsDraft,
  seedRowsDraft,
} from "./ProviderSettingsForm";
import { ProviderModelsSection } from "./ProviderModelsSection";
import { ProviderInstanceIcon } from "../chat/ProviderInstanceIcon";
import { ProviderAccentColorPicker } from "./ProviderAccentColorPicker";
import { RedactedSensitiveText } from "./RedactedSensitiveText";
import { SettingResetButton, SettingsRow, SettingsSection } from "./settingsLayout";
import { AcpSessionManagementSection } from "./AcpSessionManagementSection";
import { FoldedSettingsSection } from "./FoldedSettingsSection";
import { readCodexSetupMode } from "./CodexSetupSection.logic";
import {
  type CustomModelSave,
  customModelsKey,
  pendingCustomModelSaves,
  settleCustomModelSave,
} from "./customModelSaves.logic";
import { getProviderRestartNotice } from "../ProviderUpdateLaunchNotification.logic";
import {
  getProviderVersionAdvisoryPresentation,
  PROVIDER_STATUS_STYLES,
  getProviderStatusKey,
  getProviderSummary,
  getProviderVersionLabel,
} from "./providerStatus";
import { SettingsStatus } from "./settingsLayout";

const ENVIRONMENT_VARIABLE_NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

function ProviderStatusDiagnostic({
  detail,
  children,
}: {
  detail: string | null;
  children: ReactElement;
}) {
  if (!detail) return children;
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipPopup side="top">{detail}</TooltipPopup>
    </Tooltip>
  );
}

let environmentVariableDraftId = 0;
const DRAFT_ROW_ID_PREFIX = "provider-env-";
const nextEnvironmentVariableDraftId = () =>
  `${DRAFT_ROW_ID_PREFIX}${environmentVariableDraftId++}`;

type EnvironmentDraftRow = {
  readonly id: string;
  readonly name: string;
  readonly value: ProviderInstanceEnvironmentVariable["value"];
  readonly sensitive: boolean;
  readonly valueRedacted?: boolean;
};

function makeEnvironmentDraftRow(
  variable: ProviderInstanceEnvironmentVariable,
  index: number,
): EnvironmentDraftRow {
  return {
    id: `${index}:${variable.name}`,
    name: variable.name,
    value: variable.value,
    sensitive: variable.sensitive,
    ...(variable.valueRedacted !== undefined ? { valueRedacted: variable.valueRedacted } : {}),
  };
}

const toEnvironmentDraftRows = (environment: ReadonlyArray<ProviderInstanceEnvironmentVariable>) =>
  environment.map(makeEnvironmentDraftRow);

function environmentValuesEqual(
  left: ProviderInstanceEnvironmentVariable["value"],
  right: ProviderInstanceEnvironmentVariable["value"],
): boolean {
  if (typeof left === "string" || typeof right === "string") return left === right;
  return left.provider === right.provider && left.reference === right.reference;
}

function providerEnvironmentsEqual(
  left: ReadonlyArray<ProviderInstanceEnvironmentVariable>,
  right: ReadonlyArray<ProviderInstanceEnvironmentVariable>,
): boolean {
  return (
    left.length === right.length &&
    left.every((variable, index) => {
      const other = right[index];
      return (
        other !== undefined &&
        variable.name === other.name &&
        environmentValuesEqual(variable.value, other.value) &&
        variable.sensitive === other.sensitive &&
        variable.valueRedacted === other.valueRedacted
      );
    })
  );
}

function readConfigString(config: unknown, key: string): string | null {
  if (config === null || typeof config !== "object") return null;
  const value = (config as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

/** Preserve explicit empty arrays/objects; clearing a custom list differs from selecting driver defaults. */
function nextConfigBlobWithValue(
  config: unknown,
  key: string,
  value: unknown,
): Record<string, unknown> {
  const base: Record<string, unknown> =
    config !== null && typeof config === "object" ? { ...(config as Record<string, unknown>) } : {};
  base[key] = value;
  return base;
}

export function deriveProviderModelsForDisplay(input: {
  readonly liveModels: ReadonlyArray<ServerProviderModel> | undefined;
  readonly customModels: ReadonlyArray<CustomModelDefinition>;
}): ReadonlyArray<ServerProviderModel> {
  const liveCustomModelsBySlug = new Map(
    Arr.filterMap(input.liveModels ?? [], (model) =>
      model.isCustom ? Result.succeed([model.slug, model] as const) : Result.failVoid,
    ),
  );
  const serverModels = input.liveModels?.filter((model) => !model.isCustom) ?? [];
  const serverSlugs = new Set(serverModels.map((model) => model.slug));
  const customModels = input.customModels.flatMap((entry) =>
    serverSlugs.has(entry.slug)
      ? []
      : [
          {
            slug: entry.slug,
            name: entry.name,
            isCustom: true,
            capabilities:
              entry.capabilities ?? liveCustomModelsBySlug.get(entry.slug)?.capabilities ?? null,
          },
        ],
  );
  return [...serverModels, ...customModels];
}

function ProviderAuthEmail(props: { readonly email: string | undefined }) {
  const email = props.email?.trim();
  if (!email) return null;

  return (
    <RedactedSensitiveText
      value={email}
      ariaLabel="Toggle account email visibility"
      revealTooltip="Click to reveal email"
      hideTooltip="Click to hide email"
      className="max-w-full truncate"
    />
  );
}

function readProviderEnvironmentVariable(
  environment: ReadonlyArray<ProviderInstanceEnvironmentVariable> | undefined,
  name: string,
): ProviderInstanceEnvironmentVariable | undefined {
  return environment?.find((variable) => variable.name === name);
}

function providerEnvironmentWithoutNames(
  environment: ReadonlyArray<ProviderInstanceEnvironmentVariable> | undefined,
  names: ReadonlySet<string>,
): ReadonlyArray<ProviderInstanceEnvironmentVariable> {
  return (environment ?? []).filter((variable) => !names.has(variable.name));
}

export function nextProviderEnvironmentWithFieldValue(
  environment: ReadonlyArray<ProviderInstanceEnvironmentVariable> | undefined,
  field: ProviderEnvironmentField,
  value: string,
): ReadonlyArray<ProviderInstanceEnvironmentVariable> {
  const trimmed = value.trim();
  const next: ProviderInstanceEnvironmentVariable[] = [];
  let found = false;

  for (const variable of environment ?? []) {
    if (variable.name !== field.name) {
      next.push(variable);
      continue;
    }
    found = true;
    if (trimmed.length > 0) {
      next.push({
        name: variable.name,
        value: trimmed,
        sensitive: field.sensitive ?? true,
      });
    }
  }

  if (!found && trimmed.length > 0) {
    next.push({
      name: field.name,
      value: trimmed,
      sensitive: field.sensitive ?? true,
    });
  }

  return next;
}

export function nextProviderEnvironmentWithFieldSecret(
  environment: ReadonlyArray<ProviderInstanceEnvironmentVariable> | undefined,
  field: ProviderEnvironmentField,
  secret: SecretReference | undefined,
): ReadonlyArray<ProviderInstanceEnvironmentVariable> {
  const others = providerEnvironmentWithoutNames(environment, new Set([field.name]));
  return secret === undefined
    ? others
    : [...others, { name: field.name, value: secret, sensitive: true }];
}

function ProviderEnvironmentFieldRow(props: {
  readonly field: ProviderEnvironmentField;
  readonly variable: ProviderInstanceEnvironmentVariable | undefined;
  readonly idPrefix: string;
  readonly onCommit: (field: ProviderEnvironmentField, value: string) => void;
  readonly onSecretChange: (
    field: ProviderEnvironmentField,
    secret: SecretReference | undefined,
  ) => void;
  readonly onRemove: (field: ProviderEnvironmentField) => void;
  readonly managedReason?: string | undefined;
  readonly secretSources: ReadonlyArray<SecretSource>;
  readonly environmentId?: EnvironmentId | undefined;
}) {
  const inputId = `${props.idPrefix}-environment-${props.field.name}`;
  const value = props.variable?.valueRedacted ? "" : (props.variable?.value ?? "");

  return (
    <SettingsRow
      title={<label htmlFor={inputId}>{props.field.label}</label>}
      description={props.field.description}
      managed={props.managedReason}
      control={
        <div className="flex w-full min-w-0 items-center gap-2 @min-[32rem]/settings-row:w-56">
          {props.field.sensitive === false ? (
            <DraftInput
              id={inputId}
              size="sm"
              className="min-w-0 flex-1"
              autoComplete="off"
              value={typeof value === "string" ? value : ""}
              onCommit={(next) => props.onCommit(props.field, next)}
              placeholder={props.field.placeholder}
              spellCheck={false}
            />
          ) : (
            <SecretSourceInput
              id={inputId}
              size="sm"
              className="min-w-0 flex-1"
              value={value}
              onCommit={(next) => props.onCommit(props.field, next)}
              placeholder={props.field.placeholder}
              configured={props.variable?.valueRedacted === true}
              spellCheck={false}
              aria-label={props.field.label}
              sources={props.secretSources}
              environmentId={props.environmentId}
              onSecretChange={(secret) => props.onSecretChange(props.field, secret)}
            />
          )}
          {props.variable ? (
            <Button
              type="button"
              size="icon-sm"
              variant="ghost-destructive"
              onClick={() => props.onRemove(props.field)}
              aria-label={`Clear ${props.field.label}`}
            >
              <XIcon className="size-4" />
            </Button>
          ) : null}
        </div>
      }
    />
  );
}

export function ProviderEnvironmentSection(props: {
  readonly environment: ReadonlyArray<ProviderInstanceEnvironmentVariable>;
  readonly onChange: (environment: ReadonlyArray<ProviderInstanceEnvironmentVariable>) => void;
  /** Variables an administrator's policy pins: listed by name, never editable or removable. */
  readonly managed?: { readonly names: ReadonlySet<string>; readonly reason: string } | undefined;
  readonly secretSources?: ReadonlyArray<SecretSource>;
  readonly environmentId?: EnvironmentId | undefined;
}) {
  const [storedDraft, setDraft] = useState(() =>
    seedRowsDraft(props.environment, toEnvironmentDraftRows),
  );
  let draft = reconcileRowsDraft(
    storedDraft,
    props.environment,
    providerEnvironmentsEqual,
    toEnvironmentDraftRows,
  );
  if (draft.rows !== storedDraft.rows) {
    // Keep rows the server never acknowledged, even across an external reseed.
    const acknowledged = new Set(storedDraft.seen.map((variable) => variable.name));
    const unpublished = storedDraft.rows.filter(
      (row) =>
        row.id.startsWith(DRAFT_ROW_ID_PREFIX) &&
        !acknowledged.has(row.name) &&
        !draft.rows.some((incoming) => incoming.name === row.name),
    );
    if (unpublished.length > 0) draft = { ...draft, rows: [...draft.rows, ...unpublished] };
  }
  if (draft !== storedDraft) setDraft(draft);
  const rows = draft.rows;
  const setRows = (nextRows: ReadonlyArray<EnvironmentDraftRow>) =>
    setDraft({ ...draft, rows: nextRows });

  const publishRows = (nextRows: ReadonlyArray<EnvironmentDraftRow>) => {
    const published: ProviderInstanceEnvironmentVariable[] = [];
    for (const row of nextRows) {
      const name = row.name.trim();
      if (!ENVIRONMENT_VARIABLE_NAME_PATTERN.test(name)) {
        if (
          name.length > 0 ||
          row.value !== "" ||
          row.sensitive !== true ||
          row.valueRedacted !== undefined
        ) {
          return;
        }
        continue;
      }
      const { id: _id, ...rest } = row;
      published.push({ ...rest, name });
    }
    setDraft({ rows: nextRows, seen: draft.seen, lastPublished: published });
    props.onChange(published);
  };

  const updateVariable = (id: string, patch: Partial<Omit<EnvironmentDraftRow, "id">>) => {
    // A row named like a pinned variable renders as the policy's, with no way to edit or remove it.
    if (patch.name !== undefined && props.managed?.names.has(patch.name)) return;
    const nextRows = rows.map((row) =>
      row.id === id
        ? {
            ...row,
            ...patch,
            ...(patch.value !== undefined ? { valueRedacted: false } : {}),
          }
        : row,
    );
    setRows(nextRows);
    publishRows(nextRows);
  };

  const setVariableSecret = (id: string, secret: SecretReference | undefined) => {
    const nextRows = rows.map((row) => {
      if (row.id !== id) return row;
      const { valueRedacted: _valueRedacted, ...rest } = row;
      return { ...rest, value: secret ?? "" };
    });
    setRows(nextRows);
    publishRows(nextRows);
  };

  const removeVariable = (id: string) => {
    const nextRows = rows.filter((row) => row.id !== id);
    setRows(nextRows);
    publishRows(nextRows);
  };

  const addVariable = () =>
    setRows([
      ...rows,
      {
        id: nextEnvironmentVariableDraftId(),
        name: "",
        value: "",
        sensitive: true,
      },
    ]);

  return (
    <SettingsRow
      title="Variables"
      description="API keys, base URLs, and other per-instance CLI settings."
      control={
        <Button type="button" size="xs" variant="ghost-muted" onClick={addVariable}>
          <PlusIcon />
          Add variable
        </Button>
      }
    >
      {rows.length > 0 ? (
        <div className="mt-2 min-w-0 space-y-2 pb-2">
          {rows.map((variable, index) => {
            if (props.managed?.names.has(variable.name)) {
              return (
                <div key={variable.id} className="flex min-w-0 flex-wrap items-center gap-2">
                  <code className="min-w-0 truncate text-meta sm:w-44 sm:shrink-0">
                    {variable.name}
                  </code>
                  <span className="text-meta text-ink-2">{props.managed.reason}</span>
                </div>
              );
            }
            const nameInput = (
              <DraftInput
                size="sm"
                font="mono"
                className="min-w-0 flex-1"
                value={variable.name}
                onCommit={(name) => updateVariable(variable.id, { name: name.trim() })}
                disabled={variable.valueRedacted === true}
                placeholder="VARIABLE_NAME"
                spellCheck={false}
                aria-label={`Environment variable name ${index + 1}`}
              />
            );
            const removeButton = (
              <Button
                type="button"
                size="icon-xs"
                variant="ghost-destructive"
                onClick={() => removeVariable(variable.id)}
                aria-label={`Remove environment variable ${variable.name || index + 1}`}
              >
                <XIcon className="size-3" />
              </Button>
            );
            const sensitiveToggle =
              typeof variable.value === "string" ? (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="ghost-muted"
                        disabled={variable.valueRedacted === true}
                        onClick={() => {
                          const sensitive = !variable.sensitive;
                          updateVariable(variable.id, {
                            sensitive,
                            ...(sensitive && variable.valueRedacted === undefined
                              ? {}
                              : { valueRedacted: sensitive ? variable.valueRedacted : false }),
                          });
                        }}
                        aria-pressed={variable.sensitive}
                        aria-label={`Mark environment variable ${variable.name || index + 1} as sensitive`}
                      >
                        {variable.sensitive ? (
                          <LockIcon className="size-3" />
                        ) : (
                          <LockOpenIcon className="size-3" />
                        )}
                      </Button>
                    }
                  />
                  <TooltipPopup side="top">
                    {variable.sensitive ? "Sensitive, stored separately" : "Plain text"}
                  </TooltipPopup>
                </Tooltip>
              ) : null;
            const layout = (source: ReactNode, value: ReactNode) => (
              <div className="flex min-w-0 flex-col gap-2 rounded-row border p-2">
                <div className="flex min-w-0 items-center gap-2">
                  {nameInput}
                  {source}
                  {removeButton}
                </div>
                <div className="flex min-w-0 items-start gap-2">
                  {value}
                  {sensitiveToggle}
                </div>
              </div>
            );
            return (
              <Fragment key={variable.id}>
                {variable.sensitive ? (
                  <SecretSourceInput
                    size="sm"
                    font="mono"
                    className="min-w-0 flex-1"
                    value={variable.valueRedacted ? "" : variable.value}
                    onCommit={(value) => updateVariable(variable.id, { value })}
                    placeholder="value"
                    configured={variable.valueRedacted === true}
                    spellCheck={false}
                    aria-label={`Environment variable value ${index + 1}`}
                    sources={props.secretSources ?? []}
                    environmentId={props.environmentId}
                    onSecretChange={(secret) => setVariableSecret(variable.id, secret)}
                  >
                    {(parts) => layout(parts.source, parts.value)}
                  </SecretSourceInput>
                ) : (
                  layout(
                    null,
                    <DraftInput
                      size="sm"
                      font="mono"
                      className="min-w-0 flex-1"
                      value={
                        variable.valueRedacted || typeof variable.value !== "string"
                          ? ""
                          : variable.value
                      }
                      onCommit={(value) => updateVariable(variable.id, { value })}
                      autoComplete="off"
                      placeholder="value"
                      spellCheck={false}
                      aria-label={`Environment variable value ${index + 1}`}
                    />,
                  )
                )}
              </Fragment>
            );
          })}
          <p className="text-meta text-ink-2">
            Sensitive values are stored separately and never returned to the app.
            {rows.some((row) => row.valueRedacted === true)
              ? " Enter a new value to rename a saved one or make it plain text."
              : null}
          </p>
        </div>
      ) : null}
    </SettingsRow>
  );
}

function ProjectOverrideInheritance({
  projectEnabled,
  deviceEnabled,
}: {
  readonly projectEnabled: boolean;
  readonly deviceEnabled: boolean;
}) {
  const layers = [
    { key: "project", label: "Project", enabled: projectEnabled, effective: true },
    { key: "device", label: "Device", enabled: deviceEnabled, effective: false },
  ];
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <Button
                  size="icon-xs"
                  variant="ghost-muted"
                  aria-label="Overridden for this project. Show where this value comes from"
                />
              }
            />
          }
        >
          <LayersIcon className="size-3 text-primary" />
        </TooltipTrigger>
        <TooltipPopup side="top">Overridden for this project</TooltipPopup>
      </Tooltip>
      <PopoverPopup align="end" width="md" padding="none">
        <ol role="list" className="px-2 py-2 text-body">
          {layers.map((layer) => (
            <li
              key={layer.key}
              className={cn(
                "grid grid-cols-(--grid-trail) items-center gap-x-2 rounded-row px-2 py-1",
                layer.effective && "bg-foreground/6",
              )}
            >
              <span
                className={cn(
                  "min-w-0 truncate",
                  layer.effective ? "font-medium text-ink-1" : "text-ink-2",
                )}
              >
                {layer.label}
              </span>
              <span
                className={cn(
                  "flex items-center gap-2",
                  layer.effective ? "text-ink-1" : "text-ink-2",
                )}
              >
                {layer.enabled ? "On" : "Off"}
                {layer.effective ? (
                  <CheckIcon aria-hidden className="size-4 shrink-0 text-primary" />
                ) : (
                  <span aria-hidden className="size-4 shrink-0" />
                )}
              </span>
            </li>
          ))}
        </ol>
      </PopoverPopup>
    </Popover>
  );
}

interface ProjectOverrideControl {
  readonly value: boolean | undefined;
  readonly effectiveEnabled: boolean;
  readonly onChange: (next: boolean) => void;
  readonly onReset: () => void;
}

interface ProviderInstanceCardProps {
  readonly instanceId: ProviderInstanceId;
  readonly instance: ProviderInstanceConfig;
  readonly driverOption: ProviderClientDefinition | undefined;
  readonly liveProvider: ServerProvider | undefined;
  readonly mode: "list" | "editor";
  readonly selected?: boolean | undefined;
  readonly onSelect?: (() => void) | undefined;
  readonly readOnly?: boolean | undefined;
  readonly canWriteSettings?: boolean;
  readonly onUpdate: (nextInstance: ProviderInstanceConfig) => Promise<boolean>;
  readonly onDelete?: (() => void) | undefined;
  readonly headerAction?: ReactNode | undefined;
  readonly setup?: ReactNode;
  readonly runtime?: ReactNode;
  readonly hiddenModels: ReadonlyArray<string>;
  readonly favoriteModels: ReadonlyArray<string>;
  readonly modelOrder: ReadonlyArray<string>;
  readonly onHiddenModelsChange: (
    next: ReadonlyArray<string>,
    affectedModels: ReadonlyArray<string>,
  ) => void;
  readonly onFavoriteModelsChange: (next: ReadonlyArray<string>) => void;
  readonly onToggleFavorite: (model: string) => void;
  readonly onModelOrderChange: (next: ReadonlyArray<string>) => void;
  readonly onRunUpdate?: (() => void) | undefined;
  readonly onInstallRecommended?: (() => void) | undefined;
  readonly isUpdating?: boolean | undefined;
  readonly onAcceptUrlAuth?: ((action: AcpRegistryUrlAuthAction) => void) | undefined;
  readonly environmentId?: EnvironmentId | undefined;
  readonly secretSources?: ReadonlyArray<SecretSource>;
  readonly projectOverride?: ProjectOverrideControl | undefined;
  readonly acpProjects?:
    | ReadonlyArray<{
        readonly id: ProjectId;
        readonly title: string;
        readonly workspaceRoot: string;
      }>
    | undefined;
}

const EMPTY_ACP_PROJECTS: NonNullable<ProviderInstanceCardProps["acpProjects"]> = [];
const NO_SECRET_SOURCES: ReadonlyArray<SecretSource> = [];
const NO_CUSTOM_MODELS: ReadonlyArray<CustomModelDefinition> = [];

/**
 * Every custom model save writes the whole list, so the next edit starts from the last list sent
 * until the config stream echoes it, which can land before or after the save's reply.
 */
function useCustomModelSaves(
  stored: ReadonlyArray<CustomModelDefinition>,
  save: (next: ReadonlyArray<CustomModelDefinition>) => Promise<boolean>,
) {
  const [saves, setSaves] = useState<ReadonlyArray<CustomModelSave>>([]);
  const storedKey = customModelsKey(stored);
  const [previousStoredKey, setPreviousStoredKey] = useState(storedKey);
  if (previousStoredKey !== storedKey) {
    setPreviousStoredKey(storedKey);
    // Unchanged contents can match a queued restore, so only a stream change can be an echo.
    setSaves((list) => pendingCustomModelSaves(list, storedKey));
  }
  const current = saves.at(-1)?.models ?? stored;
  const update = useStableCallback(async (next: ReadonlyArray<CustomModelDefinition>) => {
    const sent: CustomModelSave = { models: next, key: customModelsKey(next) };
    setSaves((list) => [...list, sent]);
    const saved = await save(next);
    setSaves((list) => settleCustomModelSave(list, sent, saved));
    return saved;
  });
  return [current, update] as const;
}

/** Unknown drivers stay read-only to preserve fork config. projectOverride switches affect only the
 * project, not instance.enabled. */
export function ProviderInstanceCard({
  instanceId,
  instance,
  driverOption,
  liveProvider,
  mode,
  selected = false,
  onSelect,
  readOnly = false,
  canWriteSettings = true,
  onUpdate,
  onDelete,
  headerAction,
  setup,
  runtime,
  hiddenModels,
  favoriteModels,
  modelOrder,
  onHiddenModelsChange,
  onFavoriteModelsChange,
  onToggleFavorite,
  onModelOrderChange,
  onRunUpdate,
  onInstallRecommended,
  isUpdating = false,
  onAcceptUrlAuth,
  environmentId,
  acpProjects = EMPTY_ACP_PROJECTS,
  secretSources = NO_SECRET_SOURCES,
  projectOverride,
}: ProviderInstanceCardProps) {
  const enabled = projectOverride?.effectiveEnabled ?? resolveProviderInstanceEnabled(instance);
  const effectiveProvider = liveProvider && { ...liveProvider, enabled };
  const compatibility = enabled ? liveProvider?.compatibilityAdvisory : undefined;
  const statusKey = enabled ? getProviderStatusKey(effectiveProvider) : "disabled";
  const statusStyle = PROVIDER_STATUS_STYLES[statusKey];
  const summary = enabled
    ? getProviderSummary(effectiveProvider)
    : { headline: "Disabled", detail: null };
  const authEmail = liveProvider?.auth.email?.trim();
  const isAuthenticated = enabled && liveProvider?.auth.status === "authenticated";
  const authLabel =
    enabled && liveProvider?.auth.status === "authenticated"
      ? (liveProvider.auth.label ?? liveProvider.auth.type ?? null)
      : null;
  const versionLabel = getProviderVersionLabel(liveProvider?.version);
  const versionAdvisory = getProviderVersionAdvisoryPresentation(
    liveProvider?.versionAdvisory,
    liveProvider?.compatibilityAdvisory,
    enabled,
  );
  const updateCommand = versionAdvisory?.updateCommand ?? null;
  const updateState = liveProvider?.updateState;
  const updateProgress = isUpdating
    ? ((updateState?.status === "queued" || updateState?.status === "running"
        ? updateState.message
        : null) ?? "Starting update")
    : null;
  const updateProblem =
    !isUpdating && (updateState?.status === "failed" || updateState?.status === "unchanged")
      ? updateState.message
      : null;
  const restartNotice =
    enabled && !isUpdating && liveProvider ? getProviderRestartNotice(liveProvider) : null;
  const hasCompatibilityWarning =
    compatibility !== undefined &&
    compatibility.status !== "supported" &&
    compatibility.status !== "unknown";
  const VersionAdvisoryIcon = hasCompatibilityWarning ? AlertTriangleIcon : ArrowUpCircleIcon;
  const onRunVersionAction = readOnly
    ? undefined
    : versionAdvisory?.targetVersion
      ? onInstallRecommended
      : onRunUpdate;
  const urlAuthAction = liveProvider?.auth.action;
  const displayName =
    instance.displayName?.trim() || driverOption?.label || String(instance.driver);
  const accentColor = normalizeProviderAccentColor(instance.accentColor);
  const managedPolicy = useManagedPolicy(environmentId);
  const instanceLocks = managedInstanceLocks(managedPolicy, instance.driver);
  const managedDriverReason = isManagedDriverAllowed(managedPolicy, instance.driver)
    ? undefined
    : disallowedProviderMessage(
        managedPolicy?.organization,
        driverOption?.label ?? String(instance.driver),
      );
  const { copyToClipboard } = useCopyToClipboard<{ providerName: string }>({
    onCopy: ({ providerName }) => {
      toastManager.add({
        type: "success",
        title: `${providerName} update command copied`,
        description: "Run it in a terminal when you are ready to update.",
      });
    },
    onError: (error, { providerName }) => {
      toastManager.add(
        stackedThreadToast({
          type: "error",
          title: `Could not copy ${providerName} update command`,
          description: error.message,
        }),
      );
    },
  });

  const driverKind: ProviderDriverKind | null = isProviderDriverKind(instance.driver)
    ? instance.driver
    : null;
  const storedCustomModels =
    instance.config !== null && typeof instance.config === "object"
      ? (instance.config as Record<string, unknown>).customModels
      : undefined;
  const [customModels, updateCustomModels] = useCustomModelSaves(
    instance.driver === "antigravity"
      ? NO_CUSTOM_MODELS
      : readCustomModelEntries(storedCustomModels),
    (next) => {
      const nextConfig = nextConfigBlobWithValue(
        instance.config,
        "customModels",
        next.map(toCustomModelSetting),
      );
      const { config: _omit, ...rest } = instance;
      return onUpdate({ ...rest, config: nextConfig } as ProviderInstanceConfig);
    },
  );
  const modelsForDisplay = deriveProviderModelsForDisplay({
    liveModels: liveProvider?.models,
    customModels,
  });
  const updateDisplayName = (value: string) => {
    const trimmed = value.trim();
    const { displayName: _omit, ...rest } = instance;
    onUpdate(
      trimmed.length > 0
        ? ({ ...rest, displayName: trimmed } as ProviderInstanceConfig)
        : (rest as ProviderInstanceConfig),
    );
  };

  const updateEnabled = (value: boolean) => {
    if (projectOverride) {
      projectOverride.onChange(value);
      return;
    }
    onUpdate({ ...instance, enabled: value });
  };

  const updateAccentColor = (value: string) => {
    const normalized = normalizeProviderAccentColor(value);
    const { accentColor: _omit, ...rest } = instance;
    onUpdate(
      normalized
        ? ({ ...rest, accentColor: normalized } as ProviderInstanceConfig)
        : (rest as ProviderInstanceConfig),
    );
  };

  const updateConfig = (nextConfig: Record<string, unknown> | undefined) => {
    const { config: _omit, ...rest } = instance;
    onUpdate(
      nextConfig !== undefined
        ? ({ ...rest, config: nextConfig } as ProviderInstanceConfig)
        : (rest as ProviderInstanceConfig),
    );
  };

  const updateEnvironment = (environment: ReadonlyArray<ProviderInstanceEnvironmentVariable>) => {
    const cleaned = environment.filter((variable) => variable.name.trim().length > 0);
    const { environment: _omit, ...rest } = instance;
    onUpdate(
      cleaned.length > 0
        ? ({ ...rest, environment: cleaned } as ProviderInstanceConfig)
        : (rest as ProviderInstanceConfig),
    );
  };
  const environmentFields = driverOption?.environmentFields ?? [];
  const environmentFieldNames = new Set(environmentFields.map((field) => field.name));
  const genericEnvironment = providerEnvironmentWithoutNames(
    instance.environment,
    environmentFieldNames,
  );
  const updateGenericEnvironment = (
    environment: ReadonlyArray<ProviderInstanceEnvironmentVariable>,
  ) => {
    const dedicatedEnvironment = (instance.environment ?? []).filter((variable) =>
      environmentFieldNames.has(variable.name),
    );
    updateEnvironment([...dedicatedEnvironment, ...environment]);
  };
  const updateEnvironmentField = (field: ProviderEnvironmentField, value: string) => {
    updateEnvironment(nextProviderEnvironmentWithFieldValue(instance.environment, field, value));
  };
  const updateEnvironmentFieldSecret = (
    field: ProviderEnvironmentField,
    secret: SecretReference | undefined,
  ) => {
    updateEnvironment(nextProviderEnvironmentWithFieldSecret(instance.environment, field, secret));
  };
  const removeEnvironmentField = (field: ProviderEnvironmentField) => {
    updateEnvironment(providerEnvironmentWithoutNames(instance.environment, new Set([field.name])));
  };

  const titleIconNode = (
    <ProviderInstanceIcon
      driverKind={driverKind ?? instance.driver}
      displayName={displayName}
      accentColor={accentColor}
      acpRegistryAgentId={
        readConfigString(instance.config, "source") === "local"
          ? undefined
          : (readConfigString(instance.config, "agentId") ?? undefined)
      }
      acpRegistryIconUrl={
        readConfigString(instance.config, "source") === "local"
          ? undefined
          : (readConfigString(instance.config, "registryIconUrl") ?? undefined)
      }
      showBadge={Boolean(accentColor)}
      className="size-5"
      iconClassName="size-4 text-ink-2"
    />
  );

  const titleTailNode = headerAction ? (
    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">{headerAction}</span>
  ) : null;

  const versionCodeNode = versionLabel ? (
    <code className="text-meta text-ink-2">{versionLabel}</code>
  ) : null;

  const statusDotNode =
    statusKey === "warning" || statusKey === "error" ? (
      <span className={cn("size-2 shrink-0 rounded-full", statusStyle.dot)} aria-hidden />
    ) : null;
  const needsAttention = statusKey === "warning" || statusKey === "error";
  const statusDiagnostic = hasCompatibilityWarning && needsAttention ? summary.detail : null;
  const inlineStatusDetail = hasCompatibilityWarning
    ? compatibility?.status === "broken"
      ? "Incompatible"
      : compatibility?.status === "unsupported"
        ? "Unsupported"
        : "Limited support"
    : summary.detail;
  const editorStatusNode =
    isAuthenticated && authEmail ? (
      <>
        {needsAttention ? statusDotNode : null}
        <span>Authenticated as</span>
        <ProviderAuthEmail email={authEmail} />
        {authLabel ? <span>· {authLabel}</span> : null}
        {inlineStatusDetail ? (
          <span className="min-w-0 wrap-anywhere">· {inlineStatusDetail}</span>
        ) : null}
      </>
    ) : (
      <>
        {statusDotNode}
        <span>{summary.headline}</span>
        {inlineStatusDetail ? (
          <span className="min-w-0 wrap-anywhere">· {inlineStatusDetail}</span>
        ) : null}
      </>
    );
  const versionAdvisoryNode = versionAdvisory ? (
    <Popover>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost-muted"
                  className={mode === "list" ? "pointer-events-auto relative shrink-0" : undefined}
                  aria-label={`${updateProgress ? "Updating" : versionAdvisory.title}, view details`}
                >
                  {updateProgress ? (
                    <Spinner tone="muted" {...(mode === "list" ? { size: "sm" as const } : {})} />
                  ) : (
                    <VersionAdvisoryIcon
                      className={cn(
                        mode === "list" && "size-4",
                        hasCompatibilityWarning && "text-warning",
                      )}
                    />
                  )}
                </Button>
              }
            />
          }
        />
        <TooltipPopup side="top">
          {updateProgress ? "Updating" : versionAdvisory.title}
        </TooltipPopup>
      </Tooltip>
      <PopoverPopup side="bottom" align="end" width="md" aria-label={versionAdvisory.title}>
        <div className="grid min-w-0 gap-2">
          <div className="grid">
            <p className="text-body font-semibold leading-tight text-ink-1">
              {versionAdvisory.title}
            </p>
            <p
              className={cn(
                "text-meta leading-snug wrap-anywhere",
                versionAdvisory.emphasis === "strong" ? "text-warning" : "text-ink-2",
              )}
            >
              {versionAdvisory.detail}
            </p>
          </div>
          {onRunVersionAction ? (
            <Button
              type="button"
              size="xs"
              variant="outline"
              className="w-full"
              disabled={isUpdating}
              onClick={onRunVersionAction}
            >
              {isUpdating ? <Spinner /> : <DownloadIcon />}
              {isUpdating
                ? "Updating"
                : versionAdvisory.targetVersion
                  ? `Install ${getProviderVersionLabel(versionAdvisory.targetVersion)}`
                  : "Update now"}
            </Button>
          ) : null}
          {updateProgress || updateProblem ? (
            <p
              aria-live="polite"
              className={cn(
                "text-meta leading-snug wrap-anywhere",
                updateProblem ? "text-warning" : "text-ink-2",
              )}
            >
              {updateProgress ?? updateProblem}
            </p>
          ) : null}
          {onRunVersionAction && updateCommand ? (
            <div className="flex items-center gap-2 text-meta font-medium uppercase tracking-wider text-ink-2">
              or, update manually using
            </div>
          ) : null}
          {updateCommand ? (
            <div className="flex min-w-0 items-center gap-1 rounded-row border border-border/70 bg-muted/40 py-1 pr-1 pl-2">
              <code className="min-w-0 flex-1 truncate font-mono text-meta text-ink-1">
                {updateCommand}
              </code>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost-muted"
                      className="shrink-0"
                      onClick={() => copyToClipboard(updateCommand, { providerName: displayName })}
                      aria-label="Copy update command"
                    >
                      <CopyIcon className="size-3" />
                    </Button>
                  }
                />
                <TooltipPopup side="top">Copy command</TooltipPopup>
              </Tooltip>
            </div>
          ) : null}
        </div>
      </PopoverPopup>
    </Popover>
  ) : null;

  // The provider's switch, with its project override: the first row of its settings.
  const enableControl = (
    <span className="flex shrink-0 items-center gap-1">
      {projectOverride?.value !== undefined ? (
        <span className="flex items-center">
          <ProjectOverrideInheritance
            projectEnabled={projectOverride.value}
            deviceEnabled={resolveProviderInstanceEnabled(instance)}
          />
          <SettingResetButton
            label={`${displayName} enablement`}
            tooltip="Reset to the device setting"
            disabled={readOnly || !canWriteSettings}
            onClick={projectOverride.onReset}
          />
        </span>
      ) : null}
      {/* The policy refuses switching it on; switching it off stays the user's call. */}
      <ManagedControl reason={enabled ? undefined : managedDriverReason}>
        <Switch
          checked={enabled}
          disabled={readOnly || (projectOverride !== undefined && !canWriteSettings)}
          onCheckedChange={(checked) => updateEnabled(Boolean(checked))}
          aria-label={`Enable ${displayName}`}
        />
      </ManagedControl>
    </span>
  );

  if (mode === "list") {
    // The model picker's provider strip: the icon, a dot for on or off, filled when selected.
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              className="relative isolate flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-row transition-colors outline-none hover:bg-foreground/9 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring aria-pressed:bg-foreground/8"
              onClick={onSelect}
              aria-label={`Select ${displayName}`}
              aria-pressed={selected}
            />
          }
        >
          {titleIconNode}
          <span
            aria-hidden
            className={cn(
              "absolute right-1 bottom-1 size-2 rounded-full ring-2 ring-background",
              enabled ? "bg-success" : "bg-ink-3",
            )}
          />
        </TooltipTrigger>
        <TooltipPopup side="right">
          {displayName} · {updateProgress ? `Updating · ${updateProgress}` : summary.headline}
        </TooltipPopup>
      </Tooltip>
    );
  }

  const editorHeaderAction = (
    <div className="flex shrink-0 items-center gap-2">
      {driverOption?.badgeLabel ? (
        <SettingsStatus variant="warning" size="sm" className="shrink-0">
          {driverOption.badgeLabel}
        </SettingsStatus>
      ) : null}
      {versionCodeNode}
      {versionAdvisoryNode}
      <span
        inert={readOnly}
        aria-disabled={readOnly || undefined}
        // Empty, it would still add a flex gap and pull the version off the column edge.
        className={cn("inline-flex items-center gap-1 empty:hidden", readOnly && "opacity-50")}
      >
        {titleTailNode}
        {onDelete ? (
          <Button
            type="button"
            size="icon-xs"
            variant="ghost-destructive"
            disabled={readOnly}
            onClick={onDelete}
            aria-label={`Delete instance ${instanceId}`}
          >
            <Trash2Icon />
          </Button>
        ) : null}
      </span>
    </div>
  );

  // Provider status gets its own row instead of hanging under the name field.
  const statusContent = (
    <>
      <ProviderStatusDiagnostic detail={statusDiagnostic}>
        <div
          tabIndex={statusDiagnostic ? 0 : undefined}
          className="flex min-w-0 flex-wrap items-baseline gap-x-2"
        >
          {editorStatusNode}
        </div>
      </ProviderStatusDiagnostic>
      {restartNotice ? (
        <p aria-live="polite" className="text-meta leading-snug wrap-anywhere">
          {restartNotice}
        </p>
      ) : null}
      {urlAuthAction && onAcceptUrlAuth ? (
        <div className="grid max-w-xl gap-2 pt-1 text-meta">
          <p>{urlAuthAction.message}</p>
          <code className="break-all text-meta">{urlAuthAction.url}</code>
          <Button
            render={
              <a
                href={urlAuthAction.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onAcceptUrlAuth(urlAuthAction)}
              />
            }
            size="xs"
            variant="outline"
            className="w-fit"
            disabled={readOnly}
          >
            <ExternalLinkIcon />
            Continue authentication
          </Button>
        </div>
      ) : null}
    </>
  );

  const runtimeFields = driverOption ? (
    <ProviderSettingsForm
      definition={driverOption}
      value={instance.config}
      idPrefix={`provider-instance-${instanceId}`}
      variant="settings"
      onChange={updateConfig}
      managed={instanceLocks && { keys: instanceLocks.configKeys, reason: instanceLocks.reason }}
      environmentId={environmentId}
    />
  ) : (
    <SettingsRow
      title="Driver"
      description={
        <span>
          This instance uses <code className="text-ink-1">{String(instance.driver)}</code>, which is
          not available in this build. Its configuration is preserved.
        </span>
      }
    />
  );

  return (
    <>
      <SettingsSection title={displayName} hideTitle>
        {/* The strip shows only the icon, so the first row names the provider: its status and switch. */}
        <SettingsRow
          title={
            <span className="flex items-center gap-2">
              {titleIconNode}
              {displayName}
            </span>
          }
          status={statusContent}
          control={
            <span className="flex items-center gap-2">
              {editorHeaderAction}
              {enableControl}
            </span>
          }
        />
        <SettingsRow
          title="Display name"
          control={
            <div
              inert={readOnly}
              aria-disabled={readOnly || undefined}
              className={cn(
                "flex w-full min-w-0 items-center justify-end gap-2 @min-[32rem]/settings-row:w-auto",
                readOnly && "opacity-50 select-none",
              )}
            >
              {/* Unset, the accent is an option, not a value: it waits for the row you point at. */}
              <span
                className={cn(
                  "flex",
                  !accentColor &&
                    "opacity-0 transition-opacity group-hover/settings-row:opacity-100 has-focus-visible:opacity-100 has-data-popup-open:opacity-100",
                )}
              >
                <ProviderAccentColorPicker
                  layout="inline"
                  displayName={displayName}
                  value={accentColor}
                  onCommit={updateAccentColor}
                />
              </span>
              <DraftInput
                id={`provider-instance-${instanceId}-display-name`}
                size="sm"
                className="min-w-0 flex-1 @min-[32rem]/settings-row:w-56"
                value={instance.displayName ?? ""}
                onCommit={updateDisplayName}
                placeholder={driverOption?.label ?? "Instance label"}
                spellCheck={false}
              />
            </div>
          }
        />
      </SettingsSection>

      {setup || environmentFields.length > 0 ? (
        <SettingsSection title="Setup">
          {setup}
          {environmentFields.length > 0 ? (
            <div
              inert={readOnly}
              aria-disabled={readOnly || undefined}
              className={readOnly ? "opacity-50 select-none" : undefined}
            >
              {environmentFields.map((field) => (
                <ProviderEnvironmentFieldRow
                  key={field.name}
                  field={field}
                  variable={readProviderEnvironmentVariable(instance.environment, field.name)}
                  idPrefix={`provider-instance-${instanceId}`}
                  onCommit={updateEnvironmentField}
                  onSecretChange={updateEnvironmentFieldSecret}
                  onRemove={removeEnvironmentField}
                  managedReason={
                    instanceLocks?.wholeEnvironment ||
                    instanceLocks?.environmentNames.has(field.name)
                      ? instanceLocks.reason
                      : undefined
                  }
                  secretSources={secretSources}
                  environmentId={environmentId}
                />
              ))}
            </div>
          ) : null}
        </SettingsSection>
      ) : null}

      {driverOption !== undefined ? (
        <SettingsSection title="Models" hideTitle>
          <ProviderModelsSection
            canManageCustomModels={!readOnly}
            canWritePreferences={canWriteSettings}
            instanceId={instanceId}
            driverKind={driverKind}
            models={modelsForDisplay}
            customModels={customModels}
            hiddenModels={hiddenModels}
            favoriteModels={favoriteModels}
            modelOrder={modelOrder}
            onChange={updateCustomModels}
            onHiddenModelsChange={onHiddenModelsChange}
            onFavoriteModelsChange={onFavoriteModelsChange}
            onToggleFavorite={onToggleFavorite}
            onModelOrderChange={onModelOrderChange}
          />
        </SettingsSection>
      ) : null}
      {/* Paths, arguments and variables are set once; the models are what people come back for. */}
      <FoldedSettingsSection
        key={instanceId}
        id={`provider-instance-${instanceId}-advanced`}
        title="Runtime and environment"
        headerPlacement="outside"
      >
        {(instance.driver === "codex" && readCodexSetupMode(instance.config) === "managed") ||
        !driverOption ||
        deriveProviderSettingsFields(driverOption).length > 0 ? (
          <SettingsSection
            title="Runtime"
            inert={readOnly}
            aria-disabled={readOnly || undefined}
            className={readOnly ? "opacity-50 select-none" : undefined}
          >
            {runtime ?? runtimeFields}
          </SettingsSection>
        ) : null}

        <SettingsSection
          title="Environment"
          inert={readOnly || instanceLocks?.wholeEnvironment}
          aria-disabled={readOnly || instanceLocks?.wholeEnvironment || undefined}
          className={readOnly ? "opacity-50 select-none" : undefined}
        >
          {instanceLocks?.wholeEnvironment ? (
            <ManagedNotice>{instanceLocks.reason}</ManagedNotice>
          ) : null}
          <div className={instanceLocks?.wholeEnvironment ? "opacity-50" : undefined}>
            <ProviderEnvironmentSection
              environment={genericEnvironment}
              onChange={updateGenericEnvironment}
              secretSources={secretSources}
              environmentId={environmentId}
              managed={
                instanceLocks && {
                  names: instanceLocks.environmentNames,
                  reason: instanceLocks.reason,
                }
              }
            />
          </div>
        </SettingsSection>
      </FoldedSettingsSection>
      {environmentId !== undefined && liveProvider?.driver === "acpRegistry" ? (
        <AcpSessionManagementSection
          environmentId={environmentId}
          instanceId={instanceId}
          provider={liveProvider}
          projects={acpProjects}
          readOnly={readOnly}
        />
      ) : null}
    </>
  );
}
