"use client";

import { useCallback, useEffect, useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { teamsApi } from "@/lib/api/teams.api";
import { formatRelativeTime } from "@/utils";

/**
 * Webhook Health Dashboard — PRD screen flow 22.
 *
 * Renders `error` verbatim because it is only ever a Teams/network message;
 * the URL is decrypted inside teams-delivery.js and held in a local variable
 * that never reaches the log row.
 */

const STATUS_STYLE = {
  sent: "text-emerald-600",
  pending: "text-amber-600",
  failed: "text-destructive",
  exhausted: "text-destructive",
  dropped: "text-muted-foreground",
};

export default function WebhookHealth({ webhookId }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    try {
      setData(await teamsApi.getWebhookHealth(webhookId));
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [webhookId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  if (isLoading) {
    return <div className="mt-4 h-24 animate-pulse rounded-md bg-muted" />;
  }

  if (error) {
    return (
      <p role="status" className="mt-4 text-sm text-destructive">
        Couldn&apos;t load delivery history.{" "}
        <button type="button" onClick={load} className="underline underline-offset-2">
          Retry
        </button>
      </p>
    );
  }

  const stats = data?.stats || {};
  const deliveries = data?.deliveries || [];

  return (
    <div className="mt-4 rounded-lg bg-muted/40 p-3">
      <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Delivered" value={stats.sent ?? 0} className="text-emerald-600" />
        <Stat label="Failed" value={stats.failed ?? 0} className="text-destructive" />
        <Stat label="Pending" value={stats.pending ?? 0} className="text-amber-600" />
        <Stat
          label="Success rate"
          value={stats.successRate === null || stats.successRate === undefined ? "—" : `${stats.successRate}%`}
        />
      </div>

      {deliveries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No delivery attempts recorded yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>HTTP</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveries.slice(0, 15).map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="text-sm">
                    {d.eventType || d.cardKind || "—"}
                    {d.error && (
                      <span className="block max-w-xs truncate text-xs text-destructive">
                        {d.error}
                      </span>
                    )}
                  </TableCell>
                  <TableCell
                    className={`text-sm capitalize ${STATUS_STYLE[d.status] || ""}`}
                  >
                    {d.status}
                    {d.attempts > 1 && (
                      <span className="text-muted-foreground"> ({d.attempts}×)</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {d.httpStatus ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatRelativeTime(d.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, className = "" }) {
  return (
    <div>
      <p className={`text-lg font-semibold ${className}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
