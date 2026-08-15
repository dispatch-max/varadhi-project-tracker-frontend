import {
  AlertOctagon,
  AlertTriangle,
  ArrowRightLeft,
  AtSign,
  Award,
  Bell,
  Calendar,
  CalendarSync,
  CheckCircle2,
  CircleDot,
  Clock,
  Eye,
  FileText,
  Flag,
  Folder,
  FolderOpen,
  MessageSquare,
  Pencil,
  ShieldAlert,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react'

/**
 * Presentation metadata for the `type` field the notifications API already
 * returns. Purely a display concern — it does not affect what the backend
 * sends, who receives it, or any preference gating.
 *
 * Keys match NOTIFICATION_TYPES in backend/src/utils/notification-engine.js.
 *
 * `className` holds complete literal Tailwind classes on purpose: building
 * them dynamically (`bg-${colour}-50`) would get stripped by Tailwind's
 * purge and the icons would render unstyled.
 */
const TYPE_META = {
  // ── Task workflow ──────────────────────────────────────────────
  task_assigned:      { icon: UserPlus,       label: 'Assigned',   className: 'bg-violet-50 text-violet-600' },
  task_reassigned:    { icon: ArrowRightLeft, label: 'Reassigned', className: 'bg-violet-50 text-violet-600' },
  task_mention:       { icon: AtSign,         label: 'Mention',    className: 'bg-violet-50 text-violet-600' },
  task_comment:       { icon: MessageSquare,  label: 'Comment',    className: 'bg-slate-100 text-slate-600' },
  task_updated:       { icon: Pencil,         label: 'Updated',    className: 'bg-slate-100 text-slate-600' },
  task_status_changed:{ icon: CircleDot,      label: 'Status',     className: 'bg-blue-50 text-blue-600' },
  review_requested:   { icon: Eye,            label: 'Review',     className: 'bg-amber-50 text-amber-600' },
  due_date_changed:   { icon: Calendar,       label: 'Due date',   className: 'bg-blue-50 text-blue-600' },
  priority_changed:   { icon: Flag,           label: 'Priority',   className: 'bg-amber-50 text-amber-600' },

  // ── Reminders & escalation ─────────────────────────────────────
  task_reminder:      { icon: Clock,          label: 'Reminder',   className: 'bg-blue-50 text-blue-600' },
  task_due_today:     { icon: Clock,          label: 'Due today',  className: 'bg-amber-50 text-amber-600' },
  task_overdue:       { icon: AlertTriangle,  label: 'Overdue',    className: 'bg-red-50 text-red-600' },
  task_escalation:    { icon: AlertOctagon,   label: 'Escalation', className: 'bg-red-50 text-red-600' },

  // ── Approval workflow (defined in the engine, not dispatched yet) ──
  task_approved:      { icon: CheckCircle2,   label: 'Approved',   className: 'bg-emerald-50 text-emerald-600' },
  task_rejected:      { icon: XCircle,        label: 'Rejected',   className: 'bg-red-50 text-red-600' },
  task_blocked:       { icon: ShieldAlert,    label: 'Blocked',    className: 'bg-red-50 text-red-600' },

  // ── Project lifecycle ──────────────────────────────────────────
  project_assigned:        { icon: FolderOpen, label: 'Project',   className: 'bg-indigo-50 text-indigo-600' },
  project_updated:         { icon: FolderOpen, label: 'Project',   className: 'bg-indigo-50 text-indigo-600' },
  project_archived:        { icon: Folder,     label: 'Archived',  className: 'bg-slate-100 text-slate-600' },
  project_deleted:         { icon: Trash2,     label: 'Deleted',   className: 'bg-red-50 text-red-600' },
  project_member_removed:  { icon: UserMinus,  label: 'Member',    className: 'bg-slate-100 text-slate-600' },
  project_manager_changed: { icon: Users,      label: 'Manager',   className: 'bg-indigo-50 text-indigo-600' },
  project_milestone:       { icon: Award,      label: 'Milestone', className: 'bg-emerald-50 text-emerald-600' },

  // ── Documents ──────────────────────────────────────────────────
  document_uploaded:  { icon: FileText,       label: 'Document',   className: 'bg-teal-50 text-teal-600' },

  // ── User & system ──────────────────────────────────────────────
  user_invited:       { icon: UserPlus,       label: 'Invite',     className: 'bg-slate-100 text-slate-600' },
  user_removed:       { icon: UserMinus,      label: 'User',       className: 'bg-slate-100 text-slate-600' },
  user_role_changed:  { icon: Users,          label: 'Role',       className: 'bg-slate-100 text-slate-600' },
  system:                  { icon: ShieldAlert, label: 'System',   className: 'bg-slate-100 text-slate-600' },
  system_cron_failure:     { icon: ShieldAlert, label: 'System',   className: 'bg-red-50 text-red-600' },
  system_email_failure:    { icon: ShieldAlert, label: 'System',   className: 'bg-red-50 text-red-600' },
  system_push_failure:     { icon: ShieldAlert, label: 'System',   className: 'bg-red-50 text-red-600' },
  system_backup_failure:   { icon: ShieldAlert, label: 'System',   className: 'bg-red-50 text-red-600' },
  system_storage_warning:  { icon: ShieldAlert, label: 'System',   className: 'bg-amber-50 text-amber-600' },

  // ── Integrations (Modules 4 & 5) ───────────────────────────────
  // Amber rather than red: an integration that stopped is a degraded
  // convenience, not a data-loss event. The task data is untouched, so this
  // should read as "needs attention" and not sit alongside genuine failures.
  calendar_sync_failed:       { icon: CalendarSync,  label: 'Calendar', className: 'bg-amber-50 text-amber-600' },
  calendar_conflict_detected: { icon: ArrowRightLeft, label: 'Calendar', className: 'bg-amber-50 text-amber-600' },
  teams_webhook_disabled:     { icon: MessageSquare, label: 'Teams',    className: 'bg-amber-50 text-amber-600' },
}

const FALLBACK = { icon: Bell, label: 'Notification', className: 'bg-slate-100 text-slate-600' }

/** Never throws on an unknown/new type — falls back to a neutral bell. */
export function getNotificationTypeMeta(type) {
  return TYPE_META[type] || FALLBACK
}
