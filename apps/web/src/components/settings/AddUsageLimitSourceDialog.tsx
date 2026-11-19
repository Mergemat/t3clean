import type { EnvironmentId, SecretReference, UnifiedSettings } from "@t3tools/contracts";
import { T, useGT, Var } from "gt-react";
import { useId, useState } from "react";

import { useUpdateEnvironmentSettings } from "../../hooks/useSettings";
import { Button } from "../ui/button";
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
import { sourceIdFromUrl } from "./AddUsageLimitSourceDialog.logic";
import { SecretSourceInput, useSecretSources } from "./SecretSourceInput";
import { Field } from "../ui/field";

/** Send the management key once to server secret storage; settings retain only a redaction marker. */
export function AddUsageLimitSourceDialog({
  open,
  onOpenChange,
  environmentId,
  environmentLabel,
  sources,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly environmentId: EnvironmentId;
  readonly environmentLabel: string;
  readonly sources: UnifiedSettings["usageLimitSources"];
}) {
  const gt = useGT();
  const formId = useId();
  const updateSettings = useUpdateEnvironmentSettings(environmentId);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const secretSources = useSecretSources(environmentId);
  const [keyDraft, setKeyDraft] = useState<string | SecretReference>("");
  const [keyValid, setKeyValid] = useState(true);
  const managementKey = typeof keyDraft === "string" ? keyDraft.trim() : keyDraft;
  const trimmedUrl = url.trim();
  const canSave = keyValid && trimmedUrl.length > 0 && managementKey !== "";

  const reset = () => {
    setLabel("");
    setUrl("");
    setKeyDraft("");
    setKeyValid(true);
  };

  const save = () => {
    if (!canSave) return;
    const id = sourceIdFromUrl(trimmedUrl, sources);
    updateSettings({
      usageLimitSources: {
        [id]: {
          kind: "cliproxy",
          ...(label.trim() ? { label: label.trim() } : {}),
          url: trimmedUrl,
          managementKey,
          enabled: true,
        },
      },
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogPopup size="sm">
        <DialogHeader>
          <DialogTitle>
            <T>Add a CLIProxyAPI hub</T>
          </DialogTitle>
          <DialogDescription>
            <T>
              Show the quota of every account the hub pools, next to the providers on{" "}
              <Var>{environmentLabel}</Var>. The key stays on that server.
            </T>
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <form
            id={formId}
            className="grid gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              save();
            }}
          >
            <Field label={<T>Hub URL</T>} htmlFor="usage-source-url" stacked>
              <Input
                id="usage-source-url"
                placeholder="https://hub.example.ts.net:8318"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                autoFocus
              />
            </Field>
            <Field label={<T>Management key</T>} htmlFor="usage-source-key" stacked>
              <SecretSourceInput
                id="usage-source-key"
                aria-label={gt("Management key")}
                value={keyDraft}
                sources={secretSources}
                environmentId={environmentId}
                onChange={(event) => setKeyDraft(event.target.value)}
                onSecretChange={(secret) => setKeyDraft(secret ?? "")}
                onValidityChange={setKeyValid}
              />
            </Field>
            <Field label={<T>Label (optional)</T>} htmlFor="usage-source-label" stacked>
              <Input
                id="usage-source-label"
                placeholder={gt("Defaults to the hub's host name")}
                value={label}
                onChange={(event) => setLabel(event.target.value)}
              />
            </Field>
          </form>
        </DialogPanel>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
          >
            <T>Cancel</T>
          </Button>
          <Button type="submit" form={formId} disabled={!canSave}>
            <T>Add hub</T>
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
