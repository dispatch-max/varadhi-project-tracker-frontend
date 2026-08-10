'use client'

import { useEffect, useState } from 'react'
import {
  Clock3,
  LogIn,
  LogOut,
  CalendarDays,
  Timer,
} from 'lucide-react'

import { timeManagementApi } from '@/lib/api/time-management.api'

export default function TimeManagementPage() {

  const [loading, setLoading] = useState(true)

  const [logs, setLogs] = useState([])

  const [checkIn, setCheckIn] = useState(null)

  const [checkOut, setCheckOut] = useState(null)

  const [currentTime, setCurrentTime] = useState(new Date())


  // ============================================
  // LOAD DATA
  // ============================================

  useEffect(() => {
    loadData()
  }, [])


  async function loadData() {

    try {

      setLoading(true)

      const data =
        await timeManagementApi.getAll()

      const records = data || []

      setLogs(records)

      // Find today's record
      const today =
        new Date()
          .toISOString()
          .split('T')[0]

      const todayRecord =
        records.find(
          item =>
            new Date(item.date)
              .toISOString()
              .split('T')[0] === today
        )

      if (todayRecord) {

        if (todayRecord.checkIn) {
          setCheckIn(
            new Date(todayRecord.checkIn)
          )
        }

        if (todayRecord.checkOut) {
          setCheckOut(
            new Date(todayRecord.checkOut)
          )
        }
      }

    } catch (error) {

      console.error(
        'Failed to load time data:',
        error
      )

    } finally {

      setLoading(false)

    }
  }


  // ============================================
  // LIVE CLOCK
  // ============================================

  useEffect(() => {

    const interval =
      setInterval(() => {

        setCurrentTime(
          new Date()
        )

      }, 1000)

    return () =>
      clearInterval(interval)

  }, [])


  // ============================================
  // CHECK IN
  // ============================================

  async function handleCheckIn() {

    const now =
      new Date()

    setCheckIn(now)

    /*
      Connect to backend: create a check-in record and refresh
    */
    try {
      const date = new Date().toISOString().split('T')[0]
      await timeManagementApi.checkIn({ date, checkIn: now.toISOString() })
      await loadData()
    } catch (err) {
      console.error('Check-in failed:', err)
    }
  }


  // ============================================
  // CHECK OUT
  // ============================================

  async function handleCheckOut() {

    if (!checkIn) {

      alert(
        'Please Check In first'
      )

      return
    }

    const now =
      new Date()

    setCheckOut(now)

    try {
      const date = new Date().toISOString().split('T')[0]
      await timeManagementApi.checkOut({ date, checkOut: now.toISOString() })
      await loadData()
    } catch (err) {
      console.error('Check-out failed:', err)
    }
  }


  // ============================================
  // CALCULATE TODAY HOURS
  // ============================================

  function getTodayHours() {

    if (!checkIn) {

      return 0

    }

    const start =
      new Date(checkIn)

    const end =
      checkOut
        ? new Date(checkOut)
        : currentTime

    const difference =
      end - start

    return difference /
      (1000 * 60 * 60)
  }


  // ============================================
  // TOTAL HOURS FROM DATABASE
  // ============================================

  function getTotalHours() {

    return logs.reduce(
      (total, item) => {

        return total +
          Number(item.hours || 0)

      },
      0
    )
  }


  // ============================================
  // WEEKLY HOURS
  // ============================================

  function getWeeklyHours() {

    const today =
      new Date()

    const startOfWeek =
      new Date(today)

    startOfWeek.setDate(
      today.getDate() -
      today.getDay()
    )

    startOfWeek.setHours(
      0,
      0,
      0,
      0
    )


    return logs.reduce(
      (total, item) => {

        const date =
          new Date(item.date)

        if (date >= startOfWeek) {

          return total +
            Number(item.hours || 0)

        }

        return total

      },
      0
    )
  }


  // ============================================
  // MONTHLY HOURS
  // ============================================

  function getMonthlyHours() {

    const today =
      new Date()

    return logs.reduce(
      (total, item) => {

        const date =
          new Date(item.date)

        if (
          date.getMonth() ===
            today.getMonth() &&
          date.getFullYear() ===
            today.getFullYear()
        ) {

          return total +
            Number(item.hours || 0)

        }

        return total

      },
      0
    )
  }


  // ============================================
  // FORMAT HOURS
  // ============================================

  function formatHours(hours) {

    const h =
      Math.floor(hours)

    const m =
      Math.round(
        (hours - h) * 60
      )

    return (
      `${String(h).padStart(2, '0')}:` +
      `${String(m).padStart(2, '0')}`
    )
  }


  // ============================================
  // FORMAT TIME
  // ============================================

  function formatTime(time) {

    if (!time) {

      return '--:--'

    }

    return new Date(time)
      .toLocaleTimeString(
        'en-IN',
        {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }
      )
  }


  // ============================================
  // DATE
  // ============================================

  const today =
    new Date()
      .toLocaleDateString(
        'en-IN',
        {
          day: '2-digit',
          month: 'short',
          year: '2-digit',
        }
      )


  return (

    <div className="space-y-6">


      {/* ==========================================
          HEADER
      =========================================== */}

      <div>

        <h1 className="text-2xl font-bold text-blue-700">
          Time Management
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Track your daily login, logout and working hours.
        </p>

      </div>


      {/* ==========================================
          TOTAL HOURS CARDS
      =========================================== */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">


        {/* TODAY */}

        <div className="rounded-xl border bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-slate-500">
                Total Worked Today
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-800">

                {formatHours(
                  getTodayHours()
                )}

              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Hours : Minutes
              </p>

            </div>

            <Clock3
              className="text-blue-600"
              size={30}
            />

          </div>

        </div>


        {/* WEEK */}

        <div className="rounded-xl border bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-slate-500">
                Total Weekly Time
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-800">

                {formatHours(
                  getWeeklyHours()
                )}

              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Monday - Sunday
              </p>

            </div>

            <CalendarDays
              className="text-violet-600"
              size={30}
            />

          </div>

        </div>


        {/* MONTH */}

        <div className="rounded-xl border bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-slate-500">
                Total Monthly Time
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-800">

                {formatHours(
                  getMonthlyHours()
                )}

              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Current Month
              </p>

            </div>

            <Timer
              className="text-green-600"
              size={30}
            />

          </div>

        </div>

      </div>


      {/* ==========================================
          DAILY CHECK IN / CHECK OUT
      =========================================== */}

      <div className="rounded-xl border bg-white shadow-sm">


        <div className="border-b p-5">

          <h2 className="text-xl font-semibold text-blue-700">

            Do Your Daily Check-In / Check-Out

          </h2>

        </div>


        <div className="p-5">


          <div className="grid items-center gap-5 md:grid-cols-5">


            {/* DATE */}

            <div>

              <div className="flex items-center gap-2">

                <CalendarDays
                  size={22}
                  className="text-blue-600"
                />

                <span className="font-bold">
                  {today}
                </span>

              </div>

              <p className="mt-1 text-sm text-slate-500">
                SHIFT START DATE
              </p>

            </div>


            {/* LOGIN */}

            <div className="text-center">

              <button

                onClick={
                  handleCheckIn
                }

                disabled={
                  !!checkIn
                }

                className="flex w-full items-center
                           justify-center gap-2
                           rounded-full border
                           px-5 py-3
                           font-medium
                           hover:bg-blue-600
                           hover:text-white
                           disabled:bg-slate-100
                           disabled:text-slate-400"
              >

                <LogIn size={18} />

                CHECK IN

              </button>

              <p className="mt-2 text-sm text-slate-500">

                Login Time

              </p>

              <p className="font-bold text-slate-800">

                {formatTime(checkIn)}

              </p>

            </div>


            {/* LOGOUT */}

            <div className="text-center">

              <button

                onClick={
                  handleCheckOut
                }

                disabled={
                  !checkIn ||
                  !!checkOut
                }

                className="flex w-full items-center
                           justify-center gap-2
                           rounded-full border
                           px-5 py-3
                           font-medium
                           hover:bg-blue-600
                           hover:text-white
                           disabled:bg-slate-100
                           disabled:text-slate-400"
              >

                <LogOut size={18} />

                CHECK OUT

              </button>

              <p className="mt-2 text-sm text-slate-500">

                Logout Time

              </p>

              <p className="font-bold text-slate-800">

                {formatTime(checkOut)}

              </p>

            </div>


            {/* WORK HOURS */}

            <div className="text-center">

              <p className="text-3xl font-bold text-slate-800">

                {formatHours(
                  getTodayHours()
                )}

              </p>

              <p className="text-sm text-slate-500">
                TOTAL WORK HOURS
              </p>

            </div>


            {/* STATUS */}

            <div className="text-center">

              {!checkIn && (

                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
                  Not Checked In
                </span>

              )}

              {checkIn && !checkOut && (

                <span className="rounded-full bg-green-100 px-4 py-2 text-sm text-green-700">
                  Working
                </span>

              )}

              {checkIn && checkOut && (

                <span className="rounded-full bg-blue-100 px-4 py-2 text-sm text-blue-700">
                  Completed
                </span>

              )}

            </div>

          </div>

        </div>

      </div>


      {/* ==========================================
          HISTORY
      =========================================== */}

      <div className="rounded-xl border bg-white shadow-sm">


        <div className="border-b p-5">

          <h2 className="text-xl font-semibold text-blue-700">

            View Past Submissions

          </h2>

        </div>


        {loading ? (

          <div className="p-6 text-center text-slate-500">
            Loading...
          </div>

        ) : logs.length === 0 ? (

          <div className="p-6 text-center text-slate-500">
            No records found.
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-slate-100">

                <tr>

                  <th className="px-5 py-4 text-left">
                    Shift Date
                  </th>

                  <th className="px-5 py-4 text-left">
                    First Check In
                  </th>

                  <th className="px-5 py-4 text-left">
                    Last Check Out
                  </th>

                  <th className="px-5 py-4 text-left">
                    Total Work Hours
                  </th>

                </tr>

              </thead>


              <tbody>

                {logs.map(log => (

                  <tr
                    key={log.id}
                    className="border-t hover:bg-slate-50"
                  >

                    <td className="px-5 py-4">

                      {new Date(
                        log.date
                      ).toLocaleDateString(
                        'en-IN'
                      )}

                    </td>


                    <td className="px-5 py-4 font-medium">

                      {formatTime(
                        log.checkIn
                      )}

                    </td>


                    <td className="px-5 py-4 font-medium">

                      {formatTime(
                        log.checkOut
                      )}

                    </td>


                    <td className="px-5 py-4">

                      <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">

                        {formatHours(
                          Number(
                            log.hours || 0
                          )
                        )}

                      </span>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  )
}