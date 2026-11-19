import {
  type EnvironmentId,
  isSecretReference,
  type ProviderInstanceId,
  type SecretReference,
  type ServerProvider,
  TextGeneratorConfig,
  type TextGeneratorModel,
} from "@t3tools/contracts";
import { pickModelSelection } from "@t3tools/shared/model";
import { AsyncResult } from "effect/reactivity";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";
import { MoreVertical, PlusIcon, ServerIcon } from "lucide-react";
import { cn } from "~/lib/utils";
import { useState } from "react";
import { msg, T, useGT, useMessages, Var } from "gt-react";

import { useEnvironmentSettings, useUpdateEnvironmentSettings } from "../../hooks/useSettings";
import {
  checkTextGeneratorConfig,
  rereadTextGeneratorModels,
  nextTextGeneratorId,
  refreshTextGeneratorModels,
  testTextGeneratorModel,
  useTextGenerationTargets,
  useTextGeneratorModels,
  TEXT_GENERATOR_PRESETS,
  type TextGeneratorPreset,
  textGeneratorBrand,
  textGeneratorDisplayName,
} from "../../textGenerators";
import { getTextGenerationModelOptionsByInstance } from "../../modelSelection";
import { ProviderInstanceIcon } from "../chat/ProviderInstanceIcon";
import { ProviderModelPicker } from "../chat/ProviderModelPicker";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { RefreshIcon } from "../ui/refresh-icon";
import { toastManager } from "../ui/toast";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "../ui/menu";
import { Field } from "../ui/field";
import { Spinner } from "../ui/spinner";
import { Switch } from "../ui/switch";
import { WizardFooter, WizardHeader, WizardPanel, WizardPopup, WizardSteps } from "../ui/wizard";
import { SecretSourceInput, useSecretSources } from "./SecretSourceInput";
import { useSearchableSetting } from "./settingsSearch";
import { SETTINGS_PICKER_TRIGGER_CLASSNAME, SettingsRow, SettingsSection } from "./settingsLayout";

const decodeTextGenerator = Schema.decodeUnknownOption(TextGeneratorConfig);

type Saved = { readonly id: ProviderInstanceId; readonly config: TextGeneratorConfig };
type Editing = Saved | "new";

/** Rows that list, add, edit, and remove one environment's text generators. */
export function TextGeneratorsSettings({
  environmentId,
  environmentLabel,
  providers,
  readOnly,
}: {
  readonly environmentId: EnvironmentId;
  readonly environmentLabel: string;
  readonly providers: ReadonlyArray<ServerProvider>;
  readonly readOnly: boolean;
}) {
  const setting = useSearchableSetting();
  const gt = useGT();
  const messages = useMessages();
  const settings = useEnvironmentSettings(environmentId);
  const updateSettings = useUpdateEnvironmentSettings(environmentId);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [removing, setRemoving] = useState<ProviderInstanceId | null>(null);
  const [viewing, setViewing] = useState<Saved | null>(null);
  const generators = Object.entries(settings.textGenerators) as Array<
    [ProviderInstanceId, TextGeneratorConfig]
  >;
  const removingConfig = removing === null ? undefined : settings.textGenerators[removing];

  return (
    <>
      <SettingsSection
        {...setting("text-generators")}
        headerAction={
          !readOnly ? (
            <Button size="xs" variant="ghost-muted" onClick={() => setEditing("new")}>
              <PlusIcon aria-hidden />
              <T>Add generator</T>
            </Button>
          ) : null
        }
      >
        {generators.length === 0 ? (
          <p className="px-2 text-meta text-ink-2">
            <T>
              A model API that writes thread titles and commit messages without starting a coding
              agent.
            </T>
          </p>
        ) : null}
        {generators.map(([id, config]) => {
          const name = textGeneratorDisplayName(config, messages);
          return (
            <SettingsRow
              key={id}
              title={
                <span className="inline-flex items-center gap-2">
                  <ProviderInstanceIcon
                    driverKind={textGeneratorBrand(config)}
                    displayName={name}
                    badgeContent="none"
                  />
                  {name}
                </span>
              }
              description={
                // Indented past the icon so it lines up with the name.
                <span className="block truncate ps-8">
                  {config.enabled ? "" : gt("Off · ")}
                  {config.baseUrl.replace(/^https?:\/\//, "")}
                </span>
              }
              control={
                readOnly ? null : (
                  <div className="flex items-center gap-2">
                    <Menu>
                      <MenuTrigger
                        render={
                          <Button
                            size="icon-sm"
                            variant="ghost-muted"
                            aria-label={gt("More actions for {name}", { name })}
                          />
                        }
                      >
                        <MoreVertical />
                      </MenuTrigger>
                      <MenuPopup align="end">
                        <MenuItem onClick={() => setEditing({ id, config })}>
                          <T>Edit</T>
                        </MenuItem>
                        <MenuItem
                          disabled={!config.enabled}
                          onClick={() => setViewing({ id, config })}
                        >
                          <T>Show models</T>
                        </MenuItem>
                        <MenuItem variant="destructive" onClick={() => setRemoving(id)}>
                          <T>Remove</T>
                        </MenuItem>
                      </MenuPopup>
                    </Menu>
                    <Switch
                      checked={config.enabled}
                      onCheckedChange={(enabled) =>
                        updateSettings({ textGenerators: { [id]: { ...config, enabled } } })
                      }
                      aria-label={gt("Enable {name}", { name })}
                    />
                  </div>
                )
              }
            />
          );
        })}
      </SettingsSection>
      {editing !== null ? (
        <TextGeneratorWizard
          environmentId={environmentId}
          editing={editing}
          providers={providers}
          onClose={() => setEditing(null)}
          onSave={(id, config) =>
            updateSettings(
              { textGenerators: { [id]: config } },
              { onSaved: () => rereadTextGeneratorModels(environmentId, id) },
            )
          }
          newId={(preset) => nextTextGeneratorId(preset.id, settings, providers)}
        />
      ) : null}
      {viewing !== null ? (
        <TextGeneratorModelsDialog
          environmentId={environmentId}
          saved={viewing}
          onClose={() => setViewing(null)}
        />
      ) : null}
      <AlertDialog
        open={removingConfig !== undefined}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
      >
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <T>
                Remove{" "}
                <Var>
                  {removingConfig ? textGeneratorDisplayName(removingConfig, messages) : ""}
                </Var>
                ?
              </T>
            </AlertDialogTitle>
            <AlertDialogDescription>
              <T>
                This deletes the API key stored on <Var>{environmentLabel}</Var>. Anything set to
                use this generator falls back to the text generation model.
              </T>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline" />}>
              <T>Cancel</T>
            </AlertDialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                if (removing !== null) updateSettings({ textGenerators: { [removing]: null } });
                setRemoving(null);
              }}
            >
              <T>Remove</T>
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </>
  );
}

const STEPS = [msg("Connect", { $context: "wizard step" }), msg("Use it")] as const;

/** Text tasks a generator can write, in the order the settings pages show them. */
const TASKS = [
  { key: "textGenerationModelSelection", label: msg("Thread titles and other generated text") },
  {
    key: "sourceControlWriterModelSelection",
    label: msg("Commit messages, pull requests, and branch names"),
  },
  { key: "speechPostProcessingModelSelection", label: msg("Voice transcript cleanup") },
] as const;

/**
 * Connect checks the settings by listing the service's models and saves the generator; Use it then
 * shows each text task's model picker, so any of them can switch to it. The key goes once to the
 * environment's secret storage; settings keep only a redaction marker.
 */
function TextGeneratorWizard({
  environmentId,
  editing,
  providers,
  onClose,
  onSave,
  newId,
}: {
  readonly environmentId: EnvironmentId;
  readonly editing: Editing;
  readonly providers: ReadonlyArray<ServerProvider>;
  readonly onClose: () => void;
  readonly onSave: (id: ProviderInstanceId, config: TextGeneratorConfig) => void;
  readonly newId: (preset: TextGeneratorPreset) => ProviderInstanceId;
}) {
  const messages = useMessages();
  const gt = useGT();
  const existing = editing === "new" ? null : editing.config;
  const [step, setStep] = useState(0);
  const [preset, setPreset] = useState(TEXT_GENERATOR_PRESETS[0]!);
  const [baseUrl, setBaseUrl] = useState(existing?.baseUrl ?? preset.baseUrl);
  const [label, setLabel] = useState(existing?.label ?? "");
  const secretSources = useSecretSources(environmentId);
  const [keyDraft, setKeyDraft] = useState<string | SecretReference>(
    isSecretReference(existing?.apiKey) ? existing.apiKey : "",
  );
  const [keyValid, setKeyValid] = useState(true);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [modelCount, setModelCount] = useState(0);
  // Fixed once saved, so editing the form again after Back updates the same generator.
  const [savedId, setSavedId] = useState<ProviderInstanceId | null>(
    editing === "new" ? null : editing.id,
  );

  // A saved literal key arrives redacted; sending the marker back keeps it.
  const storedKey = typeof existing?.apiKey === "string" ? existing.apiKey : "";
  const apiKey = typeof keyDraft === "string" ? keyDraft.trim() || storedKey : keyDraft;
  const kind = existing?.kind ?? preset.kind;
  const config = decodeTextGenerator({
    kind,
    ...(label.trim() ? { label: label.trim() } : {}),
    baseUrl: baseUrl.trim(),
    apiKey,
    enabled: existing?.enabled ?? true,
  });
  const keyRequired = existing === null && preset.id !== "custom";
  // Presets know their URL; only a custom endpoint, or one already saved as such, asks for it.
  const showBaseUrl =
    existing === null
      ? preset.id === "custom"
      : !["openai", "anthropic", "openrouter"].includes(textGeneratorBrand(existing));
  const canConnect = keyValid && Option.isSome(config) && (!keyRequired || apiKey !== "");
  const name = Option.isSome(config)
    ? textGeneratorDisplayName(config.value, messages)
    : messages(preset.label);

  const connect = async () => {
    if (!canConnect || checking) return;
    const id = savedId ?? newId(preset);
    setChecking(true);
    setCheckError(null);
    // The form is disabled while this runs, so the checked config is the one saved below.
    const result = await checkTextGeneratorConfig(environmentId, id, config.value);
    setChecking(false);
    if ("error" in result) {
      setCheckError(result.error);
      return;
    }
    onSave(id, config.value);
    setSavedId(id);
    setModelCount(result.models.length);
    setStep(1);
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <WizardPopup>
        <WizardHeader
          title={
            existing
              ? gt("Edit {name}", { name: textGeneratorDisplayName(existing, messages) })
              : gt("Add a text generator")
          }
          description={gt(
            "Writes thread titles, commit messages, and other short text without starting a coding agent. Your API key is stored on this environment.",
          )}
        >
          <WizardSteps
            steps={STEPS.map((step) => messages(step))}
            currentStep={step}
            isStepDisabled={(index) => index > step}
            onStepChange={setStep}
          />
        </WizardHeader>
        <WizardPanel>
          {step === 0 ? (
            <form
              className="grid gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void connect();
              }}
            >
              <fieldset disabled={checking} className="contents">
                {existing === null ? (
                  <div className="grid gap-2">
                    <span className="text-body font-medium">
                      <T>Service</T>
                    </span>
                    <div
                      role="radiogroup"
                      aria-label={gt("Service")}
                      className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                    >
                      {TEXT_GENERATOR_PRESETS.map((candidate) => {
                        const selected = candidate.id === preset.id;
                        return (
                          <button
                            key={candidate.id}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            className={
                              selected
                                ? "flex flex-col items-center gap-2 rounded-row border border-primary bg-primary/5 px-2 py-2 text-body font-medium text-ink-1 ring-1 ring-primary ring-inset outline-none focus-visible:ring-2 focus-visible:ring-inset"
                                : "flex flex-col items-center gap-2 rounded-row border bg-background px-2 py-2 text-body text-ink-2 outline-none hover:bg-accent/50 hover:text-ink-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                            }
                            onClick={() => {
                              setPreset(candidate);
                              setBaseUrl(candidate.baseUrl);
                              setCheckError(null);
                            }}
                          >
                            {candidate.id === "custom" ? (
                              <ServerIcon className="size-5" aria-hidden />
                            ) : (
                              <ProviderInstanceIcon
                                driverKind={textGeneratorBrand(candidate)}
                                displayName={candidate.label}
                                badgeContent="none"
                              />
                            )}
                            {candidate.id === "custom" ? gt("Custom") : candidate.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                {showBaseUrl ? (
                  <Field label={<T>Base URL</T>} htmlFor="text-generator-url" stacked>
                    <Input
                      id="text-generator-url"
                      placeholder="http://localhost:11434/v1"
                      value={baseUrl}
                      onChange={(event) => {
                        setBaseUrl(event.target.value);
                        setCheckError(null);
                      }}
                      spellCheck={false}
                      autoFocus={existing === null && preset.id === "custom"}
                    />
                  </Field>
                ) : null}
                <Field
                  label={keyRequired ? gt("API key") : gt("API key (optional)")}
                  htmlFor="text-generator-key"
                  stacked
                >
                  <SecretSourceInput
                    id="text-generator-key"
                    aria-label={gt("API key")}
                    value={keyDraft}
                    configured={storedKey !== ""}
                    sources={secretSources}
                    onChange={(event) => {
                      setKeyDraft(event.target.value);
                      setCheckError(null);
                    }}
                    onSecretChange={(secret) => setKeyDraft(secret ?? "")}
                    autoFocus={existing === null && preset.id !== "custom"}
                    onValidityChange={setKeyValid}
                  />
                </Field>
                <Field label={<T>Name (optional)</T>} htmlFor="text-generator-label" stacked>
                  <Input
                    id="text-generator-label"
                    placeholder={
                      existing !== null
                        ? textGeneratorDisplayName(existing, messages)
                        : preset.id === "custom"
                          ? gt("e.g. My local model")
                          : messages(preset.label)
                    }
                    value={label}
                    onChange={(event) => setLabel(event.target.value)}
                  />
                </Field>
                {checkError ? (
                  <p role="alert" className="text-body text-destructive">
                    {checkError}
                  </p>
                ) : null}
              </fieldset>
            </form>
          ) : (
            <div className="grid gap-2">
              <p className="text-body text-ink-2">
                {gt(
                  "{count, plural, one {{name} is connected and lists {count} model. Switch any of these to it, or keep what they use now.} other {{name} is connected and lists {count} models. Switch any of these to it, or keep what they use now.}}",
                  { name, count: modelCount },
                )}
              </p>
              {/* One grid for all rows, so pickers and Test buttons line up in columns. */}
              <div className="grid items-center gap-x-2 gap-y-2" data-slot="text-generation-tasks">
                {TASKS.map((task) => (
                  <TextGenerationTaskPicker
                    key={task.key}
                    environmentId={environmentId}
                    providers={providers}
                    settingKey={task.key}
                    label={messages(task.label)}
                  />
                ))}
              </div>
            </div>
          )}
        </WizardPanel>
        <WizardFooter
          leading={
            step > 0 ? (
              <Button variant="ghost" onClick={() => setStep(0)}>
                <T>Back</T>
              </Button>
            ) : null
          }
        >
          {step === 0 ? (
            <>
              <Button variant="outline" onClick={onClose}>
                <T>Cancel</T>
              </Button>
              <Button onClick={() => void connect()} disabled={!canConnect || checking}>
                {checking ? <Spinner /> : null}
                {checking ? gt("Connecting") : existing ? gt("Save and continue") : gt("Connect")}
              </Button>
            </>
          ) : (
            // Connect's button unmounts here; without this, focus lands on the step list.
            <Button autoFocus onClick={onClose}>
              <T>Done</T>
            </Button>
          )}
        </WizardFooter>
      </WizardPopup>
    </Dialog>
  );
}

/** One text task's model, saved as it changes, with every text generation target to pick from. */
function TextGenerationTaskPicker({
  environmentId,
  providers,
  settingKey,
  label,
}: {
  readonly environmentId: EnvironmentId;
  readonly providers: ReadonlyArray<ServerProvider>;
  readonly settingKey: (typeof TASKS)[number]["key"];
  readonly label: string;
}) {
  const settings = useEnvironmentSettings(environmentId);
  const updateSettings = useUpdateEnvironmentSettings(environmentId);
  const own = settings[settingKey];
  // Source control and voice follow the text generation model until they get their own.
  const selection = own ?? settings.textGenerationModelSelection;
  const targets = useTextGenerationTargets({
    environmentId,
    settings,
    providers: providers.filter((provider) => provider.supportsTextGeneration !== false),
    projectId: null,
    selections: [selection],
  });
  // Only a text generator's model can be tried cheaply; agents start a whole session.
  const testable = Object.hasOwn(settings.textGenerators, selection.instanceId);
  const testKey = `${selection.instanceId}:${selection.model}`;
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{
    readonly key: string;
    readonly error: string | null;
  } | null>(null);
  const shown = result?.key === testKey ? result : null;
  const test = async () => {
    setTesting(true);
    const error = await testTextGeneratorModel(
      environmentId,
      selection.instanceId,
      selection.model,
    );
    setTesting(false);
    setResult({ key: testKey, error });
  };
  return (
    <>
      <div className="grid min-w-0 pe-2">
        <span className="text-body">{label}</span>
        {shown?.error ? (
          <span role="alert" className="text-meta text-destructive">
            {shown.error}
          </span>
        ) : shown ? (
          <span role="status" className="text-meta text-ink-2">
            <T>
              <Var>{selection.model}</Var> answered. It works.
            </T>
          </span>
        ) : own === null ? (
          <span className="text-meta text-ink-2">
            <T>Follows the text generation model</T>
          </span>
        ) : null}
      </div>
      <div className="justify-self-end">
        <ProviderModelPicker
          environmentId={environmentId}
          activeInstanceId={selection.instanceId}
          model={selection.model}
          lockedProvider={null}
          instanceEntries={targets.entries}
          modelOptionsByInstance={getTextGenerationModelOptionsByInstance(
            settings,
            targets.providers,
            selection.instanceId,
            selection.model,
          )}
          triggerClassName={SETTINGS_PICKER_TRIGGER_CLASSNAME}
          onInstanceModelChange={(instanceId, model) =>
            updateSettings({ [settingKey]: pickModelSelection(selection, instanceId, model) })
          }
        />
      </div>
      <div className="justify-self-end">
        {testable ? (
          <Button
            size="xs"
            variant="outline"
            aria-busy={testing}
            disabled={testing}
            onClick={() => void test()}
          >
            {/* Keeps the label's width while testing, so the row never reflows. */}
            <span className="relative">
              <span className={testing ? "invisible" : undefined}>
                <T>Test</T>
              </span>
              {testing ? (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Spinner />
                </span>
              ) : null}
            </span>
          </Button>
        ) : null}
      </div>
    </>
  );
}

/** Searchable models; selectable when `onSelect` is given. */
function TextGeneratorModelList({
  models,
  selected,
  onSelect,
}: {
  readonly models: ReadonlyArray<TextGeneratorModel>;
  readonly selected?: string | null;
  readonly onSelect?: (id: string) => void;
}) {
  const gt = useGT();
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const shown = needle
    ? models.filter(
        (model) =>
          model.id.toLowerCase().includes(needle) || model.name.toLowerCase().includes(needle),
      )
    : models;
  return (
    <div className="grid gap-2">
      {models.length > 8 ? (
        <Input
          type="search"
          placeholder={gt("Search models")}
          aria-label={gt("Search models")}
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      ) : null}
      <div className="max-h-80 overflow-y-auto rounded-row border">
        {shown.length === 0 ? (
          <p className="px-2 py-2 text-body text-ink-2">
            <T>No models match.</T>
          </p>
        ) : (
          <ul role={onSelect ? "listbox" : "list"} aria-label={gt("Models")}>
            {shown.map((model) => {
              const isSelected = model.id === selected;
              const label = (
                <>
                  <span className="grid min-w-0 flex-1">
                    <span className="truncate">{model.name}</span>
                    {model.name !== model.id ? (
                      <span className="truncate font-mono text-meta text-ink-2">{model.id}</span>
                    ) : null}
                  </span>
                </>
              );
              return (
                <li
                  key={model.id}
                  role={onSelect ? "option" : undefined}
                  aria-selected={onSelect ? isSelected : undefined}
                >
                  {onSelect ? (
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-2 px-2 py-2 text-left text-body hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
                        isSelected && "bg-foreground/8",
                      )}
                      onClick={() => onSelect(model.id)}
                    >
                      {label}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 px-2 py-2 text-body">{label}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/** A saved generator's models, with a refresh that asks the API again. */
function TextGeneratorModelsDialog({
  environmentId,
  saved,
  onClose,
}: {
  readonly environmentId: EnvironmentId;
  readonly saved: Saved;
  readonly onClose: () => void;
}) {
  const gt = useGT();
  const messages = useMessages();
  const name = textGeneratorDisplayName(saved.config, messages);
  const result = useTextGeneratorModels(environmentId, saved.id, saved.config);
  const [refreshing, setRefreshing] = useState(false);
  const refresh = async () => {
    setRefreshing(true);
    const outcome = await refreshTextGeneratorModels(environmentId, saved.id);
    setRefreshing(false);
    if ("error" in outcome) {
      toastManager.add({
        type: "error",
        title: gt("Couldn't load {name} models", { name }),
        description: outcome.error,
      });
    }
  };
  const models = AsyncResult.isSuccess(result) ? result.value : null;
  const error = Option.getOrUndefined(AsyncResult.error(result));
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPopup size="sm">
        <DialogHeader>
          <DialogTitle>{gt("{name} models", { name })}</DialogTitle>
          <DialogDescription>
            {models === null
              ? error
                ? gt("The model list couldn't load.")
                : gt("Loading the model list.")
              : gt(
                  "{count, plural, one {{count} model available. Pick one in a text generation model picker.} other {{count} models available. Pick one in a text generation model picker.}}",
                  { count: models.length },
                )}
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          {error ? (
            <p role="alert" className="text-body text-destructive">
              {error}
            </p>
          ) : models === null ? (
            <Spinner tone="muted" />
          ) : (
            <TextGeneratorModelList models={models} />
          )}
        </DialogPanel>
        <DialogFooter>
          <Button
            variant="outline"
            aria-busy={refreshing}
            disabled={refreshing}
            onClick={() => void refresh()}
          >
            <RefreshIcon refreshing={refreshing} />
            <T>Refresh</T>
          </Button>
          <Button onClick={onClose}>
            <T>Done</T>
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
