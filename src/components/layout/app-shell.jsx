'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { cn } from '@/utils'

export function AppShell({ children }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* Main content */}
      <div
        className={cn(
          'flex flex-col min-h-screen transition-all duration-300',
          collapsed ? 'ml-16' : 'ml-60'
        )}
      >

        {/* Topbar */}
        <Topbar />

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>

      </div>

    </div>
  )
}