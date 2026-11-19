import { type ProviderDriverKind, type ProviderInstanceId } from "@t3tools/contracts";
import { T, useGT } from "gt-react";
import { memo } from "react";
import { StarIcon } from "lucide-react";
import { getDisplayModelName } from "./providerIconUtils";
import { ComboboxItem } from "../ui/combobox";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../ui/tooltip";
import { cn } from "~/lib/utils";
import { modelPickerModelKey } from "./modelPickerKeys";
import { ProviderInstanceIcon } from "./ProviderInstanceIcon";

export const ModelListRow = memo(function ModelListRow(props: {
  index: number;
  slug: string;
  name: string;
  subProvider?: string | undefined;
  instanceId: ProviderInstanceId;
  driverKind: ProviderDriverKind;
  providerDisplayName: string;
  providerAccentColor?: string | undefined;
  acpRegistryAgentId?: string | undefined;
  acpRegistryIconUrl?: string | undefined;
  isFavorite: boolean;
  isSelected: boolean;
  /** Marks this instance apart from another of the same provider. */
  showInstanceBadge: boolean;
  showNewBadge?: boolean;
  unavailable?: boolean;
  jumpLabel?: string | null;
  disabledReason?: string | null;
  onToggleFavorite: (instanceId: ProviderInstanceId, slug: string) => void;
}) {
  const gt = useGT();
  const model = {
    slug: props.slug,
    name: props.name,
    subProvider: props.subProvider,
  };

  const row = (
    <ComboboxItem
      hideIndicator
      index={props.index}
      value={modelPickerModelKey(props.instanceId, props.slug)}
      disabled={Boolean(props.disabledReason)}
      className={cn(
        "group relative w-full !min-w-0 max-w-full cursor-pointer",
        props.disabledReason &&
          "data-disabled:pointer-events-auto data-disabled:cursor-not-allowed",
      )}
    >
      {/* One row shape in every tab: the logo names the provider, so Favorites needs no second line. */}
      <ProviderInstanceIcon
        driverKind={props.driverKind}
        displayName={props.providerDisplayName}
        accentColor={props.providerAccentColor}
        acpRegistryAgentId={props.acpRegistryAgentId}
        acpRegistryIconUrl={props.acpRegistryIconUrl}
        showBadge={props.showInstanceBadge}
        className="size-4"
        iconClassName="size-4"
        indicatorBackground="var(--popover)"
      />
      <div className="flex min-w-0 flex-1 items-center gap-2 text-left group-hover:fade-under-end group-data-highlighted:fade-under-end">
        <div
          className="min-w-0 truncate text-body font-normal leading-snug"
          // Names the row in full on hover only when it is cut off.
          onPointerEnter={(event) => {
            const name = event.currentTarget;
            name.title = name.scrollWidth > name.clientWidth ? getDisplayModelName(model) : "";
          }}
        >
          {getDisplayModelName(model)}
          {/* The logo is decorative, so name the provider for screen readers. */}
          <span className="sr-only">, {props.providerDisplayName}</span>
        </div>
        {props.subProvider ? (
          <span className="min-w-0 shrink truncate text-meta text-ink-2">{props.subProvider}</span>
        ) : null}
        {props.showNewBadge ? (
          <span
            className="shrink-0 rounded-chip border border-update/35 bg-update/15 px-1 py-px text-meta font-bold uppercase leading-none tracking-wide text-update-foreground"
            aria-label={gt("New model")}
          >
            {gt("New", { $context: "badge on a newly added model" })}
          </span>
        ) : null}
        {props.unavailable ? (
          <Badge variant="outline" size="sm">
            <T context="badge on a model that cannot be selected">Unavailable</T>
          </Badge>
        ) : null}
      </div>

      {/* Over the row's end, not beside it: the name keeps the full width until you point at
          the row, then fades under these. */}
      <div className="absolute inset-y-0 end-2 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 group-data-highlighted:opacity-100 has-focus-visible:opacity-100 pointer-coarse:opacity-100">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                size="icon-xs"
                variant="ghost-muted"
                onClick={(event) => {
                  event.stopPropagation();
                  props.onToggleFavorite(props.instanceId, props.slug);
                }}
                onKeyDown={(event) => {
                  event.stopPropagation();
                }}
                disabled={Boolean(props.disabledReason)}
                aria-label={props.isFavorite ? gt("Remove from favorites") : gt("Add to favorites")}
              >
                <StarIcon
                  className={cn(
                    "size-4 sm:size-3",
                    props.isFavorite && "fill-current text-warning",
                  )}
                />
              </Button>
            }
          />
          <TooltipPopup side="top" align="center">
            {props.isFavorite ? gt("Remove from favorites") : gt("Add to favorites")}
          </TooltipPopup>
        </Tooltip>
        {/* A hint, not a key chip: it shows on the row you are about to pick. */}
        {props.jumpLabel ? (
          <kbd className="font-sans text-meta text-ink-3">{props.jumpLabel}</kbd>
        ) : null}
      </div>
    </ComboboxItem>
  );

  if (!props.disabledReason) {
    return row;
  }

  return (
    <Tooltip>
      <TooltipTrigger render={row} />
      <TooltipPopup side="left" align="center">
        {props.disabledReason}
      </TooltipPopup>
    </Tooltip>
  );
});
