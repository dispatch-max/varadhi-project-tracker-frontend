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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Team Members
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your team — roles, permissions and invites.
        </p>
      </div>
      

           <div className="grid lg:grid-cols-3 gap-5">
      <RecentlyJoinedCard />
<TopPerformersCard />
 <PendingInvitesCard />
      </div>

<div className="grid lg:grid-cols-[260px_1fr_320px] gap-5">
  <TeamsFiltersCard />

  <UsersList />

  <MemberProfileCard />
</div>

  
    </div>
  )
}