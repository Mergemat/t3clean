import { ArrowDownIcon, ArrowUpIcon, PencilIcon, PlusIcon, StarIcon, XIcon } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import {
  ProviderDriverKind,
  type ProviderInstanceId,
  type ServerProviderModel,
} from "@t3tools/contracts";
import { type CustomModelDefinition, normalizeCustomModelSlug } from "@t3tools/shared/model";

import { useStableCallback } from "../../hooks/useStableCallback";
import { cn } from "../../lib/utils";
import { sortModelsForProviderInstance } from "../../modelOrdering";
import { MAX_CUSTOM_MODEL_LENGTH } from "../../modelSelection";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { SearchField } from "../ui/search-field";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../ui/tooltip";
import { CustomModelEditor } from "./CustomModelEditor";

const CUSTOM_MODEL_PLACEHOLDER_BY_KIND: Partial<Record<ProviderDriverKind, string>> = {
  [ProviderDriverKind.make("codex")]: "gpt-6.7-codex-ultra-preview",
  [ProviderDriverKind.make("claudeAgent")]: "claude-sonnet-5",
  [ProviderDriverKind.make("cursor")]: "claude-sonnet-4-6",
  [ProviderDriverKind.make("opencode")]: "openai/gpt-5",
  [ProviderDriverKind.make("pi")]: "anthropic/claude-sonnet-5",
};

const FILTER_THRESHOLD = 8;

function groupModelsForDisplay<T extends { readonly slug: string; readonly isCustom: boolean }>(
  models: ReadonlyArray<T>,
  options: {
    readonly favoriteModels: ReadonlySet<string>;
    readonly hiddenModels: ReadonlySet<string>;
    readonly modelOrder: ReadonlyArray<string>;
  },
): T[] {
  const ordered = sortModelsForProviderInstance(models, {
    favoriteModels: options.favoriteModels,
    groupFavorites: true,
    modelOrder: options.modelOrder,
  });
  const isHidden = (model: T) => !model.isCustom && options.hiddenModels.has(model.slug);
  return [
    ...ordered.filter((model) => options.favoriteModels.has(model.slug)),
    ...ordered.filter((model) => !options.favoriteModels.has(model.slug) && !isHidden(model)),
    ...ordered.filter((model) => !options.favoriteModels.has(model.slug) && isHidden(model)),
  ];
}

function nextHiddenModelsForBulkToggle(
  models: ReadonlyArray<Pick<ServerProviderModel, "slug" | "isCustom">>,
  hiddenModels: ReadonlyArray<string>,
): string[] {
  const builtInSlugs = models.filter((model) => !model.isCustom).map((model) => model.slug);
  const builtInSlugSet = new Set(builtInSlugs);
  const allBuiltInModelsHidden = builtInSlugs.every((slug) => hiddenModels.includes(slug));

  if (allBuiltInModelsHidden) {
    return hiddenModels.filter((slug) => !builtInSlugSet.has(slug));
  }

  return [...new Set([...hiddenModels, ...builtInSlugs])];
}

interface ProviderModelsSectionProps {
  readonly instanceId: ProviderInstanceId;
  readonly driverKind: ProviderDriverKind | null;
  readonly models: ReadonlyArray<ServerProviderModel>;
  readonly customModels: ReadonlyArray<CustomModelDefinition>;
  readonly canManageCustomModels: boolean;
  readonly canWritePreferences?: boolean;
  readonly hiddenModels: ReadonlyArray<string>;
  readonly favoriteModels: ReadonlyArray<string>;
  readonly modelOrder: ReadonlyArray<string>;
  /** Resolves true once the custom models are saved. */
  readonly onChange: (next: ReadonlyArray<CustomModelDefinition>) => Promise<boolean>;
  readonly onHiddenModelsChange: (
    next: ReadonlyArray<string>,
    affectedModels: ReadonlyArray<string>,
  ) => void;
  readonly onFavoriteModelsChange: (next: ReadonlyArray<string>) => void;
  readonly onToggleFavorite: (model: string) => void;
  readonly onModelOrderChange: (next: ReadonlyArray<string>) => void;
}

export function ProviderModelsSection({
  instanceId,
  driverKind,
  models,
  customModels,
  canManageCustomModels,
  canWritePreferences = true,
  hiddenModels,
  favoriteModels,
  modelOrder,
  onChange,
  onHiddenModelsChange,
  onFavoriteModelsChange,
  onToggleFavorite,
  onModelOrderChange,
}: ProviderModelsSectionProps) {
  const [input, setInput] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const addAttemptRef = useRef(0);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const editAttemptRef = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const scrollToSlugRef = useRef<string | null>(null);
  const hiddenModelSet = new Set(hiddenModels);
  const favoriteModelSet = new Set(favoriteModels);
  const reportedSlugs = new Set(models.map((model) => model.slug));
  // A favorite the provider no longer reports (disabled, signed out, model removed)
  // still needs a row, or its star could never be cleared.
  const unreportedFavoriteModels = favoriteModels.flatMap((slug): ServerProviderModel[] =>
    reportedSlugs.has(slug) ? [] : [{ slug, name: slug, isCustom: false, capabilities: null }],
  );
  const displayModels = groupModelsForDisplay([...models, ...unreportedFavoriteModels], {
    favoriteModels: favoriteModelSet,
    hiddenModels: hiddenModelSet,
    modelOrder,
  });
  const showFilter = models.length > FILTER_THRESHOLD;
  const normalizedFilter = filter.trim().toLowerCase();
  const isFiltering = showFilter && normalizedFilter.length > 0;
  const visibleModels = isFiltering
    ? displayModels.filter(
        (model) =>
          model.name.toLowerCase().includes(normalizedFilter) ||
          model.slug.toLowerCase().includes(normalizedFilter),
      )
    : displayModels;

  // A model added or moved lands in a later commit, so each commit looks for the pending row.
  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- scrolls the pending model's DOM row into view once a later commit renders it
  useEffect(() => {
    const slug = scrollToSlugRef.current;
    if (slug === null) return;
    const row = listRef.current?.querySelector<HTMLElement>(
      `[data-model-slug="${CSS.escape(slug)}"]`,
    );
    if (!row) return;
    scrollToSlugRef.current = null;
    row.scrollIntoView({ block: "nearest" });
  });

  // Derive after the effect and use hiddenModels directly to preserve the editor's option-array cache.
  const builtInModels = models.filter((model) => !model.isCustom);
  const allBuiltInModelsHidden =
    builtInModels.length > 0 && builtInModels.every((model) => hiddenModels.includes(model.slug));

  const handleAdd = async () => {
    if (!canManageCustomModels || driverKind === "antigravity" || isSaving) return;
    const normalized = normalizeCustomModelSlug(input);
    if (!normalized) {
      setError("Enter a model slug.");
      return;
    }
    if (models.some((model) => !model.isCustom && model.slug === normalized)) {
      setError("That model is already built in.");
      return;
    }
    if (normalized.length > MAX_CUSTOM_MODEL_LENGTH) {
      setError(`Model slugs must be ${MAX_CUSTOM_MODEL_LENGTH} characters or less.`);
      return;
    }
    if (customModels.some((entry) => entry.slug === normalized)) {
      setError("That custom model is already saved.");
      return;
    }

    addAttemptRef.current += 1;
    const attempt = addAttemptRef.current;
    setIsSaving(true);
    const saved = await onChange([
      ...customModels,
      { slug: normalized, name: normalized, capabilities: null },
    ]);
    setIsSaving(false);
    // Cancel bumps the attempt, so a late save cannot close the draft opened after it.
    if (!saved || attempt !== addAttemptRef.current) return;
    scrollToSlugRef.current = normalized;
    setFilter("");
    setInput("");
    setError(null);
    setIsAdding(false);
  };

  const cancelAdd = () => {
    addAttemptRef.current += 1;
    setInput("");
    setError(null);
    setIsAdding(false);
  };

  const handleRemove = (slug: string) => {
    if (!canManageCustomModels) return;
    if (editingSlug === slug) {
      editAttemptRef.current += 1;
      setEditingSlug(null);
    }
    void onChange(customModels.filter((entry) => entry.slug !== slug));
    onModelOrderChange(modelOrder.filter((model) => model !== slug));
    onFavoriteModelsChange(favoriteModels.filter((model) => model !== slug));
    setError(null);
  };

  const handleSaveEdit = async (next: CustomModelDefinition) => {
    if (!canManageCustomModels) return;
    const attempt = ++editAttemptRef.current;
    const saved = await onChange(
      customModels.map((entry) => (entry.slug === next.slug ? next : entry)),
    );
    if (saved && attempt === editAttemptRef.current) setEditingSlug(null);
  };

  const setHidden = (slug: string, hidden: boolean) => {
    if (!canWritePreferences || hidden === hiddenModelSet.has(slug)) return;
    onHiddenModelsChange(
      hidden ? [...hiddenModels, slug] : hiddenModels.filter((model) => model !== slug),
      [slug],
    );
  };

  const handleToggleFavorite = (slug: string) => {
    if (!canWritePreferences) return;
    onToggleFavorite(slug);
  };

  const groupOf = (model: (typeof displayModels)[number]) =>
    favoriteModelSet.has(model.slug)
      ? "favorite"
      : !model.isCustom && hiddenModelSet.has(model.slug)
        ? "hidden"
        : "visible";
  const handleMove = (slug: string, direction: -1 | 1) => {
    if (!canWritePreferences) return;
    const index = displayModels.findIndex((model) => model.slug === slug);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= displayModels.length) return;
    if (groupOf(displayModels[index]!) !== groupOf(displayModels[nextIndex]!)) return;
    const next = displayModels.map((model) => model.slug);
    [next[index], next[nextIndex]] = [next[nextIndex]!, next[index]!];
    onModelOrderChange(next);
  };

  const handleToggleEdit = useStableCallback((slug: string) => {
    if (!canManageCustomModels) return;
    editAttemptRef.current += 1;
    setEditingSlug((current) => (current === slug ? null : slug));
  });
  const rowHandlers = {
    onToggleFavorite: useStableCallback(handleToggleFavorite),
    onMove: useStableCallback(handleMove),
    onSetHidden: useStableCallback(setHidden),
    onToggleEdit: handleToggleEdit,
    onRemove: useStableCallback(handleRemove),
  };

  const renderRow = (model: (typeof displayModels)[number]) => {
    const group = groupOf(model);
    const index = displayModels.indexOf(model);
    const previousModel = displayModels[index - 1];
    const nextModel = displayModels[index + 1];
    return (
      <ProviderModelRow
        key={`${instanceId}:${model.slug}`}
        model={model}
        isHidden={!model.isCustom && hiddenModelSet.has(model.slug)}
        isFavorite={group === "favorite"}
        canMoveUp={!isFiltering && previousModel !== undefined && groupOf(previousModel) === group}
        canMoveDown={!isFiltering && nextModel !== undefined && groupOf(nextModel) === group}
        isFiltering={isFiltering}
        canWritePreferences={canWritePreferences}
        canManageCustomModels={canManageCustomModels}
        {...rowHandlers}
      />
    );
  };

  return (
    <div className="flex flex-col gap-1">
      {/* The section label: its actions sit on it, not on a toolbar of their own. */}
      <div className="flex min-h-8 flex-wrap items-center gap-1 px-2">
        <span aria-hidden className="me-auto text-meta font-medium text-ink-2">
          Models
        </span>
        <div className="flex items-center gap-2">
          {builtInModels.length > 0 ? (
            <Button
              type="button"
              size="xs"
              variant="ghost-muted"
              onClick={() =>
                onHiddenModelsChange(
                  nextHiddenModelsForBulkToggle(models, hiddenModels),
                  builtInModels.map((model) => model.slug),
                )
              }
            >
              {allBuiltInModelsHidden ? "Enable all" : "Disable all"}
            </Button>
          ) : null}
        </div>
        {driverKind !== "antigravity" && !isAdding ? (
          <Button type="button" size="xs" variant="ghost-muted" onClick={() => setIsAdding(true)}>
            <PlusIcon className="size-3" />
            Add custom model
          </Button>
        ) : null}
      </div>
      {showFilter ? (
        <SearchField
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter models"
          spellCheck={false}
          aria-label="Filter models"
        />
      ) : null}
      {/* Bounded so a long catalogue scrolls in place; the half row at the cut says there is more.
          The overlay scrollbar keeps the switches on the column edge the provider's own switch uses. */}
      <ScrollArea scrollFade className="h-auto max-h-76">
        <div ref={listRef} className="flex flex-col gap-1">
          {visibleModels.length === 0 ? (
            <p className="px-2 py-2 text-meta text-ink-2">
              {isFiltering ? "No models match." : "No models reported for this provider yet."}
            </p>
          ) : null}
          {visibleModels.map((model, index) => {
            const previous = visibleModels[index - 1];
            const startsHidden =
              groupOf(model) === "hidden" &&
              (previous === undefined || groupOf(previous) !== "hidden");
            const editingEntry =
              canManageCustomModels && model.isCustom && editingSlug === model.slug
                ? customModels.find((entry) => entry.slug === model.slug)
                : undefined;
            return (
              <div key={`${instanceId}:${model.slug}:group`}>
                {startsHidden ? (
                  <div className="flex h-8 items-end px-2 pb-1 text-meta font-medium text-ink-2">
                    Hidden from picker
                  </div>
                ) : null}
                {renderRow(model)}
                {editingEntry ? (
                  <CustomModelEditor
                    key={`${instanceId}:${model.slug}:editor`}
                    instanceId={instanceId}
                    driverKind={driverKind}
                    entry={editingEntry}
                    builtInModels={builtInModels}
                    onSave={(next) => void handleSaveEdit(next)}
                    onDraftChange={() => {
                      editAttemptRef.current += 1;
                    }}
                    onCancel={() => {
                      editAttemptRef.current += 1;
                      setEditingSlug(null);
                    }}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {driverKind === "antigravity" || !canManageCustomModels ? null : isAdding ? (
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Input
            id={`provider-instance-${instanceId}-custom-model`}
            size="sm"
            autoFocus
            readOnly={isSaving}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                cancelAdd();
                return;
              }
              if (event.key !== "Enter") return;
              event.preventDefault();
              void handleAdd();
            }}
            placeholder={driverKind ? CUSTOM_MODEL_PLACEHOLDER_BY_KIND[driverKind] : "model-slug"}
            spellCheck={false}
          />
          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="outline" disabled={isSaving} onClick={handleAdd}>
              Add
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelAdd}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {driverKind !== "antigravity" && error ? (
        <p className="mt-2 text-meta text-destructive">{error}</p>
      ) : null}
    </div>
  );
}

const ProviderModelRow = memo(function ProviderModelRow({
  model,
  isHidden,
  isFavorite,
  canMoveUp,
  canMoveDown,
  isFiltering,
  canWritePreferences,
  canManageCustomModels,
  onToggleFavorite,
  onMove,
  onSetHidden,
  onToggleEdit,
  onRemove,
}: {
  readonly model: ServerProviderModel;
  readonly isHidden: boolean;
  readonly isFavorite: boolean;
  readonly canMoveUp: boolean;
  readonly canMoveDown: boolean;
  readonly isFiltering: boolean;
  readonly canWritePreferences: boolean;
  readonly canManageCustomModels: boolean;
  readonly onToggleFavorite: (slug: string) => void;
  readonly onMove: (slug: string, direction: -1 | 1) => void;
  readonly onSetHidden: (slug: string, hidden: boolean) => void;
  readonly onToggleEdit: (slug: string) => void;
  readonly onRemove: (slug: string) => void;
}) {
  const nameClassName = cn("text-body", isHidden ? "text-ink-2" : "text-ink-1");
  const onHover =
    "opacity-0 transition-opacity group-hover/model:opacity-100 has-focus-visible:opacity-100";
  return (
    <div
      data-model-slug={model.slug}
      className="group/model flex h-8 items-center gap-2 rounded-row px-2 transition-colors hover:bg-foreground/4"
    >
      <span className={cn("flex shrink-0", !isFavorite && onHover)}>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                size="icon-xs"
                variant="ghost-muted"
                disabled={!canWritePreferences}
                onClick={() => onToggleFavorite(model.slug)}
                aria-label={`${isFavorite ? "Remove" : "Add"} ${model.name} ${
                  isFavorite ? "from" : "to"
                } favorites`}
              />
            }
          >
            <StarIcon className={cn("size-3", isFavorite && "fill-current text-warning")} />
          </TooltipTrigger>
          <TooltipPopup side="top">
            {isFavorite ? "Remove from favorites" : "Add to favorites"}
          </TooltipPopup>
        </Tooltip>
      </span>
      <span className="flex min-w-0 flex-1 items-baseline gap-2">
        {model.name !== model.slug ? (
          <Tooltip>
            <TooltipTrigger
              render={<span tabIndex={0} className={cn(nameClassName, "truncate")} />}
            >
              {model.name}
            </TooltipTrigger>
            <TooltipPopup side="top" align="start">
              <code className="font-mono text-meta">{model.slug}</code>
            </TooltipPopup>
          </Tooltip>
        ) : (
          <span className={cn(nameClassName, "truncate")}>{model.name}</span>
        )}
        {model.isCustom ? <span className="shrink-0 text-meta text-ink-2">custom</span> : null}
      </span>
      <span className={cn("flex shrink-0 items-center justify-end", onHover)}>
        {!isHidden && !isFiltering ? (
          <>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    size="icon-xs"
                    variant="ghost-muted"
                    disabled={!canWritePreferences || !canMoveUp}
                    onClick={() => onMove(model.slug, -1)}
                    aria-label={`Move ${model.name} up`}
                  />
                }
              >
                <ArrowUpIcon className="size-3" />
              </TooltipTrigger>
              <TooltipPopup side="top">Move up</TooltipPopup>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    size="icon-xs"
                    variant="ghost-muted"
                    disabled={!canWritePreferences || !canMoveDown}
                    onClick={() => onMove(model.slug, 1)}
                    aria-label={`Move ${model.name} down`}
                  />
                }
              >
                <ArrowDownIcon className="size-3" />
              </TooltipTrigger>
              <TooltipPopup side="top">Move down</TooltipPopup>
            </Tooltip>
          </>
        ) : null}
        {model.isCustom ? (
          <>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    size="icon-xs"
                    variant="ghost-muted"
                    disabled={!canManageCustomModels}
                    aria-label={`Edit ${model.slug}`}
                    onClick={() => onToggleEdit(model.slug)}
                  />
                }
              >
                <PencilIcon className="size-3" />
              </TooltipTrigger>
              <TooltipPopup side="top">Edit name and options</TooltipPopup>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    size="icon-xs"
                    variant="ghost-muted"
                    disabled={!canManageCustomModels}
                    aria-label={`Remove ${model.slug}`}
                    onClick={() => onRemove(model.slug)}
                  />
                }
              >
                <XIcon className="size-3" />
              </TooltipTrigger>
              <TooltipPopup side="top">Remove custom model</TooltipPopup>
            </Tooltip>
          </>
        ) : null}
        {/* Hidden or shown is which group the row sits in; this moves it. */}
        {!model.isCustom ? (
          <Button
            size="xs"
            variant="ghost-muted"
            disabled={!canWritePreferences}
            onClick={() => onSetHidden(model.slug, !isHidden)}
            aria-label={`${isHidden ? "Show" : "Hide"} ${model.name} in the model picker`}
          >
            {isHidden ? "Show" : "Hide"}
          </Button>
        ) : null}
      </span>
    </div>
  );
});
