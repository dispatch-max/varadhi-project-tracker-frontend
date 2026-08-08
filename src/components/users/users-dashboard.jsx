'use client'

import { RecentlyJoinedCard } from './recently-joined-card'

export function UsersDashboard() {
  return (
    <div className="grid lg:grid-cols-3 gap-5 mb-6">
      <RecentlyJoinedCard />

      {/* NEXT */}
      <div />

      {/* NEXT */}
      <div />
    </div>
  )
}