'use client'

import {
  X,
  Mail,
  MapPin,
  Calendar,
  ClipboardList,
  FolderOpen,
  Users,
  Shield,
  CheckCircle
} from 'lucide-react'

export function MemberProfileCard() {
  return (
    <div className="bg-card border border-border rounded-xl p-5">

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <h3 className="text-lg font-semibold text-foreground">
          Member Profile
        </h3>

        <button>
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* User */}
      <div className="flex gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white text-2xl font-semibold">
            JD
          </div>

          <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-white" />
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            John Doe
          </h2>

          <span className="inline-flex mt-1 px-2 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-medium">
            Manager
          </span>

          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              john.doe@example.com
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              Hyderabad, India
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              Joined on Jul 24, 2024
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100 my-6" />

      {/* Overview */}
      <h4 className="text-sm font-semibold text-foreground mb-4">
        Overview
      </h4>

      <div className="space-y-4">

        <div className="flex justify-between">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <ClipboardList className="w-4 h-4" />
            Tasks Completed
          </div>

          <span className="text-sm font-medium text-foreground">
            24
          </span>
        </div>

        <div className="flex justify-between">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <FolderOpen className="w-4 h-4" />
            Active Projects
          </div>

          <span className="text-sm font-medium text-foreground">
            3
          </span>
        </div>

        <div className="flex justify-between">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Users className="w-4 h-4" />
            Team
          </div>

          <span className="text-sm font-medium text-foreground">
            Development
          </span>
        </div>

        <div className="flex justify-between">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Shield className="w-4 h-4" />
            Role
          </div>

          <span className="text-sm font-medium text-foreground">
            Manager
          </span>
        </div>

        <div className="flex justify-between">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <CheckCircle className="w-4 h-4" />
            Status
          </div>

          <span className="px-2 py-1 rounded-md bg-green-100 text-green-700 text-xs font-medium">
            Active
          </span>
        </div>

      </div>

      {/* Buttons */}
      <div className="mt-8 space-y-3">

        <button className="w-full border border-violet-200 bg-violet-50 text-violet-600 py-3 rounded-lg text-sm font-medium hover:bg-violet-100">
          Edit Profile
        </button>

        <button className="w-full border border-red-200 bg-red-50 text-red-500 py-3 rounded-lg text-sm font-medium hover:bg-red-100">
          Deactivate User
        </button>

      </div>

    </div>
  )
}