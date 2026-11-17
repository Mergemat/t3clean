import {
  CHATGPT_USAGE_URL,
  collectLimitAccounts,
  collectExternalUsageLinks,
  collectLimitNotices,
  collectLimitPools,
  cursorUsageWindowDetails,
  displayLimitWindows,
  formatResetsIn,
  type LimitAccount,
  type LimitPool,
  type LimitPoolMember,
  type LimitPoolWindow,
  paceRemainingPercent,
  remainingPercent,
  type ResetCreditChoice,
  resetCreditChoices,
} from "@t3tools/shared/usageLimits";
import type { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { normalizeProviderAccentColor } from "@t3tools/client-runtime/state/provider-instance-display";
import { AlertTriangleIcon, ExternalLinkIcon, TicketIcon } from "lucide-react";
import {
  createContext,
  Fragment,
  type ReactNode,
  type RefObject,
  use,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { ensureLocalApi } from "../../localApi";
import { usePrimarySettings } from "../../hooks/useSettings";
import { cn } from "../../lib/utils";
import { formatUpcomingTimestamp } from "../../timestampFormat";
import { ProviderInstanceIcon } from "../chat/ProviderInstanceIcon";
import { providerClients } from "../settings/providerDriverMeta";
import { RedactedSensitiveText } from "../settings/RedactedSensitiveText";
import { Button } from "../ui/button";
import { OpenAI } from "../Icons";
import { Alert, AlertTitle } from "../ui/alert";
import { Popover, PopoverCreateHandle, PopoverPopup, PopoverTrigger } from "../ui/popover";
import { PaceIcon, ResetCreditDialog, barColor, usePaceMark, useResetCredit } from "./UsageLimits";

function accountInitials(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  return `${local[0] ?? ""}${domain[0] ?? ""}`.toUpperCase() || "?";
}

function accountHue(email: string): number {
  let hash = 0;
  for (let index = 0; index < email.length; index += 1) {
    hash = (hash * 31 + email.charCodeAt(index)) | 0;
  }
  return Math.abs(hash) % 360;
}

function AccountChip({ email }: { readonly email: string }) {
  const hue = accountHue(email);
  return (
    <span
      role="img"
      aria-label={`Account ${accountInitials(email)}`}
      className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-meta leading-none font-semibold"
      style={{ backgroundColor: `oklch(0.85 0.08 ${hue})`, color: `oklch(0.35 0.1 ${hue})` }}
    >
      {accountInitials(email)}
    </span>
  );
}

function AccountAvatar({
  account,
  className,
}: {
  readonly account: LimitAccount;
  readonly className?: string;
}) {
  if (account.redeem) {
    return (
      <ProviderInstanceIcon
        driverKind={account.driver}
        displayName={
          account.displayName ??
          providerClients.get(account.driver)?.label ??
          String(account.driver)
        }
        accentColor={account.accentColor}
        showBadge={Boolean(account.displayName)}
        indicatorBackground="var(--popover)"
        className={cn("size-5", className)}
        iconClassName="size-4 text-ink-2"
      />
    );
  }
  return account.email ? <AccountChip email={account.email} /> : null;
}

function AccountName({
  account,
  className,
}: {
  readonly account: LimitAccount;
  readonly className?: string;
}) {
  if (account.displayName) return <span className={className}>{account.displayName}</span>;
  if (account.email) {
    return (
      <span className={cn("inline-flex min-w-0 items-center", className)}>
        <AccountChip email={account.email} />
      </span>
    );
  }
  return (
    <span className={className}>
      {providerClients.get(account.driver)?.label ?? String(account.driver)}
    </span>
  );
}

function Row({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <div className="grid grid-cols-(--grid-lead) gap-x-2">
      <span className="w-18 text-ink-2">{label}</span>
      <span className="min-w-0 text-ink-1 tabular-nums">{children}</span>
    </div>
  );
}

function SegmentPopover({
  account,
  window,
  reset,
  now,
  redeem,
  onRedeem,
}: {
  readonly account: LimitAccount;
  readonly window: LimitPoolMember["window"];
  readonly reset: LimitPoolWindow["resets"][number] | undefined;
  readonly now: number;
  readonly redeem: ReturnType<typeof useResetCredit> | null;
  readonly onRedeem: (choice: ResetCreditChoice) => void;
}) {
  const timestampFormat = usePrimarySettings((settings) => settings.timestampFormat);
  const remaining = remainingPercent(window);
  const timeLeft = paceRemainingPercent(window, now);
  const resetsIn = formatResetsIn(window, now);
  const where =
    account.environments.length > 0
      ? account.environments.map((environment) => environment.label).join(", ")
      : account.sourceLabel;
  const choices =
    redeem && account.redeem && account.limits.resetCredits?.availableCount
      ? resetCreditChoices(account.limits.resetCredits, account.redeem.input, now, true)
      : [];
  return (
    <div className="flex w-72 max-w-(--viewport-inset) flex-col gap-2 text-meta">
      <div className="flex min-w-0 flex-col">
        <span className="flex items-center gap-2 text-body font-medium text-ink-1">
          <AccountAvatar account={account} />
          <span className="truncate">
            {account.displayName ?? providerClients.get(account.driver)?.label ?? account.driver}
          </span>
        </span>
        {account.email ? (
          <RedactedSensitiveText
            value={account.email}
            ariaLabel="Toggle account email visibility"
            revealTooltip="Click to reveal email"
            hideTooltip="Click to hide email"
            className="w-fit"
          />
        ) : null}
      </div>
      <div className="flex flex-col gap-1">
        {account.plan ? <Row label="Plan">{account.plan}</Row> : null}
        {where ? (
          <Row label={account.environments.length > 0 ? "Signed in" : "Via"}>{where}</Row>
        ) : null}
      </div>
      <div className="flex flex-col gap-1">
        <Row label="Left">{remaining}%</Row>
        {window.resetsAt ? (
          <Row label="Resets">
            {formatUpcomingTimestamp(window.resetsAt, timestampFormat, now)}
            {resetsIn ? ` · ${resetsIn.replace("resets in ", "in ")}` : ""}
          </Row>
        ) : null}
        {timeLeft !== null ? <Row label="Even pace">{timeLeft}% left by now</Row> : null}
        {reset && reset.restoresPercent > 0 ? (
          <Row label="Restores">+{reset.restoresPercent}% of pool</Row>
        ) : null}
      </div>
      {choices.length > 0 && redeem ? (
        <div className="flex flex-col gap-2 text-ink-2">
          {choices.map((choice) => (
            <span key={choice.key} className="flex items-center gap-2">
              <span className="tabular-nums">{choice.summary}</span>
              {choice.availableCount > 0 ? (
                <Button
                  size="xs"
                  variant="outline"
                  disabled={redeem.busy || !redeem.canManageProviders}
                  className="ms-auto"
                  onClick={() => onRedeem(choice)}
                >
                  {redeem.busy ? "Using…" : choice.actionLabel}
                </Button>
              ) : null}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Every segment on the page shares one popover, so hovering or clicking another
 * segment moves it instead of opening a second one. The payload is the segment
 * it currently describes.
 */
type SegmentPayload = Omit<Parameters<typeof SegmentPopover>[0], "now" | "onRedeem">;
const SegmentPopoverContext = createContext<ReturnType<
  typeof PopoverCreateHandle<SegmentPayload>
> | null>(null);

function ActiveSegmentPopover({
  handle,
  actions,
  payload,
  pools,
  now,
}: {
  readonly handle: ReturnType<typeof PopoverCreateHandle<SegmentPayload>>;
  readonly actions: RefObject<PopoverPrimitive.Root.Actions | null>;
  readonly payload: SegmentPayload;
  readonly pools: readonly LimitPool[];
  readonly now: number;
}) {
  const available = pools.some((pool) =>
    displayLimitWindows(pool).some((window) =>
      window.members.some(
        (member) =>
          member.account.key === payload.account.key &&
          member.window.id === payload.window.id &&
          member.window.kind === payload.window.kind &&
          Boolean(member.account.redeem) === Boolean(payload.redeem),
      ),
    ),
  );
  // The trigger is gone, so the popup has nothing to anchor to: an exit transition would
  // slide it to the viewport origin. Unmount it outright, which also clears Base UI's
  // active-trigger bookkeeping so the segment can open again when it comes back.
  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- closes the popover handle and unmounts the Base UI popup before paint when its trigger is gone
  useLayoutEffect(() => {
    if (available) return;
    handle.close();
    actions.current?.unmount();
  }, [available, handle, actions]);
  return (
    <PopoverPopup side="top" sideOffset={6}>
      <SegmentPopover
        {...payload}
        now={now}
        onRedeem={(choice) => {
          handle.close();
          payload.redeem?.confirm(choice);
        }}
      />
    </PopoverPopup>
  );
}

/**
 * The confirm is a sibling of the popover, not a child: dialogs stack under
 * popovers, and the popover closes as the confirm opens.
 */
function PoolSegment({
  account,
  ...props
}: {
  readonly account: LimitAccount;
  readonly window: LimitPoolMember["window"];
  readonly reset: LimitPoolWindow["resets"][number] | undefined;
  readonly refillPercent: number;
  readonly color: string;
  readonly now: number;
  readonly index: number;
  readonly showAccountName: boolean;
}) {
  return account.redeem ? (
    <RedeemableSegment account={account} redeemAt={account.redeem} {...props} />
  ) : (
    <SegmentTriggers account={account} redeem={null} {...props} />
  );
}

function RedeemableSegment({
  redeemAt,
  ...props
}: Omit<Parameters<typeof SegmentTriggers>[0], "redeem"> & {
  readonly redeemAt: NonNullable<LimitAccount["redeem"]>;
}) {
  const redeem = useResetCredit(redeemAt.environmentId);
  return (
    <>
      <SegmentTriggers redeem={redeem} {...props} />
      <ResetCreditDialog
        open={redeem.confirming}
        onOpenChange={redeem.setConfirming}
        choice={redeem.choice}
        onConfirm={() => void redeem.redeem()}
        disabled={!redeem.canManageProviders}
      />
      {/* The popover closed before the confirm, so progress and the outcome need a home outside it. */}
      {redeem.busy || redeem.status ? (
        <span role="status" className="col-span-full text-meta text-ink-2">
          <AccountName account={props.account} className="font-medium text-ink-1" />{" "}
          {redeem.busy ? "Using reset credit…" : redeem.status}
        </span>
      ) : null}
    </>
  );
}

function SegmentTriggers({
  account,
  window,
  reset,
  redeem,
  refillPercent,
  color,
  now,
  index,
  showAccountName,
}: SegmentPayload & {
  readonly refillPercent: number;
  readonly color: string;
  readonly now: number;
  readonly index: number;
  readonly showAccountName: boolean;
}) {
  const popover = use(SegmentPopoverContext) ?? undefined;
  const payload: SegmentPayload = { account, window, reset, redeem };
  const remaining = remainingPercent(window);
  const timeLeft = paceRemainingPercent(window, now);
  const [segmentRef, paceMark] = usePaceMark(timeLeft);
  const resetsIn = formatResetsIn(window, now);
  const credits = account.limits.resetCredits?.availableCount ?? 0;
  return (
    <>
      <PopoverTrigger
        handle={popover}
        payload={payload}
        openOnHover
        render={
          <button
            ref={segmentRef}
            type="button"
            style={{ gridColumn: index, gridRow: 1, ...paceMark?.gappedTrack }}
            aria-label={`${account.displayName ?? (account.email ? accountInitials(account.email) : account.driver)}: ${remaining}% left${resetsIn ? `, ${resetsIn}` : ""}${timeLeft === null ? "" : `, ${timeLeft}% of the window left`}${credits ? `, ${credits} reset ${credits === 1 ? "credit" : "credits"} banked` : ""}`}
            className="relative h-5 min-w-0 cursor-pointer rounded-row bg-muted text-start outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[popup-open]:ring-1 data-[popup-open]:ring-inset data-[popup-open]:ring-border @2xl/pool:h-8"
          />
        }
      >
        <div aria-hidden className="absolute inset-0 overflow-hidden rounded-row">
          {/* Clipped inside the rounded clip so the bar's own corners keep their antialiasing. */}
          <div className="absolute inset-0" style={paceMark?.gap}>
            <div
              aria-hidden
              className="absolute inset-y-0 left-0 rounded-row opacity-35"
              style={{ width: `${remaining}%`, backgroundColor: color }}
            />
            {remaining < 100 && reset && refillPercent > 0 ? (
              <div
                aria-hidden
                className="absolute inset-y-0 right-0 opacity-20"
                style={{
                  width: `${Math.min(100 - remaining, refillPercent)}%`,
                  backgroundImage: `repeating-linear-gradient(135deg, ${color} 0 1px, transparent 1px 5px)`,
                }}
              />
            ) : null}
          </div>
        </div>
        {paceMark ? (
          <span
            aria-hidden
            className="absolute inset-y-1 w-1 -translate-x-1/2 rounded-full bg-foreground"
            style={paceMark.tick}
          />
        ) : null}
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-row text-meta leading-none font-semibold text-ink-2 tabular-nums @2xl/pool:hidden"
        >
          {index}
        </span>
        <div className="relative hidden h-full min-w-0 items-center gap-2 overflow-hidden rounded-row px-2 text-meta @2xl/pool:flex">
          {showAccountName ? (
            <AccountName account={account} className="min-w-0 truncate font-medium text-ink-1" />
          ) : null}
          {/* A single-account bar repeats the headline percentage. */}
          {showAccountName ? (
            <span className="shrink-0 font-semibold text-ink-1 tabular-nums">{remaining}%</span>
          ) : null}
          {resetsIn || credits ? (
            <span className="ms-auto flex min-w-0 items-center gap-2 overflow-hidden rounded-row bg-background/85 px-2 py-1 text-meta whitespace-nowrap text-ink-1 tabular-nums">
              {resetsIn?.replace("resets in ", "↻ ") ?? ""}
              {credits ? (
                <>
                  {resetsIn ? (
                    <span aria-hidden className="text-ink-2">
                      ·
                    </span>
                  ) : null}
                  <span aria-hidden className="inline-flex items-center font-semibold">
                    <TicketIcon className="size-3" aria-hidden />
                    {credits}
                  </span>
                </>
              ) : null}
            </span>
          ) : null}
        </div>
      </PopoverTrigger>
      <LegendRow payload={payload} color={color} now={now} index={index} />
    </>
  );
}

function LegendRow({
  payload,
  color,
  now,
  index,
}: {
  readonly payload: SegmentPayload;
  readonly color: string;
  readonly now: number;
  readonly index: number;
}) {
  const popover = use(SegmentPopoverContext) ?? undefined;
  const { account, window } = payload;
  const remaining = remainingPercent(window);
  const resetsIn = formatResetsIn(window, now);
  const credits = account.limits.resetCredits?.availableCount ?? 0;
  return (
    <PopoverTrigger
      handle={popover}
      payload={payload}
      style={{ gridColumn: "1 / -1", gridRow: index + 1 }}
      render={<Button variant="ghost" size="sm" />}
      className="min-w-0 @2xl/pool:hidden"
    >
      <span className="relative inline-flex size-4 shrink-0 items-center justify-center rounded-chip text-meta leading-none font-semibold text-ink-2 tabular-nums">
        <span
          aria-hidden
          className="absolute inset-0 rounded-row opacity-35"
          style={{ backgroundColor: color }}
        />
        <span className="sr-only">Segment </span>
        <span className="relative">{index}</span>
      </span>
      <AccountName account={account} className="min-w-0 truncate font-medium text-ink-1" />
      <span className="shrink-0 font-semibold text-ink-1 tabular-nums">{remaining}%</span>
      <span className="ms-auto flex shrink-0 items-center gap-2 text-meta text-ink-2 tabular-nums">
        {resetsIn?.replace("resets in ", "↻ ") ?? ""}
        {credits ? (
          <>
            {resetsIn ? <span aria-hidden>·</span> : null}
            <span aria-hidden className="inline-flex items-center font-semibold text-ink-1">
              <TicketIcon className="size-3" aria-hidden />
              {credits}
            </span>
            <span className="sr-only">
              {credits} reset {credits === 1 ? "credit" : "credits"} banked
            </span>
          </>
        ) : null}
      </span>
    </PopoverTrigger>
  );
}

function PoolBar({
  pool,
  color,
  now,
}: {
  readonly pool: LimitPoolWindow;
  readonly color: string;
  readonly now: number;
}) {
  const restores = new Map(pool.resets.map((reset) => [reset.member.account.key, reset]));
  return (
    <div className="@container/pool min-w-0">
      <div
        className="grid gap-x-1 gap-y-1"
        style={{ gridTemplateColumns: `repeat(${pool.columns.length}, minmax(0, 1fr))` }}
      >
        {pool.columns.map((member, position) =>
          member.window ? (
            <PoolSegment
              key={member.account.key}
              account={member.account}
              window={member.window}
              reset={restores.get(member.account.key)}
              refillPercent={member.refillPercent}
              color={normalizeProviderAccentColor(member.account.accentColor) ?? color}
              now={now}
              index={position + 1}
              showAccountName={pool.columns.length > 1}
            />
          ) : pool.kind === "monthly" && member.account.limits.zeroSpendCap ? (
            <div
              key={member.account.key}
              style={{ gridColumn: position + 1, gridRow: 1 }}
              className="flex h-5 min-w-0 items-center justify-center gap-2 overflow-hidden rounded-row border border-dashed border-border text-meta whitespace-nowrap text-ink-2 @2xl/pool:h-8 @2xl/pool:justify-start @2xl/pool:px-2 @2xl/pool:text-meta"
            >
              <AccountName
                account={member.account}
                className="hidden min-w-0 truncate @2xl/pool:inline-flex"
              />
              $0 cap
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}

function PoolWindowCard({
  pool,
  color,
  now,
  label,
  description,
}: {
  readonly pool: LimitPoolWindow;
  readonly color: string;
  readonly now: number;
  readonly label?: string | null | undefined;
  readonly description?: string | undefined;
}) {
  const nextRefill = pool.resets.find((reset) => reset.restoresPercent > 0);
  return (
    <div className="grid items-center gap-x-6 gap-y-2 rounded-box border border-border/60 p-4 md:grid-cols-(--grid-lead)">
      <div className="flex flex-col gap-1 md:w-44">
        {label !== null ? (
          <span className="text-body font-medium text-ink-1">{label ?? pool.label}</span>
        ) : null}
        <span className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-ink-1 tabular-nums">
            {pool.remainingPercent}%
          </span>
          <span className="inline-flex items-center gap-2 text-body text-ink-2">
            <span>left</span>
            {pool.pace ? <PaceIcon pace={pool.pace} /> : null}
          </span>
        </span>
        {nextRefill && pool.columns.length > 1 ? (
          <span className="text-meta font-medium text-ink-1 tabular-nums">
            ↻ +{nextRefill.restoresPercent}%
          </span>
        ) : null}
      </div>
      <PoolBar pool={pool} color={color} now={now} />
      {description ? <p className="text-meta text-ink-2 md:col-span-2">{description}</p> : null}
    </div>
  );
}

function PoolSection({ pool, now }: { readonly pool: LimitPool; readonly now: number }) {
  const color = barColor(pool.driver);
  const label = providerClients.get(pool.driver)?.label ?? String(pool.driver);
  const windows = displayLimitWindows(pool);
  return (
    <section className="flex flex-col gap-2">
      <h2 className="flex items-center gap-2 text-body font-medium text-ink-1">
        <ProviderInstanceIcon
          driverKind={pool.driver}
          displayName={label}
          indicatorBackground="var(--background)"
          className="size-5"
          iconClassName="size-4 text-ink-2"
        />
        {label}
      </h2>
      {windows.map((window) => {
        const details =
          pool.driver === "cursor" ? cursorUsageWindowDetails(window.id, pool) : undefined;
        return (
          <PoolWindowCard
            key={`${window.kind}:${window.id}`}
            pool={window}
            color={color}
            now={now}
            label={details?.label}
            description={details?.description}
          />
        );
      })}
    </section>
  );
}

export function UsageLimitsPooled({
  presentations,
  now,
}: {
  readonly presentations: Parameters<typeof collectLimitAccounts>[0];
  readonly now: number;
}) {
  const [segmentPopover] = useState(() => PopoverCreateHandle<SegmentPayload>());
  const segmentPopoverActions = useRef<PopoverPrimitive.Root.Actions | null>(null);
  const pools = collectLimitPools(collectLimitAccounts(presentations), now);
  const notices = collectLimitNotices(presentations);
  const externalLinks = collectExternalUsageLinks(presentations);
  return (
    <div className="flex flex-col gap-6">
      {pools.length === 0 && notices.length === 0 && externalLinks.length === 0 ? (
        <p className="text-body text-ink-2">
          No provider on the selected environments reports subscription limits.
        </p>
      ) : null}
      <SegmentPopoverContext value={segmentPopover}>
        {pools.map((pool) => (
          <Fragment key={pool.driver}>
            <PoolSection pool={pool} now={now} />
          </Fragment>
        ))}
      </SegmentPopoverContext>
      <Popover handle={segmentPopover} actionsRef={segmentPopoverActions}>
        {({ payload }) =>
          payload ? (
            <ActiveSegmentPopover
              handle={segmentPopover}
              actions={segmentPopoverActions}
              payload={payload}
              pools={pools}
              now={now}
            />
          ) : null
        }
      </Popover>
      {externalLinks.map((link) => (
        <section
          key={link.url}
          className="flex flex-wrap items-center justify-between gap-2 rounded-box border p-4"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {link.url === CHATGPT_USAGE_URL ? (
              <OpenAI className="size-5 shrink-0" aria-hidden="true" />
            ) : null}
            <div className="min-w-0 space-y-1">
              <h2 className="text-body font-medium">{link.label}</h2>
              <p className="text-meta break-words text-ink-2">{link.accounts.join(", ")}</p>
              {link.url === CHATGPT_USAGE_URL ? (
                <p className="text-meta text-ink-2">
                  View usage in ChatGPT with your connected account.
                </p>
              ) : link.message ? (
                <p className="max-w-xl text-meta text-ink-2">{link.message}</p>
              ) : null}
            </div>
          </div>
          <Button
            variant="ghost-muted"
            size="xs"
            onClick={() => void ensureLocalApi().shell.openExternal(link.url)}
          >
            Manage usage
            <ExternalLinkIcon className="size-4" aria-hidden="true" />
          </Button>
        </section>
      ))}
      <LimitNotices notices={notices} />
    </div>
  );
}

function LimitNotices({ notices }: { readonly notices: readonly string[] }) {
  if (notices.length === 0) return null;
  return (
    <Alert variant="warning" controlAlignment="first-line">
      <AlertTriangleIcon />
      {notices.map((notice) => (
        <AlertTitle key={notice} className="break-words">
          {notice}
        </AlertTitle>
      ))}
    </Alert>
  );
}
