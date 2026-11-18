import { useEffect, useState } from 'react'

export function useActiveSection(ids: readonly string[], initial: string): string {
  const [active, setActive] = useState(initial)

  useEffect(() => {
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => Boolean(node))

    if (!nodes.length || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visible.length) setActive(visible[0].target.id)
      },
      { rootMargin: '-28% 0px -62% 0px', threshold: 0 },
    )

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [ids])

  return active
}
