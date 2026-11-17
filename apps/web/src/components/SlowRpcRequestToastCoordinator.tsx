import { type SlowRpcAckRequest, subscribeSlowRpcAckRequests } from "../rpc/requestLatencyState";
import { toastManager } from "./ui/toast";

function describeSlowRequests(requests: ReadonlyArray<SlowRpcAckRequest>): string {
  const count = requests.length;
  const thresholdSeconds = Math.round(
    Math.min(...requests.map((request) => request.thresholdMs)) / 1000,
  );

  return `${count} request${count === 1 ? "" : "s"} waiting longer than ${thresholdSeconds}s.`;
}

function SlowRequestDetails({ requests }: { requests: ReadonlyArray<SlowRpcAckRequest> }) {
  return (
    <ul className="space-y-2 text-meta text-ink-2">
      {requests.map((request) => (
        <li className="min-w-0" key={request.requestId}>
          <div className="wrap-break-word font-medium text-ink-1">{request.tag}</div>
          <div className="text-meta opacity-75">
            Started {new Date(request.startedAt).toLocaleTimeString()}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** One warning toast that tracks the set of slow requests while any are outstanding. */
export function startSlowRpcRequestToasts(): () => void {
  let toastId: ReturnType<typeof toastManager.add> | null = null;

  const unsubscribe = subscribeSlowRpcAckRequests((slowRequests) => {
    if (slowRequests.length === 0) {
      if (toastId !== null) {
        toastManager.close(toastId);
        toastId = null;
      }
      return;
    }

    const nextToast = {
      data: {
        expandableContent: <SlowRequestDetails requests={slowRequests} />,
        expandableDescriptionTrigger: true,
        expandableLabels: { collapse: "Hide requests", expand: "Show requests" },
      },
      description: describeSlowRequests(slowRequests),
      timeout: 0,
      title: "Some requests are slow",
      type: "warning" as const,
    };

    if (toastId === null) {
      toastId = toastManager.add(nextToast);
    } else {
      toastManager.update(toastId, nextToast);
    }
  });

  return () => {
    unsubscribe();
    if (toastId !== null) toastManager.close(toastId);
  };
}
