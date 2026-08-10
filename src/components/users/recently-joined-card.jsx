'use client'

import { Users } from 'lucide-react'

export function RecentlyJoinedCard() {
  const members = [
    {
      name: 'Aiswarya Sai',
      role: 'Frontend Developer',
      joined: '2 hours ago',
      initials: 'AS',
      color: 'bg-violet-500',
    },
    {
      name: 'Dev Kumar',
      role: 'UI/UX Designer',
      joined: '5 hours ago',
      initials: 'DK',
      color: 'bg-green-500',
    },
    {
      name: 'Nikhil Kumar',
      role: 'QA Engineer',
      joined: '1 day ago',
      initials: 'NK',
      color: 'bg-orange-500',
    },
  ]

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-violet-500" />
          <h3 className="text-sm font-semibold text-foreground">
            Recently Joined
          </h3>
        </div>

        <button className="text-xs font-medium text-violet-600 hover:text-violet-700">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {members.map((member) => (
          <div
            key={member.name}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full text-white text-xs font-semibold flex items-center justify-center ${member.color}`}
              >
                {member.initials}
              </div>

              <div>
                <p className="text-sm font-medium text-foreground">
                  {member.name}
                </p>

                <p className="text-xs text-muted-foreground">
                  {member.role}
                </p>
              </div>
            </div>

            <span className="text-xs text-slate-400">
              {member.joined}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}