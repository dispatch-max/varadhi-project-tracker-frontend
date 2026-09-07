'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { InstallPrompt } from '@/components/shared/install-prompt'
import { OfflineBanner } from '@/components/shared/offline-banner'
import { SyncStatus } from '@/components/shared/sync-status'
import { SyncConflicts } from '@/components/shared/sync-conflicts'
import { cn } from '@/utils'

export function AppShell({ children }) {
  // Owned here rather than inside Sidebar: the main column has to shift with
  // the rail, so both need to read the same value. Sidebar keeps working
  // standalone because it falls back to its own state when no prop is passed.
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main content — pushed right to make room for sidebar */}
      <div
        className={cn(
          'flex flex-col min-h-screen min-w-0 transition-all duration-300 ease-in-out',
          collapsed ? 'ml-16' : 'ml-60'
        )}
      >

        {/* Topbar */}
        <Topbar />

        {/* Page content */}
        <main className="flex-1 p-6">
          {/* Renders null while online. Above the install prompt because a
              user who can't reach the network needs to know that before
              they're invited to install anything. */}
          <OfflineBanner className="mb-5" />
          {/* Conflicts first — they need a decision before anything else
              queued behind them can sync. Both render null when empty. */}
          <SyncConflicts className="mb-5" />
          <SyncStatus className="mb-5" />
          {/* Renders null unless the browser offers an install and the user
              hasn't already installed or dismissed it this session. */}
          <InstallPrompt className="mb-5" />
          {children}
        </main>

      </div>

    </div>
  )
}