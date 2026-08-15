"use client";

import { useState } from "react";
import {
  Activity,
  CheckCircle2,
  Loader2,
  Send,
  Trash2,
  TriangleAlert,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { teamsApi, DIGEST_OPTIONS } from "@/lib/api/teams.api";
import { formatRelativeTime } from "@/utils";
import WebhookHealth from "@/components/teams/webhook-health";

/**
 * Configured channels — combines the PRD's Event Type Selection screen (21)
 * and Webhook Health Dashboard (22) into one expandable row per webhook, since
 * both only ever apply to a single webhook at a time.
 *
 * Note what is NOT here: the webhook URL. Only `urlHint` exists client-side.
 */
export default function WebhookList({ webhooks = [], eventTypes = [], onChanged }) {
  const [busyId, setBusyId] = useState(null);
  const [status, setStatus] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const setBusy = (id, fn) => async (...args) => {
    setBusyId(id);
    setStatus(null);
    try {
      await fn(...args);
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleEvent = async (webhook, value, checked) => {
    const next = checked
      ? [...new Set([...(webhook.eventTypes || []), value])]
      : (webhook.eventTypes || []).filter((t) => t !== value);

    await setBusy(webhook.id, async () => {
      try {
        await teamsApi.updateWebhook(webhook.id, { eventTypes: next });
        onChanged?.();
      } catch (err) {
        setStatus({
          type: "error",
          text: err.response?.data?.message || "Couldn't update event types.",
        });
      }
    })();
  };

  const handleToggleEnabled = async (webhook, enabled) => {
    await setBusy(webhook.id, async () => {
      try {
        await teamsApi.updateWebhook(webhook.id, { enabled });
        onChanged?.();
      } catch (err) {
        setStatus({
          type: "error",
          text: err.response?.data?.message || "Couldn't update the webhook.",
        });
      }
    })();
  };

  const handleDigest = async (webhook, summaryDigest) => {
    await setBusy(webhook.id, async () => {
      try {
        await teamsApi.updateWebhook(webhook.id, { summaryDigest });
        onChanged?.();
      } catch (err) {
        setStatus({
          type: "error",
          text: err.response?.data?.message || "Couldn't update summary posts.",
        });
      }
    })();
  };

  const handleTest = async (webhook) => {
    await setBusy(webhook.id, async () => {
      try {
        await teamsApi.testWebhook(webhook.id);
        setStatus({ type: "success", text: "Test message posted to the channel." });
        onChanged?.();
      } catch (err) {
        setStatus({
          type: "error",
          text: err.response?.data?.message || "The test message could not be delivered.",
        });
      }
    })();
  };

  const handleDelete = async (webhook) => {
    setPendingDelete(null);
    await setBusy(webhook.id, async () => {
      try {
        await teamsApi.deleteWebhook(webhook.id);
        setStatus({ type: "success", text: "Webhook revoked." });
        onChanged?.();
      } catch (err) {
        setStatus({
          type: "error",
          text: err.response?.data?.message || "Couldn't revoke the webhook.",
        });
      }
    })();
  };

  if (!webhooks.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configured channels</CardTitle>
          <CardDescription>
            No Teams channels are connected yet. Add one above to start posting
            project activity.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Configured channels</CardTitle>
        <CardDescription>
          Choose which events post to each channel, and monitor delivery health.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {webhooks.map((webhook) => {
          const busy = busyId === webhook.id;
          const isExpanded = expandedId === webhook.id;

          return (
            <div key={webhook.id} className="rounded-lg border p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {webhook.name || webhook.projectName || "Teams channel"}
                    {webhook.enabled ? (
                      <span className="flex items-center gap-1 text-xs font-normal text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-normal text-destructive">
                        <TriangleAlert className="h-3.5 w-3.5" />
                        Disabled
                      </span>
                    )}
                  </p>
                  {/* The masked hint — never the URL itself. */}
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {webhook.urlHint}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {webhook.projectName || "All projects"}
                    {webhook.lastSuccessAt
                      ? ` · last delivered ${formatRelativeTime(webhook.lastSuccessAt)}`
                      : " · no deliveries yet"}
                  </p>
                  {webhook.disabledReason && (
                    <p className="mt-1 text-xs text-destructive">
                      {webhook.disabledReason}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Switch
                    checked={webhook.enabled}
                    disabled={busy}
                    onCheckedChange={(v) => handleToggleEnabled(webhook, v)}
                    aria-label="Enable webhook"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => handleTest(webhook)}
                  >
                    {busy ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      setExpandedId(isExpanded ? null : webhook.id)
                    }
                  >
                    <Activity className="mr-1.5 h-3.5 w-3.5" />
                    Health
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    className="text-destructive hover:text-destructive"
                    onClick={() => setPendingDelete(webhook)}
                    aria-label="Revoke webhook"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <Separator className="my-4" />

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Events posted to this channel
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {eventTypes.map((et) => {
                    const checked = (webhook.eventTypes || []).includes(et.value);
                    const id = `${webhook.id}-${et.value}`;
                    return (
                      <label
                        key={id}
                        htmlFor={id}
                        className="flex cursor-pointer items-center gap-2 text-sm"
                      >
                        <input
                          id={id}
                          type="checkbox"
                          checked={checked}
                          disabled={busy}
                          onChange={(e) =>
                            handleToggleEvent(webhook, et.value, e.target.checked)
                          }
                          className="h-4 w-4 rounded border-input accent-violet-600"
                        />
                        <span className={checked ? "" : "text-muted-foreground"}>
                          {et.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Label
                  htmlFor={`${webhook.id}-digest`}
                  className="text-sm font-medium"
                >
                  Summary posts
                </Label>
                <select
                  id={`${webhook.id}-digest`}
                  value={webhook.summaryDigest}
                  disabled={busy}
                  onChange={(e) => handleDigest(webhook, e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 sm:w-52"
                >
                  {DIGEST_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {isExpanded && <WebhookHealth webhookId={webhook.id} />}
            </div>
          );
        })}

        {status && (
          <p
            role="status"
            className={
              status.type === "success"
                ? "text-sm text-emerald-600"
                : "text-sm text-destructive"
            }
          >
            {status.text}
          </p>
        )}
      </CardContent>

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this webhook?</AlertDialogTitle>
            <AlertDialogDescription>
              No further messages will be sent to this channel and the delivery
              history will be removed. To reconnect, you will need to paste the
              webhook URL again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(pendingDelete)}>
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
