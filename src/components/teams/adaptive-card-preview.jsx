"use client";

import { AlertTriangle, BarChart3, CheckSquare, FileCheck } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Example Adaptive Cards — mirrors the reference design's preview panel.
 *
 * Static, illustrative renderings of the four card kinds teams-cards.js emits.
 * Their purpose is to let an admin see what a channel will actually receive
 * BEFORE pointing a webhook at it, which is the difference between an informed
 * configuration and a surprise for a room full of people.
 *
 * These are approximations of Teams' rendering, not the live card JSON — that
 * is built server-side, and duplicating the builders here would create a
 * second source of truth destined to drift.
 */

const CARDS = [
  {
    icon: CheckSquare,
    tone: "bg-violet-50 text-violet-600",
    title: "New Task Assigned",
    facts: [
      ["Task", "UI Design for Dashboard"],
      ["Project", "Website Redesign"],
      ["Due", "30 May 2025"],
      ["Priority", "High"],
    ],
    actions: [{ label: "View Task", variant: "primary" }],
  },
  {
    icon: FileCheck,
    tone: "bg-blue-50 text-blue-600",
    title: "Approval Request",
    facts: [
      ["Item", "Marketing Plan"],
      ["Requested by", "Jagdish Kumar"],
      ["Due", "28 May 2025"],
    ],
    actions: [{ label: "View Details", variant: "primary" }],
  },
  {
    icon: AlertTriangle,
    tone: "bg-amber-50 text-amber-600",
    title: "⚠ Deadline Approaching",
    facts: [
      ["Task", "API Integration"],
      ["Due", "29 May 2025"],
      ["Time Left", "1 day"],
    ],
    actions: [{ label: "View Details", variant: "primary" }],
  },
  {
    icon: BarChart3,
    tone: "bg-emerald-50 text-emerald-600",
    title: "Daily Summary",
    facts: [
      ["Completed", "5"],
      ["In Progress", "8"],
      ["Overdue", "2"],
    ],
    actions: [{ label: "Open Dashboard", variant: "primary" }],
  },
];

export default function AdaptiveCardPreview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Example adaptive cards</CardTitle>
        <CardDescription>
          How events appear in your Teams channel.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="rounded-lg border bg-background p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className={`rounded-md p-1.5 ${card.tone}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <p className="text-sm font-semibold">{card.title}</p>
              </div>

              <dl className="space-y-1">
                {card.facts.map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-xs">
                    <dt className="w-24 shrink-0 text-muted-foreground">{k}</dt>
                    <dd className="min-w-0 flex-1 truncate">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-3 flex gap-2">
                {card.actions.map((a) => (
                  <span
                    key={a.label}
                    className="rounded bg-violet-600 px-2.5 py-1 text-xs font-medium text-white"
                  >
                    {a.label}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
