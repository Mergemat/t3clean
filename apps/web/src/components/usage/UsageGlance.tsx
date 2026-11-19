import { useAtomValue } from "@effect/atom-react";
import {
  collectLimitAccounts,
  collectLimitPools,
  displayLimitWindows,
} from "@t3tools/shared/usageLimits";
import {
  collectLimitNotices,
  cursorUsageWindowDetails,
  formatResetsIn,
} from "@t3tools/shared/usageLimitsCopy";
import { T, useGT, useMessages } from "gt-react";

import { environmentPresentations } from "../../state/presentation";
import { ProviderInstanceIcon } from "../chat/ProviderInstanceIcon";
import { providerClients } from "../settings/providerDriverMeta";
import { barColor } from "./UsageLimits";

/** Limits at a glance, for the Usage float: per provider, each window as one row with its room
 *  left, a thin bar and when it resets. The full page keeps cost, tokens and per-account detail. */
export function UsageGlance({ now }: { now: number }) {
  const gt = useGT();
  const m = useMessages();
  const presentations = useAtomValue(environmentPresentations.presentationsWithProvidersAtom);
  const pools = collectLimitPools(collectLimitAccounts(presentations), now);
  const notices = collectLimitNotices(presentations, m);

  if (pools.length === 0 && notices.length === 0) {
    return (
      <p className="px-2 py-1 text-body text-ink-2">
        <T>No provider reports subscription limits.</T>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {pools.map((pool) => {
        const label = providerClients.get(pool.driver)?.label ?? String(pool.driver);
        return (
          <section key={pool.driver} className="flex flex-col">
            <h3 className="flex h-8 items-center gap-2 px-2 text-meta font-medium text-ink-2">
              <ProviderInstanceIcon
                driverKind={pool.driver}
                displayName={label}
                indicatorBackground="var(--background)"
                className="size-4"
                iconClassName="size-4 text-ink-2"
              />
              {label}
            </h3>
            {displayLimitWindows(pool).map((window) => {
              const details =
                pool.driver === "cursor" ? cursorUsageWindowDetails(window.id, pool, m) : undefined;
              const member = window.members[0];
              const resetsIn = member ? formatResetsIn(member.window, now, m) : null;
              const left = Math.max(0, Math.min(100, Math.round(window.remainingPercent)));
              return (
                <div
                  key={`${window.kind}:${window.id}`}
                  className="flex flex-col gap-1 rounded-row px-2 py-2"
                >
                  <div className="flex items-center gap-2 text-body">
                    <span className="min-w-0 flex-1 truncate text-ink-1">
                      {details?.label ?? window.label}
                    </span>
                    <span className="shrink-0 tabular-nums text-ink-1">
                      {gt("{percent}% left", { percent: left })}
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-tint-1">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${left}%`, backgroundColor: barColor(pool.driver) }}
                    />
                  </div>
                  {resetsIn ? (
                    <span className="text-meta text-ink-3 first-letter:uppercase">{resetsIn}</span>
                  ) : null}
                </div>
              );
            })}
          </section>
        );
      })}
      {notices.map((notice) => (
        <p key={notice} className="px-2 py-1 text-meta text-ink-2">
          {notice}
        </p>
      ))}
    </div>
  );
}
