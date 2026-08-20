'use client'

import { useEffect, useMemo, useState } from 'react'

import {
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Filter,
  Info,
  Plus,
  Search,
  Users,
  X,
  XCircle,
  Clock3,
  MessageSquare,
} from 'lucide-react'

import { leaveManagementApi } from '@/lib/api/leave-management.api'
import { useAuthStore } from '@/store/auth.store'

// The `type` values the backend stores in leave_requests.type. The column is
// VARCHAR(30) with no CHECK constraint, but these are the values the list and
// the "By Leave Type" report already group on, so the form has to emit the
// same vocabulary rather than inventing new labels.
const LEAVE_TYPES = [
  { value: 'casual', label: 'Casual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'earned', label: 'Earned Leave' },
  { value: 'annual', label: 'Annual Leave' },
  { value: 'unpaid', label: 'Unpaid Leave' },
]

// Wire values the backend accepts for dayType, paired with their labels.
const DAY_TYPES = [
  { value: 'full_day', label: 'Full Day' },
  { value: 'half_day', label: 'Half Day' },
]

// Rows come back with the wire value; the table and detail panel show the
// label. Anything unrecognised (including a legacy row saved before dayType
// existed) falls back to Full Day.
const formatDayType = (value) =>
  DAY_TYPES.find((option) => option.value === value)?.label || 'Full Day'

const formatDate = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const normalizeStatus = (status) => {
  if (!status) return 'Pending'
  const normalized = status.toString().toLowerCase()
  if (normalized === 'approved') return 'Approved'
  if (normalized === 'rejected') return 'Rejected'
  return 'Pending'
}

const mapLeaveRequest = (row) => ({
  id: row.id,
  employee: row.userName || 'Unknown',
  role: row.role || 'Team Member',
  leaveType: row.type ? row.type.replace(/_/g, ' ') : 'Leave',
  fromDate: formatDate(row.startDate),
  toDate: formatDate(row.endDate),
  days: row.days || 1,
  dayType: formatDayType(row.dayType),
  reason: row.reason || 'No reason provided',
  appliedOn: row.createdAt
    ? new Date(row.createdAt).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : '',
  status: normalizeStatus(row.status),
  managerRemarks: row.managerRemarks || null,
})

export default function ManagerLeavePage() {
  /* =====================================================
     LEAVE REQUEST DATA
  ===================================================== */

  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)

  /* =====================================================
     STATES
  ===================================================== */

  const [selectedIds, setSelectedIds] = useState([])

  const [selectedRequest, setSelectedRequest] = useState(null)

  const [showRejectModal, setShowRejectModal] = useState(false)

  const [showInfoModal, setShowInfoModal] = useState(false)

  const [showReports, setShowReports] = useState(false)

  // Apply Leave form. `dayType` holds the backend's own wire values
  // ('full_day' / 'half_day') rather than display labels, so the payload needs
  // no translation at submit time.
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applyForm, setApplyForm] = useState({
    leaveType: 'casual',
    fromDate: '',
    toDate: '',
    dayType: 'full_day',
    reason: '',
  })
  const [applyErrors, setApplyErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { user } = useAuthStore()

  const [rejectReason, setRejectReason] = useState('')

  const [infoMessage, setInfoMessage] = useState('')

  const [search, setSearch] = useState('')

  const [filterStatus, setFilterStatus] = useState('All')

  useEffect(() => {
    loadRequests()
  }, [])

  async function loadRequests() {
    try {
      setLoading(true)
      const data = await leaveManagementApi.getAll()
      const rows = Array.isArray(data) ? data : []
      setRequests(rows.map(mapLeaveRequest))
    } catch (error) {
      console.error('Failed to load leave requests:', error)
    } finally {
      setLoading(false)
    }
  }

  function openApplyModal() {
    setApplyForm({
      leaveType: 'casual',
      fromDate: '',
      toDate: '',
      dayType: 'full_day',
      reason: '',
    })
    setApplyErrors({})
    setShowApplyModal(true)
  }

  function closeApplyModal() {
    if (isSubmitting) return
    setShowApplyModal(false)
    setApplyErrors({})
  }

  function updateApplyField(field, value) {
    setApplyForm((previous) => {
      const next = { ...previous, [field]: value }

      // Half day is a single date, so keep the two dates locked together
      // rather than making the user discover the rule through a validation
      // error: selecting Half Day collapses the range onto the from date,
      // and editing either date afterwards carries the other along.
      const goingHalfDay = field === 'dayType' && value === 'half_day'
      const editingDateWhileHalfDay =
        next.dayType === 'half_day' && (field === 'fromDate' || field === 'toDate')

      if (goingHalfDay && next.fromDate) {
        next.toDate = next.fromDate
      } else if (editingDateWhileHalfDay) {
        if (field === 'fromDate') next.toDate = value
        else next.fromDate = value
      }

      return next
    })

    setApplyErrors((previous) => ({
      ...previous,
      [field]: '',
      // The half-day mismatch is reported on dayType but can be resolved by
      // changing either date, so clear it whenever any of the three moves.
      dayType: '',
    }))
  }

  // Mirrors the server's own rules so the common mistakes are caught before
  // the round trip. The server still validates independently — this is a
  // convenience gate, not the authority.
  function validateApplyForm() {
    const errors = {}

    if (!applyForm.leaveType) errors.leaveType = 'Leave type is required.'
    if (!applyForm.fromDate) errors.fromDate = 'From date is required.'
    if (!applyForm.toDate) errors.toDate = 'To date is required.'
    if (!applyForm.reason.trim()) errors.reason = 'Reason is required.'

    if (applyForm.fromDate && applyForm.toDate) {
      const from = new Date(applyForm.fromDate)
      const to = new Date(applyForm.toDate)
      const datesValid =
        !Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime())

      if (datesValid && to < from) {
        errors.toDate = 'To date cannot be earlier than the from date.'
      } else if (
        datesValid &&
        applyForm.dayType === 'half_day' &&
        applyForm.fromDate !== applyForm.toDate
      ) {
        // Backend rejects a half day spanning a range; say so here rather
        // than letting it come back as a generic 400.
        errors.dayType =
          'Half Day applies to a single date — set From and To to the same day, or choose Full Day.'
      }
    }

    setApplyErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function submitLeaveRequest(event) {
    event.preventDefault()
    if (!validateApplyForm()) return

    setIsSubmitting(true)
    try {
      // Exactly the five fields the backend accepts. No employee name, user
      // id, status or days: the requester comes from the JWT and `days` is
      // computed server-side.
      await leaveManagementApi.create({
        startDate: applyForm.fromDate,
        endDate: applyForm.toDate,
        type: applyForm.leaveType,
        reason: applyForm.reason.trim(),
        dayType: applyForm.dayType,
      })

      // Close first so the list isn't re-rendering behind an open dialog,
      // then refetch: a full reload keeps the table, the status tabs and
      // every derived count (Team On Leave, monthly summary, type summary)
      // consistent with what the server actually stored.
      setShowApplyModal(false)
      await loadRequests()
    } catch (error) {
      console.error('Failed to create leave request:', error)
      setApplyErrors({
        submit:
          error?.response?.data?.message ||
          'Could not submit the leave request. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateRequestStatus = async (id, status) => {
    try {
      const updated = await leaveManagementApi.updateStatus(id, status.toLowerCase())
      setRequests((previous) =>
        previous.map((request) =>
          request.id === id
            ? {
                ...request,
                status: normalizeStatus(updated.status || status),
              }
            : request
        )
      )
      setSelectedIds((previous) => previous.filter((item) => item !== id))
      return updated
    } catch (error) {
      console.error(`Failed to update leave status for ${id}:`, error)
      throw error
    }
  }

  const approveLeave = async (id) => {
    try {
      await updateRequestStatus(id, 'Approved')
      setSelectedRequest(null)
    } catch (error) {
      alert('Unable to approve leave request. Please try again.')
    }
  }

  const bulkApprove = async () => {
    if (selectedIds.length === 0) {
      alert('Please select at least one pending request.')
      return
    }

    try {
      await Promise.all(selectedIds.map((id) => updateRequestStatus(id, 'Approved')))
      setSelectedIds([])
    } catch (error) {
      alert('Unable to approve selected requests. Please try again.')
    }
  }

  // Opens the reject dialog for one request. The detail panel is keyed off
  // `selectedRequest && !showRejectModal && !showInfoModal`, so setting both
  // together swaps the detail view for the dialog rather than stacking them.
  const openRejectModal = (request) => {
    if (!request) return
    setSelectedRequest(request)
    setRejectReason('')
    setShowInfoModal(false)
    setShowRejectModal(true)
  }

  // Same contract as openRejectModal, for the "need more information" dialog.
  const openInformationModal = (request) => {
    if (!request) return
    setSelectedRequest(request)
    setInfoMessage('')
    setShowRejectModal(false)
    setShowInfoModal(true)
  }

  const rejectLeave = async () => {
    if (!rejectReason.trim()) {
      alert('Please enter a rejection reason.')
      return
    }

    if (!selectedRequest) return

    try {
      await updateRequestStatus(selectedRequest.id, 'Rejected')
      setShowRejectModal(false)
      setSelectedRequest(null)
      setRejectReason('')
    } catch (error) {
      alert('Unable to reject leave request. Please try again.')
    }
  }

  /* =====================================================
     COUNTS
  ===================================================== */

  const pendingRequests = requests.filter(
    (request) => request.status === 'Pending'
  )

  const approvedRequests = requests.filter(
    (request) => request.status === 'Approved'
  )

  const rejectedRequests = requests.filter(
    (request) => request.status === 'Rejected'
  )

  // Approved leave whose date range covers today. Replaces a hardcoded "3".
  const onLeaveToday = requests.filter((request) => {
    if (request.status !== 'Approved') return false
    const from = parseDate(request.fromDate)
    const to = parseDate(request.toDate)
    if (!from || !to) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    from.setHours(0, 0, 0, 0)
    to.setHours(0, 0, 0, 0)
    return from <= today && today <= to
  })

  // Current-month rollup for the reports modal.
  const monthlySummary = (() => {
    const now = new Date()
    const inMonth = requests.filter((request) => {
      const from = parseDate(request.fromDate)
      return (
        from &&
        from.getMonth() === now.getMonth() &&
        from.getFullYear() === now.getFullYear()
      )
    })
    return {
      total: inMonth.length,
      approved: inMonth.filter((r) => r.status === 'Approved').length,
      pending: inMonth.filter((r) => r.status === 'Pending').length,
      days: inMonth.reduce((sum, r) => sum + (Number(r.days) || 0), 0),
    }
  })()

  // Counts per leave type — the closest real grouping to the old
  // "department" report, since the schema has no department entity.
  const typeSummary = Object.entries(
    requests.reduce((acc, request) => {
      const key = request.leaveType || 'Unspecified'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
  )
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)

  // Client-side CSV of what the user is already looking at. No export
  // endpoint exists, and building one is out of scope for stabilization.
  function exportLeaveCsv() {
    if (requests.length === 0) return
    const header = ['Employee', 'Leave Type', 'From', 'To', 'Day Type', 'Days', 'Status', 'Reason']
    const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const rows = requests.map((r) =>
      [r.employee, r.leaveType, r.fromDate, r.toDate, r.dayType, r.days, r.status, r.reason]
        .map(escape)
        .join(',')
    )
    const blob = new Blob([[header.map(escape).join(','), ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `leave-requests-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  /* =====================================================
     SEARCH + FILTER
  ===================================================== */

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.employee
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      request.leaveType
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      request.reason
        .toLowerCase()
        .includes(search.toLowerCase())

    const matchesStatus =
      filterStatus === 'All' ||
      request.status === filterStatus

    return matchesSearch && matchesStatus
  })

  /* =====================================================
     SELECT REQUEST
  ===================================================== */

  const toggleSelect = (id) => {
    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    )
  }

  /* =====================================================
     SELECT ALL
  ===================================================== */

  const selectAllPending = () => {
    const pendingIds = pendingRequests.map(
      (request) => request.id
    )

    if (
      pendingIds.length > 0 &&
      selectedIds.length === pendingIds.length
    ) {
      setSelectedIds([])
    } else {
      setSelectedIds(pendingIds)
    }
  }

  const statusStyle = (status) => {
    switch (status) {
      case 'Approved':
        return 'border-green-200 bg-green-50 text-green-700'
      case 'Rejected':
        return 'border-red-200 bg-red-50 text-red-700'
      case 'Pending':
        return 'border-yellow-200 bg-yellow-50 text-yellow-700'
      default:
        return 'border-slate-200 bg-slate-50 text-slate-600'
    }
  }

  const requestInformation = () => {
    if (!infoMessage.trim()) {
      alert('Please enter the information you need.')
      return
    }

    // There is no "request information" endpoint, and no message is
    // delivered anywhere. Rather than claiming the request was sent, keep the
    // note with the request by leaving it Pending and telling the approver
    // the truth. Wire this to a real endpoint when one exists.
    alert(
      'Messaging is not available yet, so this note was not sent. ' +
      'The request has been left pending — contact the employee directly.'
    )
    setShowInfoModal(false)
    setSelectedRequest(null)
    setInfoMessage('')
  }

  const conflicts = useMemo(() => {
    const pending = requests.filter((request) => request.status === 'Pending')
    const result = []

    for (let i = 0; i < pending.length; i += 1) {
      for (let j = i + 1; j < pending.length; j += 1) {
        const first = pending[i]
        const second = pending[j]
        const firstStart = parseDate(first.fromDate)
        const firstEnd = parseDate(first.toDate)
        const secondStart = parseDate(second.fromDate)
        const secondEnd = parseDate(second.toDate)

        if (firstStart <= secondEnd && secondStart <= firstEnd) {
          result.push({
            first: first.employee,
            second: second.employee,
            firstDate: first.fromDate,
            secondDate: second.fromDate,
          })
        }
      }
    }

    return result
  }, [requests])

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="h-full w-full overflow-hidden bg-[#f7f8fc] text-slate-800">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="flex h-[64px] shrink-0 items-center border-b bg-white px-5">

        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Leave Management
          </h1>

          <p className="text-xs text-slate-500">
            Review and manage leave requests from your team
          </p>
        </div>

      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="h-[calc(100vh-64px)] overflow-y-auto overflow-x-hidden p-4 lg:p-5">

        {/* =================================================
            TITLE
        ================================================= */}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Team Leave Requests
            </h2>

            <p className="text-xs text-slate-500">
              Review, approve or reject employee leave requests
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">

            <button
              onClick={() => setShowReports(true)}
              className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-medium shadow-sm transition hover:bg-slate-50"
            >
              <Download size={17} />

              Leave Reports
            </button>

            {/* Anyone signed in can apply for their own leave — the backend
                takes user_id from the token, so this is not a privileged
                action. Approve/reject stay manager-gated as before. */}
            <button
              onClick={openApplyModal}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              <Plus size={17} />

              Apply Leave
            </button>

          </div>

        </div>

        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">

          <StatCard
            title="Pending Requests"
            value={pendingRequests.length}
            subtitle="Requires action"
            icon={<Clock3 size={20} />}
            bg="bg-yellow-50"
            color="text-yellow-600"
          />

          <StatCard
            title="Approved"
            value={approvedRequests.length}
            subtitle="This month"
            icon={<CheckCircle2 size={20} />}
            bg="bg-green-50"
            color="text-green-600"
          />

          <StatCard
            title="Rejected"
            value={rejectedRequests.length}
            subtitle="This month"
            icon={<XCircle size={20} />}
            bg="bg-red-50"
            color="text-red-600"
          />

          <StatCard
            title="Team On Leave"
            value={onLeaveToday.length}
            subtitle="Today"
            icon={<Users size={20} />}
            bg="bg-blue-50"
            color="text-blue-600"
          />

          <StatCard
            title="Conflicts"
            value={conflicts.length}
            subtitle="Detected"
            icon={<AlertTriangle size={20} />}
            bg="bg-orange-50"
            color="text-orange-600"
          />

        </div>

        {/* =================================================
            CONFLICT ALERT
        ================================================= */}

        {conflicts.length > 0 && (
          <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4">

            <div className="flex items-start gap-3">

              <div className="rounded-lg bg-orange-100 p-2 text-orange-600">
                <AlertTriangle size={18} />
              </div>

              <div className="flex-1">

                <p className="text-sm font-semibold text-orange-800">
                  Leave Conflict Detected
                </p>

                {conflicts.map((conflict, index) => (
                  <p
                    key={index}
                    className="mt-1 text-xs text-orange-700"
                  >
                    <strong>{conflict.first}</strong> and{' '}
                    <strong>{conflict.second}</strong> have
                    overlapping leave dates.
                  </p>
                ))}

              </div>

            </div>

          </div>
        )}

        {/* =================================================
            LEAVE REQUEST TABLE
        ================================================= */}

        <div className="mt-4 overflow-hidden rounded-xl border bg-white shadow-sm">

          {/* TABLE HEADER */}

          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">

            <div>

              <h3 className="font-semibold text-slate-900">
                Leave Requests
              </h3>

              <p className="text-xs text-slate-500">
                {pendingRequests.length} requests waiting for approval
              </p>

            </div>

            <div className="flex flex-wrap gap-2">

              {/* SEARCH */}

              <div className="relative">

                <Search
                  size={16}
                  className="absolute left-3 top-3 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search employee..."
                  className="w-[210px] rounded-xl border py-2 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-500"
                />

              </div>

              {/* FILTER */}

              <div className="relative">

                <Filter
                  size={15}
                  className="pointer-events-none absolute left-3 top-3 text-slate-400"
                />

                <select
                  value={filterStatus}
                  onChange={(event) =>
                    setFilterStatus(event.target.value)
                  }
                  className="appearance-none rounded-xl border bg-white py-2 pl-9 pr-8 text-sm outline-none"
                >
                  <option value="All">
                    All Status
                  </option>

                  <option value="Pending">
                    Pending
                  </option>

                  <option value="Approved">
                    Approved
                  </option>

                  <option value="Rejected">
                    Rejected
                  </option>
                </select>

              </div>

            </div>

          </div>

          {/* =================================================
              BULK ACTION
          ================================================= */}

          <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50 px-4 py-3">

            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">

              <input
                type="checkbox"
                checked={
                  pendingRequests.length > 0 &&
                  selectedIds.length === pendingRequests.length
                }
                onChange={selectAllPending}
                className="h-4 w-4 accent-indigo-600"
              />

              Select all pending

            </label>

            {selectedIds.length > 0 && (

              <button
                onClick={bulkApprove}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700"
              >
                <Check size={15} />

                Approve Selected ({selectedIds.length})
              </button>

            )}

          </div>

          {/* =================================================
              TABLE
          ================================================= */}

          <div className="max-h-[480px] overflow-auto">

            <table className="w-full min-w-[1100px]">

              <thead className="sticky top-0 z-10 bg-slate-50">

                <tr className="border-b text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">

                  <th className="w-10 px-4 py-3">
                    #
                  </th>

                  <th className="px-4 py-3">
                    Employee
                  </th>

                  <th className="px-4 py-3">
                    Leave Type
                  </th>

                  <th className="px-4 py-3">
                    Leave Dates
                  </th>

                  <th className="px-4 py-3">
                    Days
                  </th>

                  <th className="px-4 py-3">
                    Day Type
                  </th>

                  <th className="px-4 py-3">
                    Reason
                  </th>

                  <th className="px-4 py-3">
                    Status
                  </th>

                  <th className="px-4 py-3">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredRequests.length === 0 ? (

                  <tr>

                    <td
                      colSpan="9"
                      className="px-4 py-12 text-center"
                    >

                      <div className="flex flex-col items-center">

                        <FileText
                          size={35}
                          className="text-slate-300"
                        />

                        <p className="mt-3 text-sm font-medium">
                          No leave requests found
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Try changing your search or filter.
                        </p>

                      </div>

                    </td>

                  </tr>

                ) : (

                  filteredRequests.map((request) => (

                    <tr
                      key={request.id}
                      className="border-b transition hover:bg-slate-50"
                    >

                      {/* CHECKBOX */}

                      <td className="px-4 py-3">

                        {request.status === 'Pending' ? (

                          <input
                            type="checkbox"
                            checked={selectedIds.includes(
                              request.id
                            )}
                            onChange={() =>
                              toggleSelect(request.id)
                            }
                            className="h-4 w-4 accent-indigo-600"
                          />

                        ) : (

                          <span className="text-xs text-slate-300">
                            —
                          </span>

                        )}

                      </td>

                      {/* EMPLOYEE */}

                      <td className="px-4 py-3">

                        <div className="flex items-center gap-3">

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                            {getInitials(request.employee)}
                          </div>

                          <div>

                            <p className="text-sm font-semibold text-slate-800">
                              {request.employee}
                            </p>

                            <p className="text-[11px] text-slate-400">
                              {request.role}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* LEAVE TYPE */}

                      <td className="px-4 py-3">

                        <span className="rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700">
                          {request.leaveType}
                        </span>

                      </td>

                      {/* DATES */}

                      <td className="px-4 py-3 text-xs">

                        <p className="font-medium">
                          {request.fromDate}
                        </p>

                        {request.fromDate !==
                          request.toDate && (
                          <p className="text-slate-400">
                            to {request.toDate}
                          </p>
                        )}

                      </td>

                      {/* DAYS */}

                      <td className="px-4 py-3 text-sm font-semibold">
                        {request.days}
                      </td>

                      {/* DAY TYPE */}

                      <td className="px-4 py-3 text-xs text-slate-500">
                        {request.dayType}
                      </td>

                      {/* REASON */}

                      <td className="max-w-[180px] px-4 py-3 text-xs text-slate-500">
                        <p className="truncate">
                          {request.reason}
                        </p>
                      </td>

                      {/* STATUS */}

                      <td className="px-4 py-3">

                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusStyle(
                            request.status
                          )}`}
                        >

                          {request.status === 'Approved' && (
                            <Check size={13} />
                          )}

                          {request.status === 'Rejected' && (
                            <X size={13} />
                          )}

                          {request.status === 'Pending' && (
                            <Clock3 size={13} />
                          )}

                          {request.status}

                        </span>

                      </td>

                      {/* ACTIONS */}

                      <td className="px-4 py-3">

                        <div className="flex items-center gap-1.5">

                          {/* VIEW */}

                          <button
                            onClick={() =>
                              setSelectedRequest(request)
                            }
                            title="View Leave"
                            className="rounded-lg border p-2 text-slate-600 transition hover:bg-slate-100"
                          >
                            <Eye size={15} />
                          </button>

                          {/* APPROVE */}

                          {request.status === 'Pending' && (

                            <button
                              onClick={() =>
                                approveLeave(request.id)
                              }
                              title="Approve Leave"
                              className="rounded-lg border border-green-200 p-2 text-green-600 transition hover:bg-green-50"
                            >
                              <Check size={15} />
                            </button>

                          )}

                          {/* REJECT */}

                          {request.status === 'Pending' && (

                            <button
                              onClick={() =>
                                openRejectModal(request)
                              }
                              title="Reject Leave"
                              className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50"
                            >
                              <X size={15} />
                            </button>

                          )}

                          {/* MORE INFORMATION */}

                          {request.status === 'Pending' && (

                            <button
                              onClick={() =>
                                openInformationModal(request)
                              }
                              title="Need More Information"
                              className="rounded-lg border border-blue-200 p-2 text-blue-600 transition hover:bg-blue-50"
                            >
                              <Info size={15} />
                            </button>

                          )}

                        </div>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </div>

      </main>

      {/* =================================================
          VIEW REQUEST MODAL
      ================================================= */}

      {selectedRequest &&
        !showRejectModal &&
        !showInfoModal && (

          <Modal
            title="Leave Request Details"
            onClose={() =>
              setSelectedRequest(null)
            }
          >

            <div className="space-y-4">

              {/* EMPLOYEE */}

              <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
                  {getInitials(
                    selectedRequest.employee
                  )}
                </div>

                <div>

                  <p className="font-semibold">
                    {selectedRequest.employee}
                  </p>

                  <p className="text-xs text-slate-500">
                    {selectedRequest.role}
                  </p>

                </div>

              </div>

              {/* DETAILS */}

              <div className="grid grid-cols-2 gap-3">

                <Detail
                  label="Leave Type"
                  value={selectedRequest.leaveType}
                />

                <Detail
                  label="Day Type"
                  value={selectedRequest.dayType}
                />

                <Detail
                  label="From Date"
                  value={selectedRequest.fromDate}
                />

                <Detail
                  label="To Date"
                  value={selectedRequest.toDate}
                />

                <Detail
                  label="Number of Days"
                  value={`${selectedRequest.days} Days`}
                />

                <Detail
                  label="Status"
                  value={selectedRequest.status}
                />

              </div>

              <Detail
                label="Reason"
                value={selectedRequest.reason}
              />

              <Detail
                label="Applied On"
                value={selectedRequest.appliedOn}
              />

              {selectedRequest.managerRemarks && (

                <Detail
                  label="Manager Remarks"
                  value={selectedRequest.managerRemarks}
                />

              )}

              {/* ACTIONS */}

              {selectedRequest.status === 'Pending' && (

                <div className="flex gap-2 pt-2">

                  <button
                    onClick={() =>
                      approveLeave(
                        selectedRequest.id
                      )
                    }
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                  >
                    <Check size={17} />
                    Approve
                  </button>

                  <button
                    onClick={() =>
                      openRejectModal(
                        selectedRequest
                      )
                    }
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    <X size={17} />
                    Reject
                  </button>

                </div>

              )}

            </div>

          </Modal>

        )}

      {/* =================================================
          REJECT MODAL
      ================================================= */}

      {showRejectModal &&
        selectedRequest && (

          <Modal
            title="Reject Leave"
            onClose={() => {
              setShowRejectModal(false)
              setSelectedRequest(null)
            }}
          >

            <div className="space-y-5">

              <div className="rounded-xl bg-red-50 p-4">

                <div className="flex gap-3">

                  <XCircle
                    size={20}
                    className="text-red-600"
                  />

                  <div>

                    <p className="text-sm font-semibold text-red-800">
                      Reject leave request
                    </p>

                    <p className="mt-1 text-xs text-red-600">
                      Employee: {selectedRequest.employee}
                    </p>

                  </div>

                </div>

              </div>

              <div>

                <label className="mb-2 block text-sm font-medium">
                  Rejection Reason *
                </label>

                <textarea
                  rows={4}
                  value={rejectReason}
                  onChange={(event) =>
                    setRejectReason(
                      event.target.value
                    )
                  }
                  placeholder="Enter reason for rejection..."
                  className="w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                />

              </div>

              <div className="flex justify-end gap-3">

                <button
                  onClick={() => {
                    setShowRejectModal(false)
                    setSelectedRequest(null)
                  }}
                  className="rounded-xl border px-5 py-2.5 text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  onClick={rejectLeave}
                  className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  Reject Leave
                </button>

              </div>

            </div>

          </Modal>

        )}

      {/* =================================================
          MORE INFORMATION MODAL
      ================================================= */}

      {showInfoModal &&
        selectedRequest && (

          <Modal
            title="Need More Information"
            onClose={() => {
              setShowInfoModal(false)
              setSelectedRequest(null)
            }}
          >

            <div className="space-y-5">

              <div className="rounded-xl bg-blue-50 p-4">

                <div className="flex gap-3">

                  <MessageSquare
                    size={20}
                    className="text-blue-600"
                  />

                  <div>

                    <p className="text-sm font-semibold text-blue-800">
                      Request additional information
                    </p>

                    <p className="mt-1 text-xs text-blue-600">
                      Employee: {selectedRequest.employee}
                    </p>

                  </div>

                </div>

              </div>

              <div>

                <label className="mb-2 block text-sm font-medium">
                  Information Required *
                </label>

                <textarea
                  rows={4}
                  value={infoMessage}
                  onChange={(event) =>
                    setInfoMessage(
                      event.target.value
                    )
                  }
                  placeholder="Example: Please provide the medical certificate..."
                  className="w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

              <div className="flex justify-end gap-3">

                <button
                  onClick={() => {
                    setShowInfoModal(false)
                    setSelectedRequest(null)
                  }}
                  className="rounded-xl border px-5 py-2.5 text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  onClick={requestInformation}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Send Request
                </button>

              </div>

            </div>

          </Modal>

        )}

      {/* =================================================
          APPLY LEAVE MODAL
      ================================================= */}

      {showApplyModal && (

        <Modal
          title="Apply Leave"
          onClose={closeApplyModal}
        >

          <form onSubmit={submitLeaveRequest} className="space-y-5">

            {/* Employee — read-only. The backend derives user_id from the
                auth token, so this is shown for confirmation and never sent. */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Employee Name
              </label>
              <input
                type="text"
                value={user?.name || 'Current user'}
                readOnly
                disabled
                className="w-full cursor-not-allowed rounded-xl border bg-slate-50 px-4 py-2.5 text-sm text-slate-500"
              />
              <p className="mt-1 text-xs text-slate-400">
                Leave is always applied for the signed-in user.
              </p>
            </div>

            {/* Leave Type */}
            <div>
              <label
                htmlFor="leaveType"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Leave Type
              </label>
              <select
                id="leaveType"
                value={applyForm.leaveType}
                onChange={(event) => updateApplyField('leaveType', event.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                {LEAVE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              <div>
                <label
                  htmlFor="fromDate"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  From Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="fromDate"
                  type="date"
                  value={applyForm.fromDate}
                  onChange={(event) => updateApplyField('fromDate', event.target.value)}
                  disabled={isSubmitting}
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                    applyErrors.fromDate
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                      : 'focus:border-indigo-500 focus:ring-indigo-100'
                  }`}
                />
                {applyErrors.fromDate && (
                  <p className="mt-1 text-xs text-red-600">{applyErrors.fromDate}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="toDate"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  To Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="toDate"
                  type="date"
                  value={applyForm.toDate}
                  min={applyForm.fromDate || undefined}
                  onChange={(event) => updateApplyField('toDate', event.target.value)}
                  disabled={isSubmitting}
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
                    applyErrors.toDate
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                      : 'focus:border-indigo-500 focus:ring-indigo-100'
                  }`}
                />
                {applyErrors.toDate && (
                  <p className="mt-1 text-xs text-red-600">{applyErrors.toDate}</p>
                )}
              </div>

            </div>

            {/* Day Type */}
            <div>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Day Type
              </span>
              <div className="flex gap-3">
                {DAY_TYPES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateApplyField('dayType', option.value)}
                    disabled={isSubmitting}
                    className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                      applyForm.dayType === option.value
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {applyErrors.dayType && (
                <p className="mt-1 text-xs text-red-600">{applyErrors.dayType}</p>
              )}
              {applyForm.dayType === 'half_day' && (
                <p className="mt-1 text-xs text-slate-400">
                  Half Day applies to a single date.
                </p>
              )}
            </div>

            {/* Reason */}
            <div>
              <label
                htmlFor="reason"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reason"
                rows={4}
                value={applyForm.reason}
                onChange={(event) => updateApplyField('reason', event.target.value)}
                disabled={isSubmitting}
                placeholder="Enter the reason for your leave..."
                className={`w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 ${
                  applyErrors.reason
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                    : 'focus:border-indigo-500 focus:ring-indigo-100'
                }`}
              />
              {applyErrors.reason && (
                <p className="mt-1 text-xs text-red-600">{applyErrors.reason}</p>
              )}
            </div>

            {applyErrors.submit && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {applyErrors.submit}
              </div>
            )}

            <div className="flex justify-end gap-3">

              <button
                type="button"
                onClick={closeApplyModal}
                disabled={isSubmitting}
                className="rounded-xl border px-5 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {isSubmitting ? 'Applying...' : 'Apply Leave'}
              </button>

            </div>

          </form>

        </Modal>

      )}

      {/* =================================================
          LEAVE REPORTS MODAL
      ================================================= */}

      {showReports && (

        <Modal
          title="Leave Reports"
          onClose={() => setShowReports(false)}
        >

          <div className="space-y-3">

            {/* Summaries computed from the requests already loaded from the
                API. There is no reporting endpoint and no department entity in
                the schema, so these aggregate what genuinely exists rather
                than promising reports the backend cannot produce. */}
            <ReportCard
              title="This Month"
              description={`${monthlySummary.total} request(s) · ${monthlySummary.approved} approved · ${monthlySummary.pending} pending · ${monthlySummary.days} day(s)`}
              icon={<CalendarDays size={20} />}
              onClick={() => setFilterStatus('All')}
            />

            <ReportCard
              title="By Leave Type"
              description={
                typeSummary.length > 0
                  ? typeSummary.map((t) => `${t.type}: ${t.count}`).join(' · ')
                  : 'No leave requests yet.'
              }
              icon={<Users size={20} />}
            />

            <ReportCard
              title="Export Leave Data (CSV)"
              description="Download every leave request currently listed."
              icon={<FileText size={20} />}
              onClick={exportLeaveCsv}
            />

          </div>

        </Modal>

      )}

    </div>
  )
}

/* =====================================================
   STAT CARD
===================================================== */

function StatCard({
  title,
  value,
  subtitle,
  icon,
  bg,
  color,
}) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">

      <div className="flex items-center justify-between gap-3">

        <div>

          <p className="text-xs text-slate-500">
            {title}
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            {subtitle}
          </p>

        </div>

        <div
          className={`rounded-xl p-3 ${bg} ${color}`}
        >
          {icon}
        </div>

      </div>

    </div>
  )
}

/* =====================================================
   MODAL
===================================================== */

function Modal({
  title,
  children,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4">

      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">

        <div className="flex items-center justify-between border-b px-6 py-4">

          <h2 className="font-bold text-slate-900">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={19} />
          </button>

        </div>

        <div className="p-6">
          {children}
        </div>

      </div>

    </div>
  )
}

/* =====================================================
   DETAIL
===================================================== */

function Detail({
  label,
  value,
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">

      <p className="text-[11px] text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-slate-800">
        {value}
      </p>

    </div>
  )
}

/* =====================================================
   REPORT CARD
===================================================== */

function ReportCard({
  title,
  description,
  icon,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      disabled={!onClick}
      className="flex w-full items-center gap-4 rounded-xl border p-4 text-left transition hover:bg-slate-50 disabled:cursor-default disabled:hover:bg-transparent"
    >

      <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
        {icon}
      </div>

      <div className="flex-1">

        <p className="text-sm font-semibold text-slate-800">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>

      </div>

      <Download
        size={17}
        className="text-slate-400"
      />

    </button>
  )
}

/* =====================================================
   INITIALS
===================================================== */

function getInitials(name) {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/* =====================================================
   DATE PARSER
===================================================== */

function parseDate(dateString) {
  return new Date(dateString)
}