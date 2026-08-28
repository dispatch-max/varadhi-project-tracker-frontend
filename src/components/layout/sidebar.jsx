'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  KanbanSquare,
  Files,
  BarChart3,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

import { useAuthStore } from '@/store/auth.store'
import { authApi } from '@/lib/api/auth.api'
import { clearOfflineCaches } from '@/lib/offline-cache'
import { disablePush } from '@/lib/push'
import { countForUser, clearForUser } from '@/lib/outbox'
import { release as releaseReplayLock } from '@/lib/replay-lock'
import { useOutboxStore } from '@/store/outbox.store'
import { NAV_ITEMS } from '@/constants'
import { getInitials, getAvatarColor, cn } from '@/utils'
import { useHasMounted } from '@/hooks/use-has-mounted'

// NAV_ITEMS carries icon NAMES, not components, so every entry there needs a
// matching key here. A missing key renders no icon at all (the JSX guards with
// `{Icon && ...}`) rather than erroring — so an omission fails silently.
const ICON_MAP = {
  LayoutDashboard,
  FolderOpen: FolderKanban,
  ListChecks,
  LayoutKanban: KanbanSquare,
  Files,
  BarChart3,
  Users,
  Settings,
  Bell,
  CalendarSync,
  MessageSquare,
  // Added by the V2.0 release branch's Leave/Time nav entries.
  CalendarDays,
  Clock3,
}

export function Sidebar({ collapsed, setCollapsed }) {
  const pathname = usePathname()
  const router = useRouter()

  // Collapsed rail (w-16) vs full sidebar (w-60), toggled by the chevron button.
  // AppShell owns this so the main column can shift with the rail; the local
  // state is the fallback for rendering Sidebar without those props.
  const [collapsedLocal, setCollapsedLocal] = useState(false)
  const collapsed = collapsedProp ?? collapsedLocal
  const setCollapsed = setCollapsedProp ?? setCollapsedLocal

  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const { user, clearAuth } = useAuthStore()
  const mounted = useHasMounted()

  // Filter navigation items based on user role
  const filteredNav = NAV_ITEMS.filter((item) =>
    item.roles.includes(user?.role || 'employee')
  )

  // Logout
  async function handleLogout() {
    // AC-15 safeguard: never silently destroy unsynced work. If anything is
    // still queued, stop and make the user decide — logging out clears the
    // outbox, and those changes exist nowhere else.
    const uid = user?.id
    if (uid) {
      const queued = await countForUser(uid).catch(() => 0)
      if (queued > 0 && !pendingLogout) {
        setPendingLogout({ count: queued })
        return
      }
    }

    setIsLoggingOut(true)

    try {
      await authApi.logout()
    } catch {
      // Ignore logout API error
    } finally {
      clearAuth()

      document.cookie =
        'varadhi_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'

      router.push('/auth/login')
    }
  }

  // Sidebar content depends on the auth store (client-only), so don't render
  // it until after mount to keep SSR and the first client render in sync.
  if (!mounted) return null

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-white border-r border-slate-200 flex flex-col z-20 transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
          V
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-semibold text-slate-800 leading-tight">
              Varadhi
            </p>
            <p className="text-xs text-slate-400">Tracker</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="ml-auto text-slate-400 hover:text-slate-600 flex-shrink-0"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">

        {filteredNav.map((item) => {
          const Icon = ICON_MAP[item.icon]

          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                isActive
                  ? 'bg-violet-50 text-violet-700'
                  : 'text-muted-foreground hover:bg-background hover:text-foreground'
              )}
            >
              {/* Icon */}
              {Icon && (
                <Icon
                  strokeWidth={isActive ? 2.2 : 1.8}
                  className={cn(
                    'w-[18px] h-[18px] flex-shrink-0 transition-all duration-200',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
              )}

              {/* Text */}
              {!collapsed && <span>{item.label}</span>}

              {/* Active indicator when collapsed */}
              {collapsed && isActive && (
                <span
                  className="
                    absolute
                    left-0
                    w-1
                    h-6
                    bg-violet-600
                    rounded-r-full
                  "
                />
              )}

            </Link>
          )
        })}

      </nav>

      {/* User + Logout */}
      <div className="border-t border-slate-100 p-3 space-y-1">
        <div
          className={cn(
            'flex items-center gap-3 px-2 py-2 rounded-lg',
            collapsed ? 'justify-center' : ''
          )}
        >
          <div
            className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0',
              getAvatarColor(user?.name || 'U')
            )}
          >
            {getInitials(user?.name || 'User')}
          </div>

          {/* User Text */}
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {user?.name}
              </p>

              <p className="text-xs text-muted-foreground truncate capitalize">
                {user?.role}
              </p>

            </div>
          )}

        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground transition-all duration-200 hover:bg-red-50 hover:text-red-600',
            collapsed ? 'justify-center' : ''
          )}
        >

          <LogOut className="w-4 h-4 flex-shrink-0" />

          {!collapsed && <span>Logout</span>}
        </button>

        {/* AC-15 safeguard: unsynced work would be destroyed by signing out,
            and it exists nowhere but this browser. Require an explicit,
            informed confirmation rather than discarding it quietly. */}
        {pendingLogout && (
          <div
            role="alertdialog"
            aria-label="Unsynced changes"
            className="absolute bottom-16 left-2 right-2 z-30 rounded-lg border border-amber-300 bg-white p-3 shadow-lg"
          >
            <p className="text-xs font-semibold text-slate-800">
              {pendingLogout.count} unsynced change
              {pendingLogout.count === 1 ? '' : 's'}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
              These were made offline and haven&apos;t reached the server. If you
              log out now they will be <strong>permanently lost</strong>.
              Reconnect and let them sync first if you want to keep them.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="rounded-md bg-red-600 px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-red-700"
              >
                Discard &amp; log out
              </button>
              <button
                onClick={() => setPendingLogout(null)}
                className="rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

    </aside>
  )
}