const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

const monthFormatter = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric',
})

const shortDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
})

const sizeFormatter = new Intl.NumberFormat('en-GB', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
})

export function formatDate(date: Date): string {
  return dateFormatter.format(date)
}

export function formatMonth(date: Date): string {
  return monthFormatter.format(date)
}

/** Compact date for rails and chips: “12 Jan”. Never carries the year. */
export function formatShortDate(date: Date): string {
  return shortDateFormatter.format(date).replace(/\.$/, '')
}

export function formatTimeParts(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/** “12 January 2026 · 14:32”: a full date with the clock, for a stamp. */
export function formatMoment(date: Date): string {
  return `${formatDate(date)} · ${formatTimeParts(date.getHours(), date.getMinutes())}`
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${sizeFormatter.format(value)} ${units[unit]}`
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
