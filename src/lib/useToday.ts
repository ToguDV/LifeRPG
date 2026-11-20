import { useEffect, useState } from 'react'
import { startOfDay } from './format'

/**
 * The start of today, refreshed at midnight and whenever the tab becomes
 * visible or focused again. A journal left open overnight must not keep
 * yesterday's dates under today's heading.
 *
 * The returned `Date` keeps its identity until the day actually changes, so
 * a consumer can pass it straight into its dependencies.
 */
export function useToday(): Date {
  const [today, setToday] = useState(() => startOfDay(new Date()))

  useEffect(() => {
    let timer = 0

    const refresh = () => {
      setToday((current) => {
        const next = startOfDay(new Date())
        return next.getTime() === current.getTime() ? current : next
      })
    }

    /* Re-arm after each fire: the next midnight is a fresh offset. */
    const scheduleMidnight = () => {
      const now = new Date()
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      timer = window.setTimeout(
        () => {
          refresh()
          scheduleMidnight()
        },
        Math.max(1000, next.getTime() - now.getTime() + 1000),
      )
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh()
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', refresh)
    scheduleMidnight()

    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  return today
}
