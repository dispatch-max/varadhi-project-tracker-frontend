import { UsersList } from '@/components/users/users-list'

export const metadata = {
  title: 'Users',
}

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">
          Team Members
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage your team — roles, permissions and invites.
        </p>
      </div>
      <UsersList />
    </div>
  )
}