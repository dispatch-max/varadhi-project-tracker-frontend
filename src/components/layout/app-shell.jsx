'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { cn } from '@/utils'

export function AppShell({ children }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* 1. Sidebar - Fixed on Left */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* 2. Main Content Wrapper */}
      <div
        className={cn(
          "flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 ease-in-out",
          collapsed ? "ml-16" : "ml-60"
        )}
      >
        <Topbar />

        {/* 3. Page Content Area */}
        <main className="flex-1 p-6 w-full max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}