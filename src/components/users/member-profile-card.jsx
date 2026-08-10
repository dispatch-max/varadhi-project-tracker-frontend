'use client'

import Link from 'next/link'
import { Mail, Shield } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useHasMounted } from '@/hooks/use-has-mounted'
import { getInitials, getAvatarColor, cn } from '@/utils'

// Was a static card hardcoded to "John Doe / john.doe@example.com". Now shows
// the actual signed-in user from the auth store.
export function MemberProfileCard() {
  const { user } = useAuthStore()
  const mounted = useHasMounted()

  // Auth state is persisted to storage and hydrated client-side, so render a
  // skeleton until mount to avoid a server/client markup mismatch.
  if (!mounted) {
    return (
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex animate-pulse flex-col items-center gap-3">
          <div className="h-16 w-16 rounded-full bg-slate-100" />
          <div className="h-4 w-28 rounded bg-slate-100" />
          <div className="h-3 w-36 rounded bg-slate-100" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="bg-card border border-border rounded-xl p-5">
        <p className="text-sm text-muted-foreground">Not signed in.</p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex flex-col items-center text-center">
        <div
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-full text-lg font-semibold text-white',
            getAvatarColor(user.name || '?')
          )}
        >
          {getInitials(user.name || '?')}
        </div>

        <h3 className="mt-3 text-base font-semibold text-foreground">{user.name}</h3>

        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium capitalize text-violet-700">
          <Shield className="h-3 w-3" />
          {user.role}
        </span>

        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Mail className="h-3.5 w-3.5" />
          <span className="truncate">{user.email}</span>
        </p>

        <Link
          href="/settings"
          className="mt-4 w-full rounded-lg border border-border py-2 text-sm font-medium text-foreground transition hover:bg-background"
        >
          Edit Profile
        </Link>
      </div>
    </div>
  )
}
