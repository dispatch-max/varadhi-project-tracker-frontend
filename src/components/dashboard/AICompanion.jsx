'use client'

import {
  Sparkles,
  AlertTriangle,
  FileText,
  Bot,
  MoreHorizontal,
} from 'lucide-react'

export function AICompanion() {
  return (
    <div
      className="
      relative
      h-[320px]
      overflow-hidden
      rounded-3xl
      border border-white/30
      bg-gradient-to-br
      from-violet-100/80
      via-purple-50/60
      to-blue-100/70
      backdrop-blur-xl
      shadow-[0_8px_32px_rgba(139,92,246,0.15)]
      p-5
      flex flex-col
      "
    >
      {/* Background Glow */}
      <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-violet-300/20 blur-3xl" />
      <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-blue-300/20 blur-3xl" />

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500 shadow-sm">
            <Sparkles className="h-4 w-4 text-white" />
          </div>

          <h3 className="text-lg font-semibold text-foreground">
            AI Project Companion
          </h3>
        </div>

        <MoreHorizontal className="h-4 w-4 text-slate-400 cursor-pointer" />
      </div>

      {/* Content */}
      <div className="mt-4 relative z-10">
        <p className="text-sm leading-6 text-muted-foreground">
          Sprint 10 is 68% complete, 3 tasks are at risk due to dependency
          delays. Suggestion: Reassign 2 tasks to available team members to
          stay on track.
        </p>
      </div>

      {/* Buttons Section */}
      <div
        className="
        mt-auto
        rounded-xl
        border border-white/50
        bg-card/60
        backdrop-blur-md
        shadow-sm
        p-3
        relative z-10
        overflow-y-auto
        "
      >
        
        <div className="flex flex-col gap-3">
          <button
            className="
            flex items-center gap-2
            whitespace-nowrap
            rounded-xl
            border border-border
            bg-card/80
            px-3 py-2
            text-xs font-medium
            shadow-sm
            "
          >
            <AlertTriangle className="h-4 w-4" />
            Roll Risks
          </button>

          <button
            className="
            flex items-center gap-2
            whitespace-nowrap
            rounded-xl
            border border-border
            bg-card/80
            px-3 py-2
            text-xs font-medium
            shadow-sm
            "
          >
            <FileText className="h-4 w-4" />
            Generate Report
          </button>

          <button
            className="
            flex items-center gap-2
            whitespace-nowrap
            rounded-xl
            border border-border
            bg-card/80
            px-3 py-2
            text-xs font-medium
            shadow-sm
            "
          >
            <Bot className="h-4 w-4" />
            Ask AI
          </button>
        </div>
      </div>
    </div>
  )
}