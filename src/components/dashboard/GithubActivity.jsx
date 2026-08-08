'use client'

import {
  GitCommit,
  GitBranch,
  User,
  Clock,
  MoreHorizontal,
} from 'lucide-react'

const activities = [
  {
    type: 'feat',
    message: 'add password reset flow',
    author: 'Agnimsha',
    branch: 'feature/reset-flow',
    time: '2m ago',
    color: 'bg-violet-100 text-violet-600',
  },
  {
    type: 'fix',
    message: 'resolve api timeout issue',
    author: 'Anirudh',
    branch: 'fix/api-timeout',
    time: '18m ago',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    type: 'docs',
    message: 'update README for v2.3',
    author: 'Deepthi',
    branch: 'docs/readme',
    time: '1h ago',
    color: 'bg-cyan-100 text-cyan-600',
  },
  {
    type: 'refactor',
    message: 'optimize query performance',
    author: 'Robert',
    branch: 'refactor/db',
    time: '3h ago',
    color: 'bg-slate-200 text-muted-foreground',
  },
  {
    type: 'chore',
    message: 'bump dependencies',
    author: 'Indu',
    branch: 'chore/update',
    time: 'Yesterday',
    color: 'bg-indigo-100 text-indigo-600',
  },
]

export function GithubActivity() {
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
        p-6
        flex flex-col
      "
    >
      {/* Glow */}
      <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-violet-300/20 blur-3xl" />

      {/* Header */}
      <div className="relative z-10 mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          GitHub Activity
        </h3>

        <MoreHorizontal className="h-5 w-5 cursor-pointer text-slate-400" />
      </div>

      {/* Activity List */}
      <div className="relative z-10 flex-1 space-y-4">
        {activities.map((item) => (
          <div
            key={item.message}
            className="
              flex
              items-start
              justify-between
              gap-4
            "
          >
            {/* Left */}
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={`
                  flex h-8 w-8 flex-shrink-0
                  items-center justify-center
                  rounded-full
                  ${item.color}
                `}
              >
                <GitCommit className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  <span className="font-semibold">
                    {item.type}
                  </span>
                  : {item.message}
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {item.author}
                  </span>

                  <span className="flex items-center gap-1">
                    <GitBranch className="h-3.5 w-3.5" />
                    {item.branch}
                  </span>
                </div>
              </div>
            </div>

            {/* Time */}
            <div className="flex flex-shrink-0 items-center gap-1 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              {item.time}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}