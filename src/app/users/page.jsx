import { Suspense } from 'react'

import { UsersList } from '@/components/users/users-list'
import { RecentlyJoinedCard } from '@/components/users/recently-joined-card'
import { TopPerformersCard } from '@/components/users/top-performers-card'
import { PendingInvitesCard } from '@/components/users/pending-invites-card'
import { TeamsFiltersCard } from '@/components/users/teams-filters-card'
import { MemberProfileCard } from '@/components/users/member-profile-card'

export const metadata = {
  title: 'Users',
}

export default function UsersPage() {
  return (
    <div
      className="
        flex
        h-full
        min-h-0
        w-full
        min-w-0
        flex-col
        overflow-hidden
        bg-background
        px-4
        pb-2
        pt-0
      "
    >
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div
        className="
          mb-2
          shrink-0
          pt-0
        "
      >
        <h2
          className="
            text-[18px]
            font-bold
            tracking-tight
            text-foreground
          "
        >
          Team Members
        </h2>

        <p
          className="
            mt-0.5
            text-[11px]
            text-muted-foreground
          "
        >
          Manage your team — roles, permissions and invites.
        </p>
      </div>

      {/* =====================================================
          MAIN PAGE

          LEFT   = FILTERS + PROFILE
          CENTER = STATS + SEARCH + TABLE
          RIGHT  = PERFORMERS + INVITES + RECENT
      ====================================================== */}

      <div
        className="
          grid
          min-h-0
          min-w-0
          flex-1
          items-start
          gap-3
          overflow-hidden
        "
        style={{
          gridTemplateColumns:
            'minmax(210px,0.85fr) minmax(0,3.4fr) minmax(270px,1.2fr)',
        }}
      >
        {/* ===================================================
            LEFT COLUMN
        ==================================================== */}

        <div
          className="
            flex
            min-h-0
            min-w-0
            flex-col
            gap-3
            overflow-hidden
          "
        >
          {/* TEAMS & FILTERS */}

          <div
            className="
              min-w-0
              shrink-0
              overflow-hidden
            "
          >
            <Suspense fallback={null}>
              <TeamsFiltersCard />
            </Suspense>
          </div>

          {/* PROFILE */}

          <div
            className="
              min-w-0
              shrink-0
              overflow-hidden
            "
          >
            <MemberProfileCard />
          </div>
        </div>

        {/* ===================================================
            CENTER COLUMN

            UsersList already contains:
            - 4 statistics
            - search
            - roles
            - invite member
            - users table
        ==================================================== */}

        <div
          className="
            flex
            h-full
            min-h-0
            min-w-0
            flex-col
            overflow-hidden
          "
        >
          <Suspense fallback={null}>
            <UsersList />
          </Suspense>
        </div>

        {/* ===================================================
            RIGHT COLUMN

            IMPORTANT:
            FLEX + SHRINK-0

            No fractional grid rows.
            Therefore NO large spaces between cards.
        ==================================================== */}

        <div
          className="
            flex
            min-h-0
            min-w-0
            flex-col
            gap-3
            overflow-hidden
          "
        >
          {/* TOP PERFORMERS */}

          <div
            className="
              min-w-0
              shrink-0
              overflow-hidden
            "
          >
            <TopPerformersCard />
          </div>

          {/* PENDING INVITES */}

          <div
            className="
              min-w-0
              shrink-0
              overflow-hidden
            "
          >
            <PendingInvitesCard />
          </div>

          {/* RECENTLY JOINED */}

          <div
            className="
              min-w-0
              shrink-0
              overflow-hidden
            "
          >
            <RecentlyJoinedCard />
          </div>
        </div>
      </div>
    </div>
  )
}