"use client";

import Link from "next/link";
import { CalendarDays, CircleCheck, CircleDashed } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/utils";

/**
 * Calendar Preview — the "what will my week look like" panel from the
 * reference design.
 *
 * Built from the tracker's own upcoming items rather than fetched from the
 * provider: these ARE the events being synced, and re-reading them from Google
 * on every render would spend API quota to display data we already hold.
 *
 * Each row shows whether it is actually mirrored yet, which is the honest
 * answer to "is my calendar up to date" — a preview that implied everything
 * was synced would hide exactly the failure this panel should surface.
 */

const PRIORITY_BAR = {
  critical: "bg-red-400",
  high: "bg-orange-400",
  medium: "bg-amber-400",
  low: "bg-slate-300",
};

function groupByDay(events) {
  const groups = new Map();
  for (const event of events) {
    const key = String(event.dueDate || "").slice(0, 10);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(event);
  }
  return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

export default function CalendarPreview({ events = [], isLoading }) {
  const days = groupByDay(events);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          Calendar preview
        </CardTitle>
        <CardDescription>
          Your upcoming deadlines as they appear on a connected calendar.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-12 animate-pulse rounded-md bg-muted" />
            <div className="h-12 animate-pulse rounded-md bg-muted" />
          </div>
        ) : days.length === 0 ? (
          <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            Nothing scheduled in the next two weeks.
          </p>
        ) : (
          <div className="space-y-4">
            {days.map(([day, items]) => (
              <div key={day}>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {formatDate(day, "EEE, MMM dd")}
                </p>
                <ul className="space-y-1.5">
                  {items.map((event) => (
                    <li key={event.sourceId}>
                      <Link
                        href={event.link}
                        className="flex items-center gap-3 rounded-md border p-2.5 transition-colors hover:bg-muted/50"
                      >
                        <span
                          className={`h-8 w-1 shrink-0 rounded-full ${
                            PRIORITY_BAR[event.priority] || PRIORITY_BAR.low
                          }`}
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {event.title}
                          </span>
                          {event.projectName && (
                            <span className="block truncate text-xs text-muted-foreground">
                              {event.projectName}
                            </span>
                          )}
                        </span>
                        <span
                          className="shrink-0"
                          title={
                            event.synced
                              ? `Synced to ${event.provider}`
                              : "Not yet synced"
                          }
                        >
                          {event.synced ? (
                            <CircleCheck className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <CircleDashed className="h-4 w-4 text-muted-foreground" />
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
