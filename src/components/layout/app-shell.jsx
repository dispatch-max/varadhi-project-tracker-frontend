'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { cn } from '@/utils'

export function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">

      {/* Sidebar */}
      <Sidebar />

      {/* Main content — pushed right to make room for sidebar */}
      <div className="ml-60 flex flex-col min-h-screen transition-all duration-300">

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