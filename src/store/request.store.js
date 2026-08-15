import { create } from 'zustand'

const initialRequests = [
  {
    id: 1,
    employee: 'Arjun Patel',
    role: 'UI/UX Designer',
    leaveType: 'Casual Leave',
    fromDate: '10 Aug 2026',
    toDate: '12 Aug 2026',
    days: 3,
    reason: 'Personal work at hometown',
    appliedOn: '08 Aug 2026, 10:30 AM',
    status: 'Pending',
  },
  {
    id: 2,
    employee: 'Neha Singh',
    role: 'Frontend Developer',
    leaveType: 'Sick Leave',
    fromDate: '11 Aug 2026',
    toDate: '11 Aug 2026',
    days: 1,
    reason: 'Fever and health checkup',
    appliedOn: '08 Aug 2026, 09:15 AM',
    status: 'Pending',
  },
  {
    id: 3,
    employee: 'Vikram Kumar',
    role: 'Backend Developer',
    leaveType: 'Earned Leave',
    fromDate: '15 Aug 2026',
    toDate: '18 Aug 2026',
    days: 4,
    reason: 'Family function',
    appliedOn: '07 Aug 2026, 04:45 PM',
    status: 'Pending',
  },
  {
    id: 4,
    employee: 'Pooja Mehta',
    role: 'QA Engineer',
    leaveType: 'Casual Leave',
    fromDate: '20 Aug 2026',
    toDate: '20 Aug 2026',
    days: 1,
    reason: 'Personal work',
    appliedOn: '07 Aug 2026, 11:20 AM',
    status: 'Approved',
  },
  {
    id: 5,
    employee: 'Sandeep Reddy',
    role: 'DevOps Engineer',
    leaveType: 'Earned Leave',
    fromDate: '22 Aug 2026',
    toDate: '26 Aug 2026',
    days: 5,
    reason: 'Vacation with family',
    appliedOn: '06 Aug 2026, 09:05 AM',
    status: 'Approved',
  },
  {
    id: 6,
    employee: 'Ananya Das',
    role: 'Business Analyst',
    leaveType: 'Sick Leave',
    fromDate: '28 Aug 2026',
    toDate: '29 Aug 2026',
    days: 2,
    reason: 'Medical appointment',
    appliedOn: '05 Aug 2026, 07:50 AM',
    status: 'Rejected',
  },
]

export const useRequestStore = create((set, get) => ({
  requests: initialRequests,

  setRequests: (requests) => set({ requests }),

  addRequest: (request) =>
    set((state) => ({ requests: [request, ...state.requests] })),

  updateRequest: (id, patch) =>
    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === id ? (typeof patch === 'function' ? patch(r) : { ...r, ...patch }) : r
      ),
    })),

  bulkUpdate: (ids, patch) =>
    set((state) => ({
      requests: state.requests.map((r) =>
        ids.includes(r.id) ? (typeof patch === 'function' ? patch(r) : { ...r, ...patch }) : r
      ),
    })),
}))

export default useRequestStore
