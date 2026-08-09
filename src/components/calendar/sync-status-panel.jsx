"use client";

import { useState } from "react";
import { Loader2, RefreshCw, TriangleAlert } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { calendarApi } from "@/lib/api/calendar.api";
import { formatRelativeTime } from "@/utils";

/**
 * Sync Status Panel — PRD screen flow 18: "last sync time, item count, error
 * indicators", plus a manual "Sync now" so a user does not have to wait out
 * the 5-minute cron to see whether their configuration works.
 */
export default function SyncStatusPanel({ connections = [], onSynced }) {
  const [busyId, setBusyId] = useState(null);
  const [status, setStatus] = useState(null);

  const handleSync = async (connection) => {
    setBusyId(connection.id);
    setStatus(null);
    try {
      const { result } = await calendarApi.syncNow(connection.id);
      const parts = [];
      if (result.created) parts.push(`${result.created} created`);
      if (result.updated) parts.push(`${result.updated} updated`);
      if (result.removed) parts.push(`${result.removed} removed`);
      if (result.skipped) parts.push(`${result.skipped} already up to date`);
      if (result.conflicts) parts.push(`${result.conflicts} conflict(s)`);

      setStatus({
        type: result.failed ? "error" : "success",
        text: parts.length
          ? `Sync complete — ${parts.join(", ")}.`
          : "Sync complete — nothing to change.",
      });
      onSynced?.();
    } catch (err) {
      setStatus({
        type: "error",
        text: err.response?.data?.message || "Sync failed. Try again.",
      });
    } finally {
      setBusyId(null);
    }
  };

  if (!connections.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sync status</CardTitle>
        <CardDescription>
          Calendars refresh automatically every 5 minutes.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {connections.map((c) => (
          <div
            key={c.id}
            className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium capitalize">{c.provider}</p>
              <p className="text-sm text-muted-foreground">
                {c.lastSyncedAt
                  ? `Last synced ${formatRelativeTime(c.lastSyncedAt)}`
                  : "Never synced"}
              </p>
              {c.lastError && (
                <p className="mt-1 flex items-start gap-1.5 text-sm text-destructive">
                  <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="break-words">{c.lastError}</span>
                </p>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              disabled={busyId === c.id || c.status !== "connected"}
              onClick={() => handleSync(c)}
            >
              {busyId === c.id ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              )}
              Sync now
            </Button>
          </div>
        ))}

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
    </Card>
  );
}
