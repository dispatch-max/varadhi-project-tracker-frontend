"use client";

import {
  ArrowRightLeft,
  ArrowRight,
  Bell,
  CalendarDays,
  CheckSquare,
  Clock,
  Flag,
  RefreshCw,
  Users,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * The "Supported Sync Items" matrix from the reference design.
 *
 * Direction is DERIVED from the active sync setting rather than hardcoded to
 * "Two-way" as the mock shows. A static matrix claiming two-way while the
 * user has selected "Tracker → Calendar only" would be actively misleading
 * about where their data goes.
 */

const ITEMS = [
  { label: "Tasks", icon: CheckSquare, settingKey: "syncTasks" },
  { label: "Due Dates", icon: Clock, settingKey: "syncTasks" },
  { label: "Milestones", icon: Flag, settingKey: "syncMilestones" },
  { label: "Meetings", icon: Users, settingKey: "syncMeetings" },
  { label: "Recurring Events", icon: RefreshCw, settingKey: "syncTasks" },
  { label: "Reminders", icon: Bell, settingKey: "syncReminders" },
];

const DIRECTION_LABEL = {
  two_way: "Two-way",
  to_calendar: "To calendar",
  from_calendar: "From calendar",
};

export default function SupportedSyncItems({ connections = [] }) {
  const active = connections.find((c) => c.status === "connected") || connections[0];
  const settings = active?.settings || {};
  const direction = settings.syncDirection || "two_way";
  const hasGoogle = connections.some((c) => c.provider === "google");
  const hasOutlook = connections.some((c) => c.provider === "outlook");

  const DirectionIcon = direction === "two_way" ? ArrowRightLeft : ArrowRight;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          Supported sync items
        </CardTitle>
        <CardDescription>
          What currently flows between the tracker and your calendars.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Tables are the one thing guaranteed to overflow on a phone, so it
            scrolls inside its own container rather than the page body. */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Tracker</TableHead>
                <TableHead>Google</TableHead>
                <TableHead>Outlook</TableHead>
                <TableHead>Direction</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ITEMS.map((item) => {
                const Icon = item.icon;
                // Default to enabled when there is no connection yet, so the
                // matrix reads as a capability list rather than all-off.
                const enabled =
                  active === undefined ? true : settings[item.settingKey] !== false;

                return (
                  <TableRow key={item.label} className={enabled ? "" : "opacity-50"}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {item.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Dot on={enabled} />
                    </TableCell>
                    <TableCell>
                      <Dot on={enabled && hasGoogle} />
                    </TableCell>
                    <TableCell>
                      <Dot on={enabled && hasOutlook} />
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <DirectionIcon className="h-3.5 w-3.5" />
                        {enabled ? DIRECTION_LABEL[direction] : "Off"}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function Dot({ on }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${
        on ? "bg-emerald-500" : "bg-muted-foreground/30"
      }`}
      role="img"
      aria-label={on ? "Enabled" : "Not enabled"}
    />
  );
}
