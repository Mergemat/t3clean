import { ChatGptUsageButton } from "../settings/ChatGptUsageButton";
import { usesChatGptSharing } from "@t3tools/shared/usageLimits";
import { RefreshIcon } from "~/components/ui/refresh-icon";
import { useAtomValue } from "@effect/atom-react";
import { Atom } from "effect/reactivity";
import {
  USAGE_CONTRACT_VERSION,
  type EnvironmentId,
  type UsageProviderKind,
  type UsageSummaryInput,
} from "@t3tools/contracts";
import {
  CircleAlertIcon,
  ChevronDownIcon,
  InfoIcon,
  SlidersHorizontalIcon,
  XIcon,
} from "lucide-react";
import { T, useGT, useLocale, useMessages, Var } from "gt-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { settlePromise } from "@t3tools/client-runtime/state/runtime";
import * as AsyncResult from "effect/reactivity/AsyncResult";
import * as Cause from "effect/Cause";
import { refreshUsageLimits } from "@t3tools/client-runtime/state/usage";
import {
  updatingProvidersLabel,
  usageEnvironmentProgress,
  usageLoadingState,
} from "@t3tools/client-runtime/state/usage-progress";

import {
  isCompatibleUsageContractVersion,
  isModelCostUnknown,
  type DailyTotals,
  type HourlyTotals,
  type MergedUsage,
} from "@t3tools/shared/usageMerge";

import { cn } from "../../lib/utils";
import { usePrimarySettings } from "../../hooks/useSettings";
import { resolveHour12 } from "../../timestampFormat";
import { appAtomRegistry } from "~/rpc/atomRegistry";
import { environmentPresentations } from "../../state/presentation";
import { primaryServerKeybindingsAtom, serverEnvironment } from "../../state/server";
import { isCommandPaletteOpen } from "../../commandPaletteBus";
import { isModelPickerOpen } from "../../modelPickerVisibility";
import { shortcutLabelForCommand } from "../../keybindings";
import { useUsage, type EnvironmentUsageStatus } from "../../state/usage";
import { useAtomCommand } from "../../state/use-atom-command";
import {
  enumerateDays,
  enumerateHourStarts,
  formatCount,
  formatDateTimeShort,
  formatDayShort,
  formatHourShort,
  formatPercent,
  formatTokens,
  formatUsd,
  makeWindow,
} from "@t3tools/shared/usageFormat";
import { formatUsageContractMismatch, usageSourceMessages } from "@t3tools/shared/usageFormatCopy";
import { Button, InlineButton } from "../ui/button";
import { ProviderInstanceIcon } from "../chat/ProviderInstanceIcon";
import {
  Menu,
  MenuCheckboxItem,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "../ui/menu";
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "../ui/select";
import { Skeleton } from "../ui/skeleton";
import { Toggle, ToggleGroup } from "../ui/toggle-group";
import { Popover, PopoverPopup, PopoverTrigger } from "../ui/popover";
import {
  WorkspaceBreadcrumb,
  WorkspaceBreadcrumbItem,
  WorkspaceBreadcrumbSeparator,
  WorkspaceBreadcrumbText,
} from "../WorkspaceBreadcrumb";
import { UsageLimitsSection } from "./UsageLimits";
import { UsagePriceOverrides } from "./UsagePriceOverrides";
import { UsageProviderChart } from "./UsageProviderChart";
import { PageSection, WindowPage } from "../WindowPage";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../ui/tooltip";
import { WorkspacePageHeader } from "../WorkspacePageHeader";
import { SidebarInset } from "../ui/sidebar";
import { isElectron } from "~/env";
import { SpeedPremium, UsageModelDialog } from "./UsageModelDialog";
import { UsageShareBar } from "./UsageShareBar";
import { UsageDot, UsageRow } from "./UsageRow";
import {
  costTypeSegments,
  modelShare,
  sortModelsByTokens,
  speedCostSegments,
  tokenTypeSegments,
} from "./usageBreakdown";
import {
  METRIC_OPTIONS,
  WINDOW_OPTIONS,
  resolveUsageShortcut,
  type UsageMetric,
} from "./usageShortcuts";
import {
  PROVIDER_ORDER,
  PROVIDER_PRESENTATION,
  providersWithUsage,
  rankProvidersByMetric,
} from "./usageProviders";
import {
  readUsagePagePreferences,
  saveUsagePagePreferences,
  type UsagePagePreferences,
} from "./usagePagePreferences";
import { useCloseAppModal } from "../sidebar/mainAppLocation";

function isUsageMetric(value: string | null | undefined): value is UsageMetric {
  return METRIC_OPTIONS.some((option) => option.value === value);
}

function isUsageWindowDays(value: number): value is UsagePagePreferences["windowDays"] {
  return WINDOW_OPTIONS.some((option) => option.days === value);
}

const providerLabel = (provider: UsageProviderKind) => PROVIDER_PRESENTATION[provider].label;

function usageLoading(
  showingKept: boolean,
  selectedEnvironments: Parameters<typeof usageLoadingState>[0],
  refreshingUsage: boolean,
  hiddenProviders: ReadonlySet<UsageProviderKind>,
) {
  if (showingKept) {
    return { partial: true, everyProvider: true, providers: new Set<UsageProviderKind>() };
  }
  const state = usageLoadingState(selectedEnvironments, refreshingUsage);
  const providers = new Set([...state.providers].filter((p) => !hiddenProviders.has(p)));
  return {
    partial: state.everyProvider || providers.size > 0,
    everyProvider: state.everyProvider,
    providers,
  };
}

/** Keep dialog selection outside UsagePage so opening/closing rerenders only its host. */
const selectedUsageModelKeyAtom = Atom.make<string | null>(null).pipe(
  Atom.keepAlive,
  Atom.withLabel("usage:selected-model-key"),
);

function selectUsageModel(key: string | null): void {
  appAtomRegistry.set(selectedUsageModelKeyAtom, key);
}

function UsageModelDialogHost({
  models,
  onSetPrice,
  ...dialogProps
}: Omit<Parameters<typeof UsageModelDialog>[0], "model" | "onSetPrice" | "onClose"> & {
  readonly models: MergedUsage["models"];
  readonly onSetPrice: (model: string) => void;
}) {
  const selectedKey = useAtomValue(selectedUsageModelKeyAtom);
  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- clears the shared selected-model atom on unmount
  useEffect(() => () => selectUsageModel(null), []);
  const model =
    selectedKey === null
      ? undefined
      : models.find((candidate) => `${candidate.provider}:${candidate.model}` === selectedKey);
  if (model === undefined) return null;
  return (
    <UsageModelDialog
      {...dialogProps}
      model={model}
      onSetPrice={() => {
        selectUsageModel(null);
        onSetPrice(model.model);
      }}
      onClose={() => selectUsageModel(null)}
    />
  );
}

export function UsagePage() {
  const [preferences, setPreferences] = useState(readUsagePagePreferences);
  const closePage = useCloseAppModal();
  const keybindings = useAtomValue(primaryServerKeybindingsAtom);
  const hour12 = usePrimarySettings((settings) => resolveHour12(settings.timestampFormat));
  const gt = useGT();
  const locale = useLocale();
  const m = useMessages();
  const shortcutTitle = (
    option: (typeof METRIC_OPTIONS)[number] | (typeof WINDOW_OPTIONS)[number],
  ) => {
    const shortcut = shortcutLabelForCommand(keybindings, option.command, {
      context: { usagePageOpen: true },
    });
    return shortcut
      ? gt("{label} ({shortcut})", { label: m(option.label), shortcut })
      : m(option.label);
  };
  const [windowSelection, setWindowSelection] = useState(() => ({
    days: preferences.windowDays,
    window: makeWindow(
      preferences.windowDays,
      undefined,
      preferences.windowDays === 1 ? "hour" : "day",
    ),
  }));
  const metric = preferences.metric;
  const showingLimits = metric === "limits";
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [limitsNow, setLimitsNow] = useState(() => Date.now());
  const refreshingRef = useRef(false);
  const [priceDialog, setPriceDialog] = useState<{ readonly model?: string } | null>(null);
  const [selectedEnvironmentIds, setSelectedEnvironmentIds] =
    useState<ReadonlySet<EnvironmentId> | null>(null);
  const hiddenProviders = new Set(preferences.hiddenProviders);
  const { days: windowDays, window } = windowSelection;
  const isPast24Hours = windowDays === 1;
  const {
    merged: answeredUsage,
    environments,
    selectedEnvironments,
    shown,
    isPartial,
    refresh,
  } = useUsage(window, selectedEnvironmentIds, hiddenProviders);
  const merged = shown?.merged ?? answeredUsage;
  const shownWindow = shown?.window ?? window;
  const shownHourly = shownWindow.resolution === "hour";
  const refreshingUsage = isRefreshing && !showingLimits;
  const showingKept = shown !== null && shown.window !== window;
  const presentations = useAtomValue(environmentPresentations.presentationsAtom);
  const presentationsWithProviders = useAtomValue(
    environmentPresentations.presentationsWithProvidersAtom,
  );
  const refreshProviders = useAtomCommand(serverEnvironment.refreshProviders, {
    reportFailure: false,
  });

  const canReadDiagnostics = selectedEnvironments.some(
    (environment) => environment.canReadDiagnostics,
  );

  const updatePreferences = (patch: Partial<UsagePagePreferences>) => {
    const nextPreferences = { ...preferences, ...patch };
    setPreferences(nextPreferences);
    saveUsagePagePreferences(nextPreferences);
  };
  const selectWindow = (days: number) => {
    if (!isUsageWindowDays(days)) return;
    updatePreferences({ windowDays: days });
    setWindowSelection({
      days,
      window: makeWindow(days, undefined, days === 1 ? "hour" : "day"),
    });
  };
  const selectMetric = (nextMetric: UsageMetric) => {
    if (nextMetric === "limits") setLimitsNow(Date.now());
    updatePreferences({ metric: nextMetric });
  };
  const refreshLimits = (automatic = false) =>
    // Settled so the timestamp still advances when a refresh throws.
    settlePromise(() =>
      Promise.all(
        Array.from(presentations, ([environmentId, presentation]) => {
          if (selectedEnvironmentIds !== null && !selectedEnvironmentIds.has(environmentId)) return;
          if (presentation.connection.phase === "connected" && presentation.serverConfig !== null) {
            return refreshUsageLimits(
              environmentId,
              () => refreshProviders({ environmentId, input: {} }),
              automatic,
            );
          }
        }),
      ),
    ).then((result) => {
      setLimitsNow(Date.now());
      if (!AsyncResult.isSuccess(result)) throw Cause.squash(result.cause);
    });
  const onUsageKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (
      event.defaultPrevented ||
      event.repeat ||
      event.isComposing ||
      isCommandPaletteOpen() ||
      isModelPickerOpen()
    )
      return;

    // Esc leaves, as it left the modal Usage used to be; a menu or dialog takes it first.
    if (event.key === "Escape") {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest('[data-slot$="popup"], [role="dialog"], input, textarea')
      )
        return;
      event.preventDefault();
      void closePage();
      return;
    }
    const command = resolveUsageShortcut(event, keybindings);
    const metricOption = METRIC_OPTIONS.find((option) => option.command === command);
    const periodOption = WINDOW_OPTIONS.find((option) => option.command === command);
    if (!metricOption && !periodOption) return;

    event.preventDefault();
    event.stopPropagation();
    if (metricOption) selectMetric(metricOption.value);
    if (periodOption && !showingLimits) selectWindow(periodOption.days);
  });

  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- window capture keydown listener for usage metric and period shortcuts
  useEffect(() => {
    globalThis.window.addEventListener("keydown", onUsageKeyDown, true);
    return () => globalThis.window.removeEventListener("keydown", onUsageKeyDown, true);
  }, []);

  const refreshWindow = () => {
    if (refreshingRef.current) return;

    if (showingLimits) {
      refreshingRef.current = true;
      setIsRefreshing(true);
      void refreshLimits().finally(() => {
        refreshingRef.current = false;
        setIsRefreshing(false);
      });
      return;
    }
    const nextWindow = makeWindow(windowDays, undefined, isPast24Hours ? "hour" : "day");
    if (
      nextWindow.sinceDay !== window.sinceDay ||
      nextWindow.untilDay !== window.untilDay ||
      nextWindow.sinceTime !== window.sinceTime ||
      nextWindow.untilTime !== window.untilTime
    ) {
      setWindowSelection({ days: windowDays, window: nextWindow });
    }
    refreshingRef.current = true;
    setIsRefreshing(true);
    void refresh(nextWindow).finally(() => {
      refreshingRef.current = false;
      setIsRefreshing(false);
    });
  };
  const connectedLimitsEnvironments = [...presentations]
    .filter(
      ([environmentId, presentation]) =>
        presentation.connection.phase === "connected" &&
        presentation.serverConfig !== null &&
        (selectedEnvironmentIds === null || selectedEnvironmentIds.has(environmentId)),
    )
    .map(([environmentId]) => environmentId)
    .sort()
    .join(",");
  const autoRefreshLimits = useEffectEvent(() => {
    void refreshLimits(true);
  });
  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- refreshes provider limits from the server when the connected environment set changes
  useEffect(() => {
    if (showingLimits && connectedLimitsEnvironments) autoRefreshLimits();
  }, [showingLimits, connectedLimitsEnvironments]);

  const days = enumerateDays(shownWindow.sinceDay, shownWindow.untilDay);
  const hours =
    shownWindow.sinceTime === undefined || shownWindow.untilTime === undefined
      ? []
      : enumerateHourStarts(shownWindow.sinceTime, shownWindow.untilTime);
  const showChatGptSharing =
    !hiddenProviders.has("codex") &&
    [...presentationsWithProviders].some(
      ([id, presentation]) =>
        (selectedEnvironmentIds === null || selectedEnvironmentIds.has(id)) &&
        (presentation.serverConfig?.providers ?? []).some(usesChatGptSharing),
    );

  const windowLabel =
    shownHourly && shownWindow.sinceTime !== undefined && shownWindow.untilTime !== undefined
      ? gt("{start} to {end}", {
          start: formatDateTimeShort(shownWindow.sinceTime, shownWindow.timeZone, hour12, locale),
          end: formatDateTimeShort(shownWindow.untilTime, shownWindow.timeZone, hour12, locale),
        })
      : gt("{start} to {end}", {
          start: formatDayShort(shownWindow.sinceDay, locale),
          end: formatDayShort(shownWindow.untilDay, locale),
        });
  const windowOptionLabel = WINDOW_OPTIONS.find((option) => option.days === windowDays)?.label;
  const metricOptionLabel = METRIC_OPTIONS.find((option) => option.value === metric)?.label;
  const topbarContent = (
    <div className="grid w-full min-w-0 grid-cols-(--grid-trail) items-center gap-x-2 @4xl/usage-header:flex">
      <WorkspaceBreadcrumb ariaLabel={gt("Usage breadcrumb")} className="min-w-0">
        <WorkspaceBreadcrumbItem>
          <h1>
            <T>Usage</T>
          </h1>
        </WorkspaceBreadcrumbItem>
        <WorkspaceBreadcrumbSeparator />
        <WorkspaceBreadcrumbItem className="min-w-10 shrink">
          <UsageEnvironmentFilter
            environments={environments}
            selectedEnvironments={selectedEnvironments}
            selectedEnvironmentIds={selectedEnvironmentIds}
            onSelectionChange={setSelectedEnvironmentIds}
            showUsageStatus={!showingLimits}
            refreshing={refreshingUsage}
            isPartial={isPartial}
            duplicateSources={merged.duplicateSources}
            contractMismatches={merged.contractMismatches}
            onOpenModelPrices={() => setPriceDialog({})}
          />
        </WorkspaceBreadcrumbItem>
        <WorkspaceBreadcrumbSeparator />
        <WorkspaceBreadcrumbItem current className="min-w-10">
          <UsageProviderFilter
            hiddenProviders={hiddenProviders}
            onChange={(next) => updatePreferences({ hiddenProviders: next })}
          />
        </WorkspaceBreadcrumbItem>
      </WorkspaceBreadcrumb>
      {!showingLimits ? (
        <span className="hidden min-w-0 truncate text-meta text-ink-2 @7xl/usage-header:block">
          {windowLabel}
        </span>
      ) : null}
      <div className="ms-auto hidden shrink-0 items-center justify-end gap-2 @4xl/usage-header:flex">
        {/* Limits are always current, so they have no period. The period sits before the metric
            tabs so dropping it never moves them. */}
        {showingLimits ? null : (
          <ToggleGroup
            aria-label={gt("Usage period")}
            variant="segmented"
            value={[String(windowDays)]}
            onValueChange={(next) => {
              const value = next[0];
              if (value) selectWindow(Number(value));
            }}
          >
            {WINDOW_OPTIONS.map((option) => (
              <Toggle key={option.days} value={String(option.days)} title={shortcutTitle(option)}>
                {m(option.label)}
              </Toggle>
            ))}
          </ToggleGroup>
        )}
        <ToggleGroup
          aria-label={gt("Usage metric")}
          variant="segmented"
          value={[metric]}
          onValueChange={(next) => {
            const value = next[0];
            if (isUsageMetric(value)) selectMetric(value);
          }}
        >
          {METRIC_OPTIONS.map((option) => (
            <Toggle key={option.value} value={option.value} title={shortcutTitle(option)}>
              {m(option.label)}
            </Toggle>
          ))}
        </ToggleGroup>
        <Button
          onClick={refreshWindow}
          aria-label={showingLimits ? gt("Refresh limits") : gt("Refresh usage")}
          aria-busy={isRefreshing}
          disabled={isRefreshing || (!showingLimits && !canReadDiagnostics)}
          size="icon-sm"
          variant="ghost"
        >
          <RefreshIcon size="md" refreshing={isRefreshing} />
        </Button>
      </div>
      <div className="ms-auto flex shrink-0 items-center justify-end gap-1 @4xl/usage-header:hidden">
        {showingLimits ? null : (
          <Select value={String(windowDays)} onValueChange={(value) => selectWindow(Number(value))}>
            <SelectTrigger
              aria-label={gt("Usage period")}
              size="sm"
              variant="ghost"
              className="w-auto min-w-0"
            >
              <SelectValue>{windowOptionLabel && m(windowOptionLabel)}</SelectValue>
            </SelectTrigger>
            <SelectPopup align="end" alignItemWithTrigger={false}>
              {WINDOW_OPTIONS.map((option) => (
                <SelectItem
                  key={option.days}
                  value={String(option.days)}
                  title={shortcutTitle(option)}
                >
                  {m(option.label)}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        )}
        <Select
          value={metric}
          onValueChange={(value) => {
            if (isUsageMetric(value)) selectMetric(value);
          }}
        >
          <SelectTrigger
            aria-label={gt("Usage metric")}
            size="sm"
            variant="ghost"
            className="w-auto min-w-0"
          >
            <SelectValue>{metricOptionLabel && m(metricOptionLabel)}</SelectValue>
          </SelectTrigger>
          <SelectPopup align="end" alignItemWithTrigger={false}>
            {METRIC_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value} title={shortcutTitle(option)}>
                {m(option.label)}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
        <Button
          onClick={refreshWindow}
          aria-label={showingLimits ? gt("Refresh limits") : gt("Refresh usage")}
          aria-busy={isRefreshing}
          disabled={isRefreshing || (!showingLimits && !canReadDiagnostics)}
          size="icon-sm"
          variant="ghost"
        >
          <RefreshIcon size="md" refreshing={isRefreshing} />
        </Button>
      </div>
    </div>
  );

  return (
    <SidebarInset className="h-dvh min-h-0 overflow-hidden overscroll-y-none">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <WorkspacePageHeader data-chat-header="" electron={isElectron}>
          <div className="@container/usage-header min-w-0 flex-1">{topbarContent}</div>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={gt("Close usage")}
                  onClick={() => void closePage()}
                />
              }
            >
              <XIcon />
            </TooltipTrigger>
            <TooltipPopup side="bottom">
              <T>Close (Esc)</T>
            </TooltipPopup>
          </Tooltip>
        </WorkspacePageHeader>
        <WindowPage>
          {selectedEnvironments.length === 0 ? (
            <PageSection>
              <p className="text-body text-ink-2">
                {environments.length === 0
                  ? showingLimits
                    ? gt("Connect an environment to see limits.")
                    : gt("Connect an environment to see usage.")
                  : showingLimits
                    ? gt("Select an environment to see limits.")
                    : gt("Select an environment to see usage.")}
              </p>
            </PageSection>
          ) : showingLimits ? (
            <UsageLimitsSection
              selectedEnvironmentIds={selectedEnvironmentIds}
              hiddenProviders={hiddenProviders}
              now={limitsNow}
            />
          ) : shown === null ? (
            <UsageSkeleton />
          ) : !canReadDiagnostics ? (
            <PageSection className="text-body text-ink-2">
              {selectedEnvironments.map((environment) => (
                <p key={environment.environmentId}>
                  {selectedEnvironments.length > 1
                    ? gt("{environment}: {error}", {
                        environment: environment.label,
                        error: environment.error,
                      })
                    : environment.error}
                </p>
              ))}
            </PageSection>
          ) : (
            <UsageOverview
              merged={merged}
              shownWindow={shownWindow}
              hour12={hour12}
              days={days}
              hours={hours}
              showingKept={showingKept}
              metric={metric === "tokens" ? "tokens" : "cost"}
              selectedEnvironments={selectedEnvironments}
              hiddenProviders={hiddenProviders}
              refreshingUsage={refreshingUsage}
              showChatGptSharing={showChatGptSharing}
              onSelectModel={selectUsageModel}
            />
          )}
        </WindowPage>
      </div>
      {showingLimits ? null : (
        <UsageModelDialogHost
          models={merged.models}
          environments={selectedEnvironments}
          metric={metric === "tokens" ? "tokens" : "cost"}
          chartWindow={{
            days,
            hours,
            resolution: shownHourly ? "hour" : "day",
            timeZone: shownWindow.timeZone,
            referenceTime: shownWindow.untilTime,
            hour12,
          }}
          onSetPrice={(model) => setPriceDialog({ model })}
        />
      )}
      {priceDialog ? (
        <UsagePriceOverrides
          usage={environments}
          initialSelectedEnvironmentIds={selectedEnvironmentIds}
          initialModel={priceDialog.model}
          onOpenChange={(open) => {
            if (!open) setPriceDialog(null);
          }}
        />
      ) : null}
    </SidebarInset>
  );
}

function UsageOverview({
  merged,
  shownWindow,
  hour12,
  days,
  hours,
  showingKept,
  metric,
  selectedEnvironments,
  hiddenProviders,
  refreshingUsage,
  showChatGptSharing,
  onSelectModel,
}: {
  readonly merged: MergedUsage;
  readonly shownWindow: UsageSummaryInput;
  readonly hour12: boolean;
  readonly days: readonly string[];
  readonly hours: readonly string[];
  readonly showingKept: boolean;
  readonly metric: "tokens" | "cost";
  readonly selectedEnvironments: readonly EnvironmentUsageStatus[];
  readonly hiddenProviders: ReadonlySet<UsageProviderKind>;
  readonly refreshingUsage: boolean;
  readonly showChatGptSharing: boolean;
  readonly onSelectModel: (key: string) => void;
}) {
  const gt = useGT();
  const locale = useLocale();
  const m = useMessages();
  const [breakdown, setBreakdown] = useState<"model" | "time">("model");
  const shownHourly = shownWindow.resolution === "hour";
  const loading = usageLoading(showingKept, selectedEnvironments, refreshingUsage, hiddenProviders);
  // Copy the primitive; JSX reads of loading.partial would merge all derivations into one compiler cache
  // scope.
  const loadingPartial = loading.partial === true;
  const loadingProviders = new Set(
    PROVIDER_ORDER.filter((provider) => loading.everyProvider || loading.providers.has(provider)),
  );
  const providersWithData = new Set(providersWithUsage(merged.providers));
  // Only loading.providers excludes hidden providers without data. Filter a fresh array so the compiler can
  // cache independently.
  const activeProviders = [...PROVIDER_ORDER].filter(
    (provider) => providersWithData.has(provider) || loading.providers.has(provider),
  );
  const chartLoadingProviders = new Set(
    activeProviders.filter((provider) => loadingProviders.has(provider)),
  );
  const sourceMessages = usageSourceMessages(
    selectedEnvironments.flatMap(
      (environment) =>
        environment.summary?.sources.filter(
          (source) => !hiddenProviders.has(source.fingerprint.provider),
        ) ?? [],
    ),
    m,
  );
  const breakdownPeriods: readonly (DailyTotals | HourlyTotals)[] = (
    shownHourly ? merged.hourly : merged.daily
  ).toReversed();
  const breakdownModels =
    breakdown === "model" && metric === "tokens"
      ? sortModelsByTokens(merged.models)
      : merged.models;
  const rankedProviders = rankProvidersByMetric(activeProviders, merged.providers, metric);

  const figure =
    metric === "cost" ? formatUsd(merged.costUsd, locale) : formatTokens(merged.totalTokens);
  const chartTitle = shownHourly
    ? metric === "tokens"
      ? gt("Hourly processed tokens")
      : gt("Hourly cost")
    : metric === "tokens"
      ? gt("Daily processed tokens")
      : gt("Daily cost");
  const metricValue = (costUsd: number, tokens: number) =>
    metric === "cost" ? formatUsd(costUsd, locale) : formatTokens(tokens);
  const sessionsLabel = (count: number) =>
    gt("{count, plural, one {{formatted} session} other {{formatted} sessions}}", {
      count,
      formatted: formatCount(count, locale),
    });

  return (
    <div aria-busy={loadingPartial} className="flex flex-col gap-6">
      {sourceMessages.map((message) => (
        <p key={message} className="px-2 text-meta text-ink-2">
          {message}
        </p>
      ))}

      <PageSection title={chartTitle}>
        <div className="flex flex-col gap-1 px-2 pb-2">
          <span
            className={cn(
              "text-title font-semibold text-ink-1 tabular-nums",
              figureClass(loadingPartial),
            )}
          >
            {figure}
          </span>
          <span className="inline-flex items-center gap-1 text-meta text-ink-2">
            <span className={figureClass(loadingPartial)}>{sessionsLabel(merged.sessions)}</span>
            {metric === "cost" ? <span>· {gt("API estimate")}</span> : null}
            {metric === "cost" && merged.costQuality.unpricedShare > 0 ? (
              <Popover>
                <PopoverTrigger
                  openOnHover
                  render={<InlineButton tone="muted" />}
                  aria-label={gt("Unpriced usage details")}
                >
                  <InfoIcon className="size-3" aria-hidden />
                </PopoverTrigger>
                <PopoverPopup side="top" tooltipStyle>
                  <T>
                    API estimate excludes{" "}
                    <Var>{formatPercent(merged.costQuality.unpricedShare)}</Var> unpriced records.
                  </T>
                </PopoverPopup>
              </Popover>
            ) : null}
          </span>
        </div>
        <div className="px-2">
          <UsageProviderChart
            providers={activeProviders}
            loadingProviders={chartLoadingProviders}
            days={days}
            daily={merged.daily}
            hours={hours}
            hourly={merged.hourly}
            metric={metric}
            referenceTime={shownWindow.untilTime}
            resolution={shownHourly ? "hour" : "day"}
            timeZone={shownWindow.timeZone}
            hour12={hour12}
          />
        </div>
      </PageSection>

      <PageSection title={<T>Providers</T>}>
        {rankedProviders.map((provider) => {
          const totals = merged.providers.find((entry) => entry.provider === provider);
          const share = metric === "cost" ? (totals?.costShare ?? 0) : (totals?.tokenShare ?? 0);
          const providerLoading = loadingProviders.has(provider);
          const awaitingData = providerLoading && !providersWithData.has(provider);
          return (
            <UsageRow
              key={provider}
              lead={<UsageDot color={PROVIDER_PRESENTATION[provider].color} />}
              title={PROVIDER_PRESENTATION[provider].label}
              detail={awaitingData ? null : sessionsLabel(totals?.sessions ?? 0)}
              value={
                awaitingData ? "-" : metricValue(totals?.costUsd ?? 0, totals?.totalTokens ?? 0)
              }
              valueDetail={awaitingData ? null : formatPercent(share)}
              dimmed={providerLoading}
            />
          );
        })}
        {showChatGptSharing ? (
          <UsageRow title={<T>ChatGPT shared usage</T>} value={<ChatGptUsageButton size="xs" />} />
        ) : null}
      </PageSection>

      <PageSection title={<T>Totals</T>}>
        <UsageRow
          title={gt("Processed tokens")}
          value={formatTokens(merged.totalTokens)}
          dimmed={loadingPartial}
        />
        <UsageRow
          title={gt("Cached input")}
          value={formatTokens(merged.cachedInputTokens)}
          dimmed={loadingPartial}
        />
        <UsageRow
          title={gt("Uncached input")}
          value={formatTokens(merged.uncachedInputTokens)}
          dimmed={loadingPartial}
        />
        <UsageRow
          title={gt("Output", { $context: "output tokens" })}
          value={formatTokens(merged.outputTokens)}
          dimmed={loadingPartial}
        />
        <UsageRow
          title={gt("Cache savings")}
          value={formatUsd(merged.costQuality.cacheSavingsUsd, locale)}
          dimmed={loadingPartial}
        />
      </PageSection>

      {merged.totalTokens > 0 ? (
        metric === "tokens" ? (
          <UsageShareBar
            label={gt("Tokens by type")}
            segments={tokenTypeSegments(merged)}
            format={formatTokens}
          />
        ) : (
          <>
            <UsageShareBar
              label={gt("Cost by type")}
              segments={costTypeSegments(merged.categoryCost)}
              format={(value: number) => formatUsd(value, locale)}
            />
            {merged.speedCost.fast + merged.speedCost.ultrafast > 0 ? (
              <UsageShareBar
                label={gt("Cost by speed")}
                segments={speedCostSegments(merged.speedCost)}
                format={(value: number) => formatUsd(value, locale)}
                aside={<SpeedPremium premiumUsd={merged.speedCost.premium} />}
              />
            ) : null}
          </>
        )
      ) : null}

      <PageSection
        title={breakdown === "model" ? <T>Models</T> : shownHourly ? <T>Hours</T> : <T>Days</T>}
        actions={
          <ToggleGroup
            aria-label={gt("Usage breakdown")}
            variant="segmented"
            value={[breakdown]}
            onValueChange={(next) => {
              const value = next[0];
              if (value === "model" || value === "time") setBreakdown(value);
            }}
          >
            <Toggle value="model">{gt("Model")}</Toggle>
            <Toggle value="time">{shownHourly ? gt("Hour") : gt("Day")}</Toggle>
          </ToggleGroup>
        }
      >
        {breakdown === "model" ? (
          breakdownModels.length === 0 ? (
            <p className="px-2 py-2 text-body text-ink-2">
              <T>No activity in this window.</T>
            </p>
          ) : (
            breakdownModels.map((model) => {
              const key = `${model.provider}:${model.model}`;
              const share = modelShare(model, metric === "tokens" ? "tokens" : "cost");
              const costUnknown = isModelCostUnknown(model);
              return (
                <UsageRow
                  key={key}
                  lead={<ProviderMark provider={model.provider} className="size-4" />}
                  title={model.model}
                  detail={
                    metric === "cost"
                      ? gt("{tokens} tokens", { tokens: formatTokens(model.totalTokens) })
                      : costUnknown
                        ? gt("Unpriced")
                        : formatUsd(model.costUsd, locale)
                  }
                  value={
                    metric === "cost"
                      ? costUnknown
                        ? gt("Unpriced")
                        : formatUsd(model.costUsd, locale)
                      : formatTokens(model.totalTokens)
                  }
                  valueDetail={share === null ? null : formatPercent(share)}
                  dimmed={loadingProviders.has(model.provider)}
                  onClick={() => onSelectModel(key)}
                />
              );
            })
          )
        ) : breakdownPeriods.length === 0 ? (
          <p className="px-2 py-2 text-body text-ink-2">
            <T>No activity in this window.</T>
          </p>
        ) : (
          breakdownPeriods.map((period) => (
            <UsageRow
              key={"hourStart" in period ? period.hourStart : period.day}
              title={
                "hourStart" in period
                  ? formatHourShort(period.hourStart, shownWindow.timeZone, hour12, locale)
                  : formatDayShort(period.day, locale)
              }
              detail={activeProviders
                .flatMap((provider) => {
                  const entry = period.byProvider.get(provider);
                  if (!entry) return [];
                  return [
                    `${PROVIDER_PRESENTATION[provider].label} ${metricValue(entry.costUsd, entry.totalTokens)}`,
                  ];
                })
                .join(" · ")}
              value={metricValue(period.costUsd, period.totalTokens)}
              valueDetail={
                metric === "cost"
                  ? gt("{tokens} tokens", { tokens: formatTokens(period.totalTokens) })
                  : formatUsd(period.costUsd, locale)
              }
              dimmed={loadingPartial}
            />
          ))
        )}
      </PageSection>
    </div>
  );
}

function ProviderMark({
  provider,
  className,
}: {
  readonly provider: UsageProviderKind;
  readonly className: string;
}) {
  const presentation = PROVIDER_PRESENTATION[provider];
  return (
    <ProviderInstanceIcon
      driverKind={presentation.driverKind}
      displayName={presentation.label}
      iconClassName={className}
    />
  );
}

function figureClass(loading: boolean) {
  return cn("transition-opacity", loading && "opacity-40 delay-150");
}

function UsageCoverageNotice({
  environments,
  duplicateSources,
  contractMismatches,
}: {
  readonly environments: readonly EnvironmentUsageStatus[];
  readonly duplicateSources: readonly string[];
  readonly contractMismatches: MergedUsage["contractMismatches"];
}) {
  const gt = useGT();
  const m = useMessages();
  const failed = environments.filter((environment) => environment.error !== null);
  const mismatchByEnvironment = new Map(
    contractMismatches.map((mismatch) => [mismatch.environmentId, mismatch]),
  );
  const incompatible = environments.flatMap((environment) => {
    const mismatch = mismatchByEnvironment.get(environment.environmentId);
    return mismatch === undefined ? [] : [{ environment, mismatch }];
  });
  if (failed.length === 0 && incompatible.length === 0 && duplicateSources.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1 px-2 py-2 text-meta text-ink-2">
      {failed.map((environment) => (
        <span key={environment.label}>
          {gt("{environment}: {error}", {
            environment: environment.label,
            error: environment.error,
          })}
        </span>
      ))}
      {incompatible.map(({ environment, mismatch }) => (
        <span key={environment.environmentId}>
          {formatUsageContractMismatch(environment.label, mismatch, m)}
        </span>
      ))}
      {duplicateSources.length > 0 ? (
        <span>
          {gt("Counted once across environments sharing a transcript directory: {sources}", {
            sources: duplicateSources.join(", "),
          })}
        </span>
      ) : null}
    </div>
  );
}

function UsageEnvironmentFilter({
  environments,
  selectedEnvironments,
  selectedEnvironmentIds,
  onSelectionChange,
  showUsageStatus,
  refreshing,
  isPartial,
  duplicateSources,
  contractMismatches,
  onOpenModelPrices,
}: {
  readonly environments: readonly EnvironmentUsageStatus[];
  readonly selectedEnvironments: readonly EnvironmentUsageStatus[];
  readonly selectedEnvironmentIds: ReadonlySet<EnvironmentId> | null;
  readonly onSelectionChange: (ids: ReadonlySet<EnvironmentId> | null) => void;
  readonly showUsageStatus: boolean;
  readonly refreshing: boolean;
  readonly isPartial: boolean;
  readonly duplicateSources: readonly string[];
  readonly contractMismatches: MergedUsage["contractMismatches"];
  readonly onOpenModelPrices: () => void;
}) {
  const gt = useGT();
  const m = useMessages();
  const allSelected = selectedEnvironmentIds === null;
  const label = allSelected
    ? gt("All environments")
    : selectedEnvironments.length === 1
      ? selectedEnvironments[0]!.label
      : gt("{count, plural, one {{count} environments} other {{count} environments}}", {
          count: selectedEnvironments.length,
        });
  const hasIssue =
    selectedEnvironments.some((environment) => environment.error !== null) ||
    contractMismatches.length > 0;

  return (
    <Menu>
      <MenuTrigger render={<InlineButton />} className="group/usage-environment min-w-0 max-w-full">
        <WorkspaceBreadcrumbText>{label}</WorkspaceBreadcrumbText>
        <span className="flex size-4 shrink-0 items-center justify-center text-ink-2">
          {showUsageStatus && hasIssue ? (
            <CircleAlertIcon
              className="size-4 text-warning-foreground"
              aria-label={gt("Some environments could not report usage")}
            />
          ) : (
            <ChevronDownIcon
              className="size-4 opacity-60 transition-opacity group-hover/usage-environment:opacity-100 group-focus-visible/usage-environment:opacity-100 group-data-popup-open/usage-environment:opacity-100"
              aria-hidden
            />
          )}
        </span>
      </MenuTrigger>
      <MenuPopup align="start">
        <MenuCheckboxItem
          checked={allSelected}
          closeOnClick={false}
          onCheckedChange={(checked) => onSelectionChange(checked ? null : new Set())}
        >
          <T>All environments</T>
        </MenuCheckboxItem>
        <MenuSeparator />
        {environments.map((environment) => {
          const checked =
            selectedEnvironmentIds === null ||
            selectedEnvironmentIds.has(environment.environmentId);
          const progress = usageEnvironmentProgress(environment, refreshing);
          const status =
            environment.error !== null
              ? gt("Unavailable")
              : environment.summary !== null &&
                  !isCompatibleUsageContractVersion(
                    environment.summary.contractVersion,
                    USAGE_CONTRACT_VERSION,
                  )
                ? gt("Update required")
                : !environment.isConnected
                  ? gt("Connecting…")
                  : progress.phase === "loading"
                    ? gt("Scanning…")
                    : progress.phase === "stale"
                      ? gt("Refreshing…")
                      : progress.phase === "partway"
                        ? updatingProvidersLabel(progress.providers, providerLabel, m)
                        : gt("Ready", { $context: "environment usage status" });
          return (
            <MenuCheckboxItem
              key={environment.environmentId}
              checked={checked}
              closeOnClick={false}
              onCheckedChange={(nextChecked) => {
                const next = new Set(selectedEnvironments.map((entry) => entry.environmentId));
                if (nextChecked) next.add(environment.environmentId);
                else next.delete(environment.environmentId);
                onSelectionChange(next.size === environments.length ? null : next);
              }}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="min-w-0 flex-1 truncate">{environment.label}</span>
                {showUsageStatus ? (
                  <span
                    className={cn(
                      "shrink-0 text-meta text-ink-2",
                      environment.error !== null && "text-destructive",
                    )}
                  >
                    {status}
                  </span>
                ) : null}
              </span>
            </MenuCheckboxItem>
          );
        })}
        {environments.length === 0 ? (
          <p className="px-2 py-2 text-meta text-ink-2">
            <T>No environments connected.</T>
          </p>
        ) : null}
        {showUsageStatus && isPartial ? (
          <p className="px-2 py-2 text-meta text-ink-2">
            <T>Totals are partial while selected environments scan.</T>
          </p>
        ) : null}
        {showUsageStatus ? (
          <UsageCoverageNotice
            environments={selectedEnvironments}
            duplicateSources={duplicateSources}
            contractMismatches={contractMismatches}
          />
        ) : null}
        <MenuSeparator />
        <MenuItem onClick={onOpenModelPrices}>
          <SlidersHorizontalIcon aria-hidden />
          <T>Model prices</T>
        </MenuItem>
      </MenuPopup>
    </Menu>
  );
}

function UsageProviderFilter({
  hiddenProviders,
  onChange,
}: {
  readonly hiddenProviders: ReadonlySet<UsageProviderKind>;
  readonly onChange: (hiddenProviders: readonly UsageProviderKind[]) => void;
}) {
  const gt = useGT();
  const visible = PROVIDER_ORDER.filter((provider) => !hiddenProviders.has(provider));
  const label =
    visible.length === PROVIDER_ORDER.length
      ? gt("All providers")
      : visible.length === 0
        ? gt("No providers")
        : visible.length === 1
          ? PROVIDER_PRESENTATION[visible[0]!].label
          : gt("{count, plural, one {{count} providers} other {{count} providers}}", {
              count: visible.length,
            });

  return (
    <Menu>
      <MenuTrigger render={<InlineButton />} className="group/usage-provider min-w-0 max-w-full">
        <span className="min-w-0 truncate">{label}</span>
        <ChevronDownIcon
          className="size-4 shrink-0 text-ink-2 opacity-60 transition-opacity group-hover/usage-provider:opacity-100 group-focus-visible/usage-provider:opacity-100 group-data-popup-open/usage-provider:opacity-100"
          aria-hidden
        />
      </MenuTrigger>
      <MenuPopup align="start">
        <MenuCheckboxItem
          checked={hiddenProviders.size === 0}
          closeOnClick={false}
          onCheckedChange={(checked) => onChange(checked ? [] : PROVIDER_ORDER)}
        >
          <T>All providers</T>
        </MenuCheckboxItem>
        <MenuSeparator />
        {PROVIDER_ORDER.map((provider) => (
          <MenuCheckboxItem
            key={provider}
            checked={!hiddenProviders.has(provider)}
            closeOnClick={false}
            onCheckedChange={(checked) =>
              onChange(
                PROVIDER_ORDER.filter((entry) =>
                  entry === provider ? !checked : hiddenProviders.has(entry),
                ),
              )
            }
          >
            <span className="flex min-w-0 items-center gap-2">
              <ProviderMark provider={provider} className="size-4" />
              <span className="truncate">{PROVIDER_PRESENTATION[provider].label}</span>
            </span>
          </MenuCheckboxItem>
        ))}
      </MenuPopup>
    </Menu>
  );
}

function UsageSkeleton() {
  const gt = useGT();
  const row = (title: string) => (
    <div key={title} className="flex items-center gap-6 px-2 py-2">
      <span className="min-w-0 flex-1 text-body text-ink-2">{title}</span>
      <Skeleton className="h-4 w-16" />
    </div>
  );
  return (
    <div className="flex flex-col gap-6">
      <PageSection title={<Skeleton className="h-4 w-24" />}>
        <div className="flex flex-col gap-1 px-2 pb-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="px-2">
          <Skeleton className="h-56" />
        </div>
      </PageSection>
      <PageSection title={<T>Providers</T>}>
        {PROVIDER_ORDER.map((provider) => (
          <div key={provider} className="flex items-center gap-6 px-2 py-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="ms-auto h-4 w-16" />
          </div>
        ))}
      </PageSection>
      <PageSection title={<T>Totals</T>}>
        {[
          gt("Processed tokens"),
          gt("Cached input"),
          gt("Uncached input"),
          gt("Output", { $context: "output tokens" }),
          gt("Cache savings"),
        ].map(row)}
      </PageSection>
    </div>
  );
}
