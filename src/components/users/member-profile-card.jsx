'use client'

import Link from 'next/link'
import { Mail, Shield } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useHasMounted } from '@/hooks/use-has-mounted'
import {
  getInitials,
  getAvatarColor,
  cn,
} from '@/utils'

// Shows the actual signed-in user from the auth store.
export function MemberProfileCard() {
  const { user } = useAuthStore()
  const mounted = useHasMounted()

  // Prevent hydration mismatch while auth store hydrates.
  if (!mounted) {
    return (
      <div
        className="
          w-full
          min-w-0
          max-w-full
          overflow-hidden
          rounded-xl
          border
          border-border
          bg-card
          p-4
        "
      >
        <div className="flex min-w-0 animate-pulse flex-col items-center gap-3">
          <div className="h-14 w-14 shrink-0 rounded-full bg-slate-100" />

          <div className="h-4 w-24 max-w-full rounded bg-slate-100" />

          <div className="h-3 w-28 max-w-full rounded bg-slate-100" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div
        className="
          w-full
          min-w-0
          max-w-full
          overflow-hidden
          rounded-xl
          border
          border-border
          bg-card
          p-4
        "
      >
        <p className="truncate text-sm text-muted-foreground">
          Not signed in.
        </p>
      </div>
    )
  }

  return (
    <div
      className="
        w-full
        min-w-0
        max-w-full
        overflow-hidden
        rounded-xl
        border
        border-border
        bg-card
        p-4
      "
    >
      <div
        className="
          flex
          w-full
          min-w-0
          flex-col
          items-center
          overflow-hidden
          text-center
        "
      >
        {/* AVATAR */}
        <div
          className={cn(
            `
              flex
              h-14
              w-14
              shrink-0
              items-center
              justify-center
              rounded-full
              text-base
              font-semibold
              text-white
            `,
            getAvatarColor(
              user.name || '?'
            )
          )}
        >
          {getInitials(
            user.name || '?'
          )}
        </div>

        {/* NAME */}
        <h3
          className="
            mt-3
            w-full
            min-w-0
            truncate
            text-sm
            font-semibold
            text-foreground
          "
          title={user.name}
        >
          {user.name}
        </h3>

        {/* ROLE */}
        <span
          className="
            mt-1
            inline-flex
            max-w-full
            min-w-0
            items-center
            gap-1
            rounded-full
            bg-violet-50
            px-2
            py-0.5
            text-[11px]
            font-medium
            capitalize
            text-violet-700
          "
        >
          <Shield className="h-3 w-3 shrink-0" />

          <span className="truncate">
            {user.role}
          </span>
        </span>

        {/* EMAIL */}
        <div
          className="
            mt-3
            flex
            w-full
            min-w-0
            items-center
            justify-center
            gap-1.5
            overflow-hidden
            text-xs
            text-muted-foreground
          "
        >
          <Mail className="h-3.5 w-3.5 shrink-0" />

          <span
            className="
              min-w-0
              max-w-full
              truncate
            "
            title={user.email}
          >
            {user.email}
          </span>
        </div>

        {/* EDIT PROFILE */}
        <Link
          href="/settings"
          className="
            mt-4
            block
            w-full
            min-w-0
            max-w-full
            truncate
            rounded-lg
            border
            border-border
            px-2
            py-2
            text-center
            text-xs
            font-medium
            text-foreground
            transition
            hover:bg-background
          "
        >
          Edit Profile
        </Link>
      </div>
    </div>
  )
}