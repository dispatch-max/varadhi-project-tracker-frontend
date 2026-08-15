"use client";

import { useState } from "react";
import { Clock, Loader2, Pencil, XCircle } from "lucide-react";

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
 * Conflict Resolution (AC-20).
 *
 * The reference design shows three conflict archetypes with paired actions.
 * They are rendered here from real rows rather than as static illustrations,
 * and RESOLVED conflicts stay listed: under the default tracker_wins policy
 * the system resolves automatically, and the PRD still requires "the user is
 * notified of the overwrite". A vanished row would mean a silent overwrite.
 */

const CONFLICT_META = {
  time: {
    icon: Clock,
    title: "Time conflict",
    body: "Event time overlaps with another event.",
    tone: "text-amber-600 bg-amber-50",
    actions: [
      { value: "reschedule", label: "Reschedule", variant: "default" },
      { value: "keep_both", label: "Keep both", variant: "outline" },
    ],
  },
  update: {
    icon: Pencil,
    title: "Update conflict",
    body: "This event was changed in both the tracker and your calendar.",
    tone: "text-blue-600 bg-blue-50",
    actions: [
      { value: "use_tracker", label: "Use tracker", variant: "default" },
      { value: "use_calendar", label: "Use calendar", variant: "outline" },
    ],
  },
  deletion: {
    icon: XCircle,
    title: "Deletion conflict",
    body: "The event was deleted in one place but still exists in the other.",
    tone: "text-destructive bg-destructive/10",
    actions: [
      { value: "delete_everywhere", label: "Delete everywhere", variant: "destructive" },
      { value: "keep_event", label: "Keep event", variant: "outline" },
    ],
  },
};

export default function ConflictResolution({ conflicts = [], onResolved }) {
  const [busyId, setBusyId] = useState(null);
  const [status, setStatus] = useState(null);

  const handleResolve = async (conflict, resolution) => {
    setBusyId(conflict.id);
    setStatus(null);
    try {
      await calendarApi.resolveConflict(conflict.id, resolution);
      setStatus({ type: "success", text: "Conflict resolved." });
      onResolved?.();
    } catch (err) {
      setStatus({
        type: "error",
        text: err.response?.data?.message || "Couldn't resolve the conflict. Try again.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const unresolved = conflicts.filter((c) => !c.resolvedAt);
  const resolved = conflicts.filter((c) => c.resolvedAt).slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Conflict resolution</CardTitle>
        <CardDescription>
          {unresolved.length
            ? `${unresolved.length} conflict(s) need your decision.`
            : "Smart conflict detection with options to resolve or override."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {unresolved.length === 0 && resolved.length === 0 && (
          <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            No conflicts detected. When an event changes in both the tracker and
            your calendar, it will appear here.
          </p>
        )}

        {unresolved.map((conflict) => {
          const meta = CONFLICT_META[conflict.conflictType] || CONFLICT_META.update;
          const Icon = meta.icon;

          return (
            <div
              key={conflict.id}
              className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-start gap-3">
                <span className={`rounded-md p-2 ${meta.tone}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{meta.title}</p>
                  <p className="text-sm text-muted-foreground">{meta.body}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Detected {formatRelativeTime(conflict.detectedAt)} ·{" "}
                    <span className="capitalize">{conflict.provider}</span>
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                {meta.actions.map((action) => (
                  <Button
                    key={action.value}
                    size="sm"
                    variant={action.variant}
                    disabled={busyId === conflict.id}
                    onClick={() => handleResolve(conflict, action.value)}
                  >
                    {busyId === conflict.id && (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    )}
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          );
        })}

        {resolved.length > 0 && (
          <div className="pt-1">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Recently resolved
            </p>
            <ul className="space-y-1.5">
              {resolved.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 text-sm text-muted-foreground"
                >
                  <span className="truncate">
                    {(CONFLICT_META[c.conflictType] || CONFLICT_META.update).title} ·{" "}
                    <span className="capitalize">{c.provider}</span>
                  </span>
                  <span className="shrink-0 text-xs">
                    {c.resolution?.replace(/_/g, " ")} ·{" "}
                    {formatRelativeTime(c.resolvedAt)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

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
