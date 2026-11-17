import type { RelayClientDeviceRecord } from "@t3tools/contracts/relay";
import { SmartphoneIcon } from "lucide-react";

import { useManagedRelayDevices } from "../../cloud/managedRelayState";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../ui/empty";
import { Skeleton } from "../ui/skeleton";
import {
  mobileClientNotificationDetail,
  mobileClientPlatformLabel,
  mobileClientUpdatedAtLabel,
} from "./MobileClientsUserProfilePage.logic";
import {
  ClerkUserProfilePage,
  ClerkUserProfileRefreshButton,
  ClerkUserProfileRow,
} from "./ClerkUserProfilePage";

const MOBILE_CLIENT_SKELETON_ROWS = ["primary", "secondary"] as const;

function MobileClientStatusBadge({
  enabled,
  label,
}: {
  readonly enabled: boolean;
  readonly label: string;
}) {
  return (
    <Badge variant={enabled ? "success" : "outline"}>
      {label}: {enabled ? "On" : "Off"}
    </Badge>
  );
}

function MobileClientRow({ device }: { readonly device: RelayClientDeviceRecord }) {
  return (
    <ClerkUserProfileRow icon={<SmartphoneIcon className="size-4" />}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between sm:gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-body leading-4 font-medium text-ink-1">{device.label}</h3>
          <p className="text-meta leading-4 text-ink-2">{mobileClientPlatformLabel(device)}</p>
        </div>
        <p className="shrink-0 text-meta leading-4 text-ink-2">
          {mobileClientUpdatedAtLabel(device.updatedAt)}
        </p>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <MobileClientStatusBadge
          enabled={device.notifications.enabled}
          label="Push notifications"
        />
        <MobileClientStatusBadge enabled={device.liveActivities.enabled} label="Live Activities" />
      </div>
      <p className="mt-2 text-meta leading-4 text-ink-2">
        {mobileClientNotificationDetail(device)}
      </p>
    </ClerkUserProfileRow>
  );
}

function MobileClientsSkeleton() {
  return (
    <div aria-label="Loading mobile clients" className="divide-y border-t" role="status">
      {MOBILE_CLIENT_SKELETON_ROWS.map((row) => (
        <div key={row} className="py-4">
          <div className="flex gap-2">
            <Skeleton shape="card" className="size-8 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-28" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyMobileClients() {
  return (
    <Empty size="compact">
      <EmptyMedia variant="icon">
        <SmartphoneIcon />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>No mobile clients</EmptyTitle>
        <EmptyDescription>
          Install T3 Code on your phone and sign in to T3 Connect to get push notifications and Live
          Activities.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export function MobileClientsUserProfilePage() {
  const devicesState = useManagedRelayDevices();
  const devices = devicesState.data ?? [];
  const isInitialLoad =
    !devicesState.accountId || (devicesState.data === null && !devicesState.error);
  const hasErrorWithoutData = devicesState.error !== null && devicesState.data === null;

  return (
    <ClerkUserProfilePage
      title="Mobile clients"
      description="Mobile devices that get notifications from your environments."
      action={
        <ClerkUserProfileRefreshButton
          isPending={devicesState.isPending}
          onClick={devicesState.refresh}
        />
      }
    >
      <div>
        {devicesState.error ? (
          <div
            className="mb-2 flex flex-col gap-2 border-t border-destructive/35 py-2 text-meta sm:flex-row sm:items-center sm:justify-between"
            role="alert"
          >
            <div>
              <p className="font-medium text-destructive-foreground">
                Could not load mobile clients
              </p>
              <p className="text-meta text-ink-2">{devicesState.error}</p>
            </div>
            <Button size="xs" variant="outline" onClick={devicesState.refresh}>
              Try again
            </Button>
          </div>
        ) : null}

        {isInitialLoad ? (
          <MobileClientsSkeleton />
        ) : hasErrorWithoutData ? null : devices.length > 0 ? (
          <ul className="border-t">
            {devices.map((device) => (
              <MobileClientRow key={device.deviceId} device={device} />
            ))}
          </ul>
        ) : (
          <div className="border-t">
            <EmptyMobileClients />
          </div>
        )}
      </div>
    </ClerkUserProfilePage>
  );
}
