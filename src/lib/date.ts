import { startOfDay } from './format'

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return startOfDay(next)
}

export function addMonthsClamped(date: Date, months: number): Date {
  const firstOfTarget = new Date(date.getFullYear(), date.getMonth() + months, 1)
  const lastDay = new Date(
    firstOfTarget.getFullYear(),
    firstOfTarget.getMonth() + 1,
    0,
  ).getDate()
  return new Date(
    firstOfTarget.getFullYear(),
    firstOfTarget.getMonth(),
    Math.min(date.getDate(), lastDay),
  )
}

export function addYearsClamped(date: Date, years: number): Date {
  const target = new Date(date.getFullYear() + years, date.getMonth(), 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), lastDay))
}

export function startOfWeekMonday(date: Date): Date {
  const day = (date.getDay() + 6) % 7
  return addDays(date, -day)
}

export function endOfWeekSunday(date: Date): Date {
  return addDays(startOfWeekMonday(date), 6)
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`
}

export function isoDate(date: Date): string {
  return dateKey(date)
}

/** Six weeks starting on Monday, including leading/trailing days. */
export function getCalendarDays(viewDate: Date): Date[] {
  const first = startOfMonth(viewDate)
  const start = startOfWeekMonday(first)
  return Array.from({ length: 42 }, (_, index) => addDays(start, index))
}
