import { type EnvironmentId, sessionGrantsScope } from "@t3tools/contracts";
import {
  AUTH_SCOPE_OPTIONS,
  sessionPermissionsUnavailableMessage,
} from "@t3tools/shared/authScopeOptions";
import { useEnvironmentSessionState } from "~/state/session";

export function SessionPermissions({
  environmentId,
  connected,
  routeContext = false,
}: {
  readonly environmentId: EnvironmentId;
  readonly connected: boolean;
  readonly routeContext?: boolean;
}) {
  const session = useEnvironmentSessionState(environmentId);
  return connected && !session.hasError && !session.isPending && session.data?.authenticated ? (
    <div className="space-y-2 py-2 text-meta">
      <p className="text-ink-2">
        {routeContext
          ? "These permissions apply to your active route. Other routes may have different permissions."
          : "These permissions apply to this client’s current connection."}
      </p>
      <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {AUTH_SCOPE_OPTIONS.map(({ scope, title }) => (
          <li key={scope} className="flex items-start justify-between gap-2">
            <span>{title}</span>
            <span className="shrink-0 text-ink-2">
              {sessionGrantsScope(session.data!, scope) ? "Allowed" : "Not granted"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  ) : (
    <p className="py-2 text-meta text-ink-2">
      {sessionPermissionsUnavailableMessage({
        connected,
        failed: session.hasError,
        rejected: !session.hasError && !session.isPending && session.data?.authenticated === false,
      })}
    </p>
  );
}
