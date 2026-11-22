// The state every screen needs: settings, today's date (kept current across midnight and app switches), the plan
// calendar for a date, and the history for statuses and the streak.
import { useEffect, useMemo, useState } from 'react'
import { plan } from '@/data/plan'
import { planDay } from './calendar'
import { addDays, compareDates, type LocalDate, today } from './dates'
import { useLive } from './live'
import type { DayRecord } from './records'
import { getAllDays, getSettings } from './repo'
import { currentStreak, type DayStatus, dayStatus } from './status'

export function useToday(): LocalDate {
  const [t, setT] = useState(() => today())
  useEffect(() => {
    const refresh = () => setT(today())
    const id = window.setInterval(refresh, 60_000)
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])
  return t
}

export function useSettings() {
  return useLive(getSettings, [])
}

export function useAllDays() {
  return useLive(getAllDays, [])
}

export interface History {
  week0: LocalDate
  statusOf: (date: LocalDate) => DayStatus
  streak: number
  days: ReadonlyMap<LocalDate, DayRecord>
}

export function useHistory(startDate: LocalDate | undefined, todayDate: LocalDate): History | undefined {
  const days = useAllDays()
  return useMemo(() => {
    if (!startDate || !days) return undefined
    const week0 = addDays(startDate, -7)
    const statusOf = (d: LocalDate) => dayStatus(days.get(d), d, todayDate, week0)
    const streak = compareDates(todayDate, week0) < 0 ? 0 : currentStreak(statusOf, todayDate, week0)
    return { week0, statusOf, streak, days }
  }, [startDate, days, todayDate])
}

export function planDayOf(startDate: LocalDate, date: LocalDate) {
  return planDay(startDate, date, plan.blockRules)
}
