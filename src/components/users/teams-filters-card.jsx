'use client'

import {
  Users,
  Shield,
  User,
  Mail,
  Clock3,
  Folder,
  Plus
} from 'lucide-react'

export function TeamsFiltersCard() {
  return (
    <div className="bg-card border border-border rounded-xl p-5">

      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground mb-5">
        Teams & Filters
      </h3>

      {/* Filters */}
      <div className="space-y-1">

        <button className="w-full flex items-center justify-between px-3 py-3 rounded-lg bg-violet-50 text-violet-700">
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">All Members</span>
          </div>
          <span className="text-sm font-semibold">13</span>
        </button>

        <button className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-background">
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">Managers</span>
          </div>
          <span className="text-sm text-muted-foreground">4</span>
        </button>

        <button className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-background">
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">Employees</span>
          </div>
          <span className="text-sm text-muted-foreground">8</span>
        </button>

        <button className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-background">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">
              Pending Invites
            </span>
          </div>
          <span className="text-sm text-muted-foreground">1</span>
        </button>

        <button className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-background">
          <div className="flex items-center gap-3">
            <Clock3 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">Inactive</span>
          </div>
          <span className="text-sm text-muted-foreground">1</span>
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100 my-6" />

      {/* Departments Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">
            Departments
          </span>
        </div>

        <button>
          <Plus className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Departments */}
      <div className="space-y-4">

        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground">
            Development
          </span>
          <span className="text-sm text-muted-foreground">6</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground">
            Design
          </span>
          <span className="text-sm text-muted-foreground">2</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground">
            QA
          </span>
          <span className="text-sm text-muted-foreground">3</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground">
            Management
          </span>
          <span className="text-sm text-muted-foreground">2</span>
        </div>

      </div>

    </div>
  )
}